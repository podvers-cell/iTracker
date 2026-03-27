import type { Metadata } from "next"

import { InstallLanding } from "@/components/pwa/InstallLanding"

export const metadata: Metadata = {
  title: "iTrack — Install",
  description: "Install iTrack on your phone or desktop. Track finishing projects, customers, and finances.",
  openGraph: {
    title: "iTrack",
    description: "Install iTrack — finishing tracker for projects and finances.",
  },
}

export default function Home() {
  return <InstallLanding />
}
