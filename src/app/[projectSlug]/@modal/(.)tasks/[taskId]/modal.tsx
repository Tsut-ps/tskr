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

export function Modal({
  children,
  TaskTitle,
  createdTime,
  updatedTime,
  isSameDate,
}: {
  children: React.ReactNode;
  TaskTitle: string;
  createdTime: string;
  updatedTime: string;
  isSameDate: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(true);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const onDismiss = () => {
    setOpen(false);
    setTimeout(() => router.back(), 100);
  };

  return (
    <Sheet open={open} onOpenChange={onDismiss}>
      <SheetContent
        className="md:!max-w-[600px]"
        side={isDesktop ? "right" : "bottom"}
      >
        <SheetHeader>
          <SheetTitle>{TaskTitle}</SheetTitle>
          <SheetDescription>
            {isSameDate
              ? `作成日時: ${createdTime}`
              : `更新日時: ${updatedTime}`}
          </SheetDescription>
        </SheetHeader>
        {children}
      </SheetContent>
    </Sheet>
  );
}
