import { AppShell } from "@/components/AppShell";

export default function EarnLayout({
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