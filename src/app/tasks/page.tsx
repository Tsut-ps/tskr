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
  // UST使用時も日本時間の日付を取得
  const jstDate = new Date().toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo",
  });
  const nowDate = new Date(jstDate);
  console.log(nowDate, nowDate.getDate());

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

  const getDueDay = (dueDate: string) => {
    const date = new Date(dueDate).getDate();
    const due = date - nowDate.getDate();
    // console.log(now, date, due);

    return Math.floor(due);
  };

  const getDateColor = (dueDate: string) => {
    const dueDay = getDueDay(dueDate);
    if (dueDay <= 0) return "text-red-500";
    if (dueDay <= 7) return "text-yellow-500";
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
                      <p className="text-sm font-medium leading-none py-1">
                        {task.title}
                      </p>
                      <div className="flex flex-wrap gap-1">
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
                        残り{getDueDay(task.due_date)}日
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
