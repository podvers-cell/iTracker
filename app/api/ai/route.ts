import OpenAI from "openai"

import { verifyFirebaseIdToken } from "@/lib/auth/verifyFirebaseIdToken"

/**
 * AI provider order (only one runs per request):
 * 1) Gemini — if `GEMINI_API_KEY` is set (recommended for this app).
 * 2) DeepSeek — if `DEEPSEEK_API_KEY` is set and Gemini is not.
 * 3) OpenAI — otherwise, if `OPENAI_API_KEY` is set.
 */
/** Client sends enriched project + transaction snapshot; cap size to protect providers. */
const MAX_CONTEXT_JSON_CHARS = 120_000

/** Default fast model for Google AI Studio (`generativelanguage.googleapis.com`). Override with `GEMINI_MODEL`. */
const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash"

type Body = {
  message?: string
  locale?: "ar" | "en"
  context?: unknown
}

/** Turn Gemini/Google error text into a short, localized hint (especially quota / free tier). */
function formatGeminiApiError(rawMessage: string, httpStatus: number, locale: "ar" | "en"): string {
  const m = rawMessage.toLowerCase()
  const quotaOrRate =
    httpStatus === 429 ||
    m.includes("quota") ||
    m.includes("resource_exhausted") ||
    m.includes("free_tier") ||
    m.includes("rate limit") ||
    m.includes("exceeded your current quota") ||
    m.includes("too many requests")

  if (quotaOrRate) {
    return locale === "ar"
      ? "تم تجاوز حد طلبات Gemini على الخطة المجانية (حدٌّ صارم مثل عشرات الطلبات يومياً حسب نوع الموديل). انتظر ثم أعد المحاولة، أو فعّل الفوترة لرفع الحد في Google AI Studio أو Google Cloud. مرجع: https://ai.google.dev/gemini-api/docs/rate-limits"
      : "Gemini quota or free-tier request limit was hit (daily caps apply). Wait and retry, or enable billing in Google AI Studio / Google Cloud to raise limits. See https://ai.google.dev/gemini-api/docs/rate-limits"
  }

  return rawMessage
}

