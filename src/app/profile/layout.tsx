import { Metadata } from 'next'
import { AppShell } from "@/components/AppShell"

export const metadata: Metadata = {
  title: 'Profile & Account - USD Financial',
  description: 'Manage your profile, account settings, security, and preferences',
}

export default function ProfileLayout({
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