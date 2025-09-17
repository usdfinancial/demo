import { AppShell } from "@/components/AppShell";

export default function BusinessLayout({
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