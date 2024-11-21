"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
};

interface NavigationTabsProps {
  items: NavItem[];
  optionalPathname?: string;
}

const NavigationTabs: React.FC<NavigationTabsProps> = ({
  items,
  optionalPathname,
}) => {
  const pathname = usePathname();

  return (
    <div
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground"
      )}
    >
      {items.map((item) => {
        const isActive = (optionalPathname ?? pathname) === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 min-w-20",
              isActive
                ? "bg-zinc-950 text-white shadow-sm"
                : "hover:bg-background/50 hover:text-foreground"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
};

export { NavigationTabs };
export type { NavItem };
