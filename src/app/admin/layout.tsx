import { requireAdmin } from "@/server/session";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  await requireAdmin();
  return <div className="space-y-6">{children}</div>;
}
