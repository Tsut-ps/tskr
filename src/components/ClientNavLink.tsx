"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import clsx from "clsx";

import { NavigationTabs } from "@/components/ui/tabs-navigation";

interface NavLinkProps {
  items: { link: string; label: string }[];
}

// プロジェクトIDの前に付与するパス
const prefix = "/p/";

// PC版のナビゲーション
export function ClientTabNavLink({ items }: NavLinkProps) {
  const { projectSlug } = useParams();

  const navItems = items.map((item) => ({
    href: `${prefix}${projectSlug}${item.link}`,
    label: item.label,
  }));

  return <NavigationTabs items={navItems} />;
}

// モバイル版のナビゲーション
export function ClientNavLink({ items }: NavLinkProps) {
  const { projectSlug } = useParams();
  const pathname = usePathname();

  return (
    <>
      {items.map((item) => {
        const href = `${prefix}${projectSlug}${item.link}`;
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
