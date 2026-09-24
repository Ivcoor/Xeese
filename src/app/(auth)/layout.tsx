export default function AuthLayout({ children }: LayoutProps<"/">) {
  return <div className="mx-auto max-w-sm space-y-6">{children}</div>;
}
