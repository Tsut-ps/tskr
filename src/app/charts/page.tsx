"use client";
import Link from "next/link";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Page() {
  const currentDate = new Date();
  const currentMonthIndex = currentDate.getMonth(); // 現在の月 (0から始まる)
  const currentYear = currentDate.getFullYear(); // 現在の年

  // 現在の月の日数を取得
  const getDaysInMonth = () => {
    return new Date(currentYear, currentMonthIndex + 1, 0).getDate(); // 翌月の0日 = 当月の最終日
  };

  // 日付の配列を生成
  const daysArray = () => {
    const daysInMonth = getDaysInMonth();
    const days = [...Array(daysInMonth)].map((_, i) => i + 1);
    return days;
  };

  return (
    <main className="flex flex-col gap-4 p-4 md:gap-6 md:py-8 overflow-x-auto w-full">
      <div className="flex justify-between w-full">
        <h2 className="mt-10 scroll-m-20 text-3xl font-semibold tracking-tight transition-colors first:mt-0">
          タイムライン
        </h2>
        <div className="flex items-center">
          <Button asChild size="sm" variant="ghost">
            <Link href="#">
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="sm" className="gap-1" variant="outline">
            <Link href="#">
              <Calendar className="h-4 w-4" />
              {currentYear}年{currentMonthIndex + 1}月
            </Link>
          </Button>
          <Button asChild size="sm" variant="ghost">
            <Link href="#">
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
      <Card className="w-full">
        <CardContent className="p-0">
          <div className="relative">
            <div className="grid grid-flow-col overflow-x-auto">
              {daysArray().map((day) => (
                <div
                  key={day}
                  className="flex items-center justify-center text-xs w-8 h-8"
                >
                  {day}
                </div>
              ))}
            </div>
            <div className="relative h-8">
              <div>
                <div>ここにコンテンツ</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
