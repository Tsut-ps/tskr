"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { calcDaysLeft, getDateColor } from "@/utils/date";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function DatePickerWithRange({
  className,
  startDate,
  dueDate,
}: {
  className?: React.HTMLAttributes<HTMLDivElement>;
  startDate: string;
  dueDate: string;
}) {
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: new Date(startDate),
    to: new Date(dueDate),
  });

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
                format(date.from, "M月d日")
              )
            ) : (
              <span>日付を選択</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={setDate}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
