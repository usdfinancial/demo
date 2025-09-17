import { AppShell } from "@/components/AppShell";

export default function InvestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell>
      {children}
    </AppShell>
  );
}