import { redirect } from "next/navigation"

/** Assistant UI is disabled for now; re-enable the chat page when the product is ready. */
export default function AssistantPage() {
  redirect("/dashboard")
}
