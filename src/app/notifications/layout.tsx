import { Metadata } from 'next'
import { AppShell } from "@/components/AppShell"

export const metadata: Metadata = {
  title: 'Notifications | USD Financial',
  description: 'Stay informed with global financial notifications, security alerts, and market updates from USD Financial.',
}

export default function NotificationsLayout({
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