import type { Metadata } from "next"

import { InstallLanding } from "@/components/pwa/InstallLanding"

export const metadata: Metadata = {
  title: "Install iTracker",
  description: "Add iTracker to your Home Screen or install on desktop.",
}

export default function InstallPage() {
  return <InstallLanding />
}
