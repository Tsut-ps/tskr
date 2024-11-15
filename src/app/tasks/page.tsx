import Link from "next/link";
import clsx from "clsx";
import { createClient } from "@/utils/supabase/server";

import {
  Card,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const project_id: string = process.env.NEXT_PUBLIC_PROJECT_ID!;

export default async function Page() {
  // サーバーがUST使用時も日本時間の日付を取得
  const jstNowDate = new Date().toLocaleDateString("ja-JP", {
    timeZone: "Asia/Tokyo",
  });
  const nowDate = new Date(jstNowDate);
  
  // 地方時に基づく月日の確認
  console.log(nowDate, nowDate.getMonth() + 1 + "月", nowDate.getDate() + "日");

  const supabase = await createClient();

  // 外部キーに基づく関係の自動検出
  const { data: teams } = await supabase
    .from("teams")
    .select(
      `
      *,
      tasks(*, 
        tags(*)
      )
    `
    )
    .eq("project_id", project_id);

  const calcDaysLeft = (dueDate: string) => {
    // サーバーがUST使用時も日本時間の日付で計算
    const jstDueDate = new Date(dueDate).toLocaleDateString("ja-JP", {
      timeZone: "Asia/Tokyo",
    });
    const due = new Date(jstDueDate);
    const diffTime = due.getTime() - nowDate.getTime(); // 差分時間(ミリ秒)
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getDateColor = (dueDate: string) => {
    const daysLeft = calcDaysLeft(dueDate);
    if (daysLeft <= 0) return "text-red-500";
    if (daysLeft <= 7) return "text-yellow-500";
    return "";
  };

  return (
    <main className="flex gap-4 p-4 md:gap-6 md:py-8 overflow-x-auto w-full scrollbar-hide">
      {teams?.map((team, index) => (
        <div key={index} className="w-96 flex-none">
          <div className="flex flex-row items-center p-3">
            <div className="grid gap-1">
              <CardTitle className="text-xl font-medium">{team.name}</CardTitle>
              <CardDescription>{team.tasks?.length}件のタスク</CardDescription>
            </div>
            <Button asChild size="sm" className="ml-auto gap-1">
              <Link href="#">
                新規
                <Plus className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid gap-2">
            {team.tasks?.map((task, index) => (
              <Card key={index}>
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <div className="grid gap-2">
                      <p className="text-sm font-medium leading-none pt-1">
                        {task.title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {task.start_date}→{task.due_date}
                      </p>
                      <div className="flex flex-wrap gap-1 pt-1">
                        {task.tags?.map((tag, index) => (
                          <Badge key={index} variant="secondary">
                            {tag.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    {
                      <div
                        className={clsx("ml-auto", getDateColor(task.due_date))}
                      >
                        残り{calcDaysLeft(task.due_date)}日
                      </div>
                    }
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </main>
  );
}
