"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useMediaQuery } from "@/hooks/use-media-query";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

export function Modal({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(true);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const onDismiss = () => {
    setOpen(false);
    setTimeout(() => router.back(), 100);
  };

  return (
    <Sheet open={open} onOpenChange={onDismiss}>
      <SheetContent side={isDesktop ? "right" : "bottom"}>
        <SheetHeader>
          <SheetTitle>タスクを編集</SheetTitle>
          <SheetDescription asChild>
            プロジェクトのタスクを編集
          </SheetDescription>
          <Separator className="!my-4" />
          {children}
        </SheetHeader>
      </SheetContent>
    </Sheet>
  );
}
