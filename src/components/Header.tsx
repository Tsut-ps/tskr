import Link from "next/link";
import { CircleUser, Menu, Package2, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ProjectCombobox } from "@/components/ProjectCombobox";
import { ClientTabNavLink, ClientNavLink } from "@/components/ClientNavLink";

type NavItem = {
  link: string;
  label: string;
};

const navItems: NavItem[] = [
  { link: "", label: "全体" },
  { link: "/tasks", label: "タスク" },
  //  { link: "/charts", label: "チャート" },
  { link: "/settings", label: "設定" },
];

export function Header({ isProejctPage = false }: { isProejctPage?: boolean }) {
  return (
    <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 whitespace-nowrap">
      <Link
        href="/"
        className="flex items-center gap-2 text-lg font-semibold md:text-base"
      >
        <Package2 className="h-6 w-6" />
        <span className="sr-only">tskr</span>
      </Link>
      <span className="hidden md:block">
        <ProjectCombobox />
      </span>
      {isProejctPage && (
        <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
          <ClientTabNavLink items={navItems} />
        </nav>
      )}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="shrink-0 md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">ナビゲーションメニュー切り替え</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 text-lg font-semibold">
              <Package2 className="h-6 w-6" />
              tskr
            </SheetTitle>
            <SheetDescription className="sr-only">
              プロジェクト内メニュー
            </SheetDescription>
          </SheetHeader>
          <nav className="grid mt-6 gap-6 text-lg font-medium">
            <ProjectCombobox />
            {isProejctPage && <ClientNavLink items={navItems} />}
          </nav>
        </SheetContent>
      </Sheet>
      {isProejctPage && (
        <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
          <form className="ml-auto flex-1 sm:flex-initial">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="タスクを検索"
                className="pl-8 sm:w-[240px] md:w-[180px] lg:w-[240px]"
              />
            </div>
          </form>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full">
                <CircleUser className="h-5 w-5" />
                <span className="sr-only">ユーザーメニュー</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Name</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <Link href="about">
                <DropdownMenuItem>tskr について</DropdownMenuItem>
              </Link>
              <DropdownMenuSeparator />
              <DropdownMenuItem>ログアウト</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </header>
  );
}
