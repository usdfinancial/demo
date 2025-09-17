import { AppShell } from "@/components/AppShell";

export default function SwapLayout({
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