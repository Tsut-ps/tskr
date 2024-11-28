"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { calcDaysLeft, getDateColor } from "@/utils/date";
import { toast } from "@/hooks/use-toast";

import { updateTaskDate } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function DatePickerWithRange({
  className,
  taskId,
  startDate,
  dueDate,
}: {
  className?: React.HTMLAttributes<HTMLDivElement>;
  projectSlug: string;
  taskId: string;
  startDate: string | undefined;
  dueDate: string | undefined;
}) {
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: startDate ? new Date(startDate) : undefined,
    to: dueDate ? new Date(dueDate) : undefined,
  });

  const handleUpdateDate = async (newDate: DateRange | undefined) => {
    const preValue = date;
    setDate(newDate);

    // 開始日と期限日が選択されている場合のみ更新
    if (!newDate?.from || !newDate?.to) return;
    const startDate = format(newDate.from, "yyyy-MM-dd");
    const dueDate = format(newDate.to, "yyyy-MM-dd");
    const errorCode = await updateTaskDate(
      taskId,
      startDate,
      dueDate
    );
    if (errorCode) {
      setDate(preValue); // 失敗時に元に戻す
      toast({
        variant: "destructive",
        title: "日付の更新に失敗しました。",
        description: `何度も続く場合は管理者に連絡してください。(${errorCode})`,
      });
    } else {
      toast({
        title: "更新済み",
        description: "日付を更新しました。",
      });
    }
  };

  return (
    <div className={cn("grid gap-2 -my-2 -ml-4", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="ghost"
            className={cn(
              "justify-start text-left font-normal flex-wrap min-h-min",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "M月d日")}
                  <ChevronRight />
                  {format(date.to, "M月d日")}
                  <span
                    className={cn(
                      "text-muted-foreground",
                      getDateColor(date.to.toString())
                    )}
                  >
                    {
                      // 残り日数が0日未満の場合は「(期限切れ)」と表示
                      calcDaysLeft(date.to.toString()) < 0
                        ? "(期限切れ)"
                        : `(残り${calcDaysLeft(date.to.toString())}日)`
                    }
                  </span>
                </>
              ) : (
                <>
                  <span className="text-muted-foreground">
                    {format(date.from, "M月d日")}
                  </span>
                  <ChevronRight />
                  <span className="text-red-500">日付を選択</span>
                </>
              )
            ) : (
              <span className="text-red-500">日付を選択</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleUpdateDate}
            numberOfMonths={1}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
