
import { Metadata } from 'next'
import { AppShell } from "@/components/AppShell"

export const metadata: Metadata = {
  title: 'Identity Verification - USD Financial',
  description: 'Complete your identity verification to unlock full access to USD Financial features',
}

export default function KycLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AppShell>
      {children}
    </AppShell>
  )
}
