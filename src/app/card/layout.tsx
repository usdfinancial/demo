import { AppShell } from "@/components/AppShell";

export default function CardLayout({
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