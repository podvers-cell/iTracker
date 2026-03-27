import type { Metadata } from "next"

import { InstallLanding } from "@/components/pwa/InstallLanding"

export const metadata: Metadata = {
  title: "iTracker — Install",
  description: "Install iTracker on your phone or desktop. Track finishing projects, customers, and finances.",
  openGraph: {
    title: "iTracker",
    description: "Install iTracker — finishing tracker for projects and finances.",
  },
}

export default function Home() {
  return <InstallLanding />
}