export async function POST(req: Request) {
  try {
    const auth = req.headers.get("authorization") || ""
    const token = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : ""
    if (!token) return Response.json({ error: "Unauthorized" }, { status: 401 })

    await verifyFirebaseIdToken(token)

    let body: Body
    try {
      body = (await req.json()) as Body
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 })
    }

    const message = (body.message || "").trim()
    const locale = body.locale === "en" ? "en" : "ar"
    const context = body.context ?? {}
    const contextStr = JSON.stringify(context)
    const contextBlock =
      contextStr.length > MAX_CONTEXT_JSON_CHARS
        ? contextStr.slice(0, MAX_CONTEXT_JSON_CHARS) +
          `\n…[context truncated at ${MAX_CONTEXT_JSON_CHARS} chars]`
        : contextStr

    if (!message) return Response.json({ error: "Missing message" }, { status: 400 })

    const geminiKey = process.env.GEMINI_API_KEY
    const deepseekKey = process.env.DEEPSEEK_API_KEY
    const openaiKey = process.env.OPENAI_API_KEY
    const useGemini = Boolean(geminiKey)
    const useDeepSeek = Boolean(deepseekKey) && !useGemini

    if (!useGemini && !useDeepSeek && !openaiKey) {
      const msg =
        locale === "ar"
          ? "لم يُضبط مفتاح Gemini على الخادم. أضِف GEMINI_API_KEY في إعدادات الاستضافة (مثل Vercel). OpenAI و DeepSeek اختياريان فقط إن لم تستخدم Gemini."
          : "GEMINI_API_KEY is not set on the server. Add it in your host environment (e.g. Vercel). OpenAI and DeepSeek are optional fallbacks only."
      return Response.json({ error: msg }, { status: 503 })
    }

    const client = !useGemini
      ? new OpenAI(
          useDeepSeek
            ? {
                apiKey: deepseekKey,
                baseURL: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/v1",
              }
            : { apiKey: openaiKey! }
        )
      : null

    const model = useGemini
      ? (process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL).trim()
      : useDeepSeek
        ? process.env.DEEPSEEK_MODEL || "deepseek-chat"
        : process.env.OPENAI_MODEL || "gpt-4o-mini"

    const instructions =
      locale === "ar"
        ? [
            "أنت مساعد ذكي لتطبيق iTrack لمتابعة التشطيبات.",
            "تحدث بالعربية بوضوح وبشكل عملي وبنقاط قصيرة.",
            "عندما تكون هناك أرقام، استخدم عملة الدرهم الإماراتي (AED).",
            "اعتمد فقط على حقل projects و recentTransactions و totals في السياق. لا تخمن مشروعاً أو رقماً غير وارد.",
            "إذا غابت المعلومة في السياق، قل ذلك صراحة واسأل سؤال توضيح واحد فقط إن لزم.",
          ].join("\n")
        : [
            "You are an AI assistant for iTrack (finishing tracker).",
            "Be concise, practical, and use short bullet points.",
            "Use AED currency for amounts.",
            "Answer only from the context fields `projects`, `recentTransactions`, and `totals`. Do not invent projects or numbers.",
            "If something is not in the context, say so; ask at most one clarifying question if needed.",
          ].join("\n")

    const promptText =
      (locale === "ar" ? "السياق:\n" : "Context:\n") +
      contextBlock +
      (locale === "ar" ? "\n\nسؤالي:\n" : "\n\nMy question:\n") +
      message

    if (useGemini) {
      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
          model
        )}:generateContent?key=${encodeURIComponent(geminiKey as string)}`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: promptText }] }],
            systemInstruction: { parts: [{ text: instructions }] },
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 8192,
            },
            safetySettings: [
              { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
              { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
              { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
              { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
            ],
          }),
        }
      )

      const geminiData = (await geminiRes.json()) as any
      if (!geminiRes.ok) {
        const raw =
          geminiData?.error?.message ||
          geminiData?.error?.status ||
          `Gemini request failed (${geminiRes.status})`
        const rawStr = String(raw)
        const emsg = formatGeminiApiError(rawStr, geminiRes.status, locale)
        const lower = rawStr.toLowerCase()
        const treatAsRateLimit =
          geminiRes.status === 429 ||
          lower.includes("quota") ||
          lower.includes("resource_exhausted")
        const statusOut = treatAsRateLimit
          ? 429
          : geminiRes.status >= 400 && geminiRes.status < 600
            ? geminiRes.status
            : 502
        return Response.json({ error: emsg }, { status: statusOut })
      }

      const cand = geminiData?.candidates?.[0]
      const text =
        cand?.content?.parts
          ?.map((p: { text?: string }) => p?.text)
          .filter(Boolean)
          .join("\n") ?? ""

      if (!text) {
        const reason = cand?.finishReason || geminiData?.promptFeedback?.blockReason || "unknown"
        const emsg =
          locale === "ar"
            ? `لم يُرجع النموذج نصاً (السبب: ${reason}). جرّب سؤالاً أقصر أو غيّر GEMINI_MODEL.`
            : `Model returned no text (reason: ${reason}). Try a shorter question or set GEMINI_MODEL.`
        return Response.json({ error: emsg }, { status: 502 })
      }

      return Response.json({ text })
    }

    if (useDeepSeek) {
      const r = await client!.chat.completions.create({
        model,
        messages: [
          { role: "system", content: instructions },
          { role: "user", content: promptText },
        ],
        temperature: 0.3,
      })

      const text = r.choices?.[0]?.message?.content ?? ""
      if (!text) {
        return Response.json(
          {
            error:
              locale === "ar"
                ? "ردّ النموذج فارغ. تحقق من المفتاح والاسم DEEPSEEK_MODEL."
                : "Empty model response. Check API key and DEEPSEEK_MODEL.",
          },
          { status: 502 }
        )
      }
      return Response.json({ text })
    }

    // OpenAI: chat.completions is the most compatible path (works with gpt-4o-mini, gpt-4o, etc.).
    const useResponsesApi = process.env.OPENAI_USE_RESPONSES_API === "1"
    if (useResponsesApi) {
      const r = await client!.responses.create({
        model,
        input: [
          { role: "system", content: instructions },
          { role: "user", content: promptText },
        ],
      })
      const text = r.output_text ?? ""
      if (text) return Response.json({ text })
    }

    const chat = await client!.chat.completions.create({
      model,
      messages: [
        { role: "system", content: instructions },
        { role: "user", content: promptText },
      ],
      temperature: 0.3,
    })

    const text = chat.choices?.[0]?.message?.content ?? ""
    if (!text) {
      return Response.json(
        {
          error:
            locale === "ar"
              ? "ردّ OpenAI فارغ. تحقق من OPENAI_API_KEY وOPENAI_MODEL (مثلاً gpt-4o-mini)."
              : "Empty OpenAI response. Check OPENAI_API_KEY and OPENAI_MODEL (e.g. gpt-4o-mini).",
        },
        { status: 502 }
      )
    }

    return Response.json({ text })
  } catch (e: any) {
    const msg = String(e?.message || "Error")
    const upstreamStatus = Number(e?.status)
    const status = Number.isFinite(upstreamStatus)
      ? upstreamStatus
      : msg === "Forbidden"
        ? 403
        : msg === "Unauthorized"
          ? 401
          : 500
    return Response.json({ error: msg }, { status })
  }
}

