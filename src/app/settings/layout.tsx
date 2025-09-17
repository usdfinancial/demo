import { Metadata } from 'next'
import { AppShell } from "@/components/AppShell"

export const metadata: Metadata = {
  title: 'Settings & Preferences - USD Financial',
  description: 'Customize your USD Financial experience - notifications, display, privacy, and feature preferences',
}

export default function SettingsLayout({
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