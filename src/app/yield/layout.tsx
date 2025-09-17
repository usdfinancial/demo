import { AppShell } from '@/components/AppShell'

export default function YieldLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AppShell>{children}</AppShell>
}