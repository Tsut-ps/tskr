import { Separator } from "@/components/ui/separator";
import { SidebarNav } from "./sidebar-nav";

const sidebarDefaultNavItems = [
  {
    title: "プロフィール",
    href: "/settings",
  },
  {
    title: "アカウント",
    href: "/settings/account",
  },
  {
    title: "通知",
    href: "/settings/notifications",
  },
  {
    title: "Discord Webhook",
    href: "/settings/webhook",
  },
];

export default function SettingsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { projectSlug: string };
}) {
  const projectSlug = params.projectSlug as string;

  // プロジェクト固有のリンクに変換 (設定はプロジェクトごとにある)
  const sidebarNavItems = sidebarDefaultNavItems.map((item) => ({
    ...item,
    href: `/p/${projectSlug}${item.href}`,
  }));

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:py-8 w-full max-w-screen-xl">
      <div className="space-y-6">
        <div className="space-y-0.5">
          <h2 className="text-3xl font-bold tracking-tight">設定</h2>
          <p className="text-muted-foreground">
            ここに入力した内容はサーバーに保存されます。
          </p>
        </div>
        <Separator className="my-6" />
        <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
          <aside className="-mx-2 w-full lg:w-1/5 overflow-x-auto lg:overflow-x-visible">
            <SidebarNav items={sidebarNavItems} />
          </aside>
          <div className="w-full flex-1">{children}</div>
        </div>
      </div>
    </main>
  );
}
