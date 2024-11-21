"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import clsx from "clsx";

import { NavigationTabs } from "@/components/ui/tabs-navigation";

interface NavLinkProps {
  items: { link: string; label: string }[];
}

// PC版のナビゲーション
export function ClientTabNavLink({ items }: NavLinkProps) {
  const { projectSlug } = useParams();

  // 4つ目のスラッシュより前のパスを取得
  const pathname = usePathname().split("/").slice(0, 4).join("/");

  const navItems = items.map((item) => ({
    href: `/${projectSlug}${item.link}`,
    label: item.label,
  }));

  return <NavigationTabs items={navItems} optionalPathname={pathname} />;
}

// モバイル版のナビゲーション
export function ClientNavLink({ items }: NavLinkProps) {
  const { projectSlug } = useParams();

  // 4つ目のスラッシュより前のパスを取得
  const pathname = usePathname().split("/").slice(0, 4).join("/");

  return (
    <>
      {items.map((item) => {
        const href = `/${projectSlug}${item.link}`;
        const isActive = pathname === href;

        return (
          <Link
            key={item.link}
            href={href}
            className={clsx(
              "transition-colors hover:text-foreground",
              isActive ? "text-foreground" : "text-muted-foreground"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </>
  );
}
