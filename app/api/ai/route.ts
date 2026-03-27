import OpenAI from "openai"

type Body = {
  message?: string
  locale?: "ar" | "en"
  context?: any
}

async function verifyFirebaseIdTokenOrThrow(idToken: string) {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY
  if (!apiKey) throw new Error("Firebase API key not configured")

  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ idToken }),
    }
  )

  const data = (await res.json()) as any
  if (!res.ok) {
    throw new Error(data?.error?.message || "Invalid token")
  }

  const uid = data?.users?.[0]?.localId as string | undefined
  if (!uid) throw new Error("Invalid token")

  const adminUid = process.env.ADMIN_UID
  if (!adminUid) throw new Error("ADMIN_UID is not set")
  if (uid !== adminUid) throw new Error("Forbidden")

  return uid
}

export async function POST(req: Request) {
  try {
    const auth = req.headers.get("authorization") || ""
    const token = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : ""
    if (!token) return Response.json({ error: "Unauthorized" }, { status: 401 })

    await verifyFirebaseIdTokenOrThrow(token)

    const body = (await req.json()) as Body
    const message = (body.message || "").trim()
    const locale = body.locale === "en" ? "en" : "ar"
    const context = body.context ?? {}

    if (!message) return Response.json({ error: "Missing message" }, { status: 400 })

    const geminiKey = process.env.GEMINI_API_KEY
    const deepseekKey = process.env.DEEPSEEK_API_KEY
    const openaiKey = process.env.OPENAI_API_KEY
    const useGemini = Boolean(geminiKey)
    const useDeepSeek = Boolean(deepseekKey) && !useGemini

    const client = !useGemini
      ? new OpenAI(
          useDeepSeek
            ? {
                apiKey: deepseekKey,
                baseURL: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/v1",
              }
            : { apiKey: openaiKey }
        )
      : null

    const model = useGemini
      ? process.env.GEMINI_MODEL || "gemini-2.5-flash"
      : useDeepSeek
        ? process.env.DEEPSEEK_MODEL || "deepseek-chat"
        : process.env.OPENAI_MODEL || "gpt-5.2"

    const instructions =
      locale === "ar"
        ? [
            "أنت مساعد ذكي لتطبيق iTracker لمتابعة التشطيبات.",
            "تحدث بالعربية بوضوح وبشكل عملي وبنقاط قصيرة.",
            "عندما تكون هناك أرقام، استخدم عملة الدرهم الإماراتي (AED).",
            "اعتمد على سياق البيانات المرسل، وإذا كانت البيانات ناقصة اسأل سؤال واحد فقط للتوضيح.",
          ].join("\n")
        : [
            "You are an AI assistant for iTracker (finishing tracker).",
            "Be concise, practical, and use short bullet points.",
            "Use AED currency for amounts.",
            "Use the provided context; if context is insufficient, ask only one clarifying question.",
          ].join("\n")

    const promptText =
      (locale === "ar" ? "السياق:\n" : "Context:\n") +
      JSON.stringify(context).slice(0, 12000) +
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
            },
          }),
        }
      )

      const geminiData = (await geminiRes.json()) as any
      if (!geminiRes.ok) {
        const emsg =
          geminiData?.error?.message ||
          geminiData?.error?.status ||
          `Gemini request failed (${geminiRes.status})`
        return Response.json({ error: emsg }, { status: geminiRes.status })
      }

      const text =
        geminiData?.candidates?.[0]?.content?.parts
          ?.map((p: any) => p?.text)
          .filter(Boolean)
          .join("\n") ?? ""

      return Response.json({ text })
    }

    if (useDeepSeek) {
      // DeepSeek is OpenAI-compatible via chat.completions.
      const r = await client!.chat.completions.create({
        model,
        messages: [
          { role: "system", content: instructions },
          { role: "user", content: promptText },
        ],
        temperature: 0.3,
      })

      const text = r.choices?.[0]?.message?.content ?? ""
      return Response.json({ text })
    }

    const r = await client!.responses.create({
      model,
      input: [
        { role: "system", content: instructions },
        { role: "user", content: promptText },
      ],
    })

    return Response.json({ text: r.output_text ?? "" })
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

