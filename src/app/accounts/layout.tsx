import { Metadata } from 'next'
import { AppShell } from "@/components/AppShell"

export const metadata: Metadata = {
  title: 'Accounts - USD Financial',
  description: 'Manage your stablecoin accounts, earn interest, and handle fiat transactions',
}

export default function AccountsLayout({
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