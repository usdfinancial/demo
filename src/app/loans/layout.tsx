import { AppShell } from "@/components/AppShell";

export default function LoansLayout({
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