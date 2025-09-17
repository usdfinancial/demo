import { AppShell } from "@/components/AppShell";

export default function CardsLayout({
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