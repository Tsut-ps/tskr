import Link from "next/link";
import clsx from "clsx";
import {
  Activity,
  ArrowUpRight,
  CheckCircle,
  SquarePen,
  TriangleAlert,
} from "lucide-react";
import { createClient } from "@/utils/supabase/server";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const project_id: string = process.env.NEXT_PUBLIC_PROJECT_ID!;

export default async function Page() {
  // サーバーがUST使用時も日本時間の日付を取得
  const jstNowDate = new Date().toLocaleDateString("ja-JP", {
    timeZone: "Asia/Tokyo",
  });
  const nowDate = new Date(jstNowDate);

  const supabase = await createClient();

  const { data: tasks } = await supabase
    .from("tasks")
    .select("*, tags(*), teams(name)")
    .eq("project_id", project_id);

  // 開始日が未来のタスクかを判定
  const isFutureTask = (startDate: string) => {
    const jstStartDate = new Date(startDate).toLocaleDateString("ja-JP", {
      timeZone: "Asia/Tokyo",
    });
    const start = new Date(jstStartDate);
    return start.getTime() > nowDate.getTime();
  };

  // 期限切れのタスクかを判定
  const isExpiredTask = (dueDate: string) => {
    const jstDueDate = new Date(dueDate).toLocaleDateString("ja-JP", {
      timeZone: "Asia/Tokyo",
    });
    const due = new Date(jstDueDate);
    return due.getTime() < nowDate.getTime();
  };

  // 完了したタスクかを判定
  const isCompletedTask = (status: string) => status === "completed";

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
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:py-8 max-w-screen-xl">
      <h2 className="mt-10 scroll-m-20 text-3xl font-semibold tracking-tight transition-colors first:mt-0">
        全体の状況
      </h2>
      <div className="grid gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-4">
        <Card x-chunk="dashboard-01-chunk-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">予定</CardTitle>
            <SquarePen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                tasks!.filter(
                  (task) =>
                    // 未完了かつ開始日が未来のタスクの数をカウント
                    !isCompletedTask(task.status) &&
                    isFutureTask(task.start_date)
                ).length
              }
            </div>
            <p className="text-xs text-muted-foreground">始めよう!</p>
          </CardContent>
        </Card>
        <Card x-chunk="dashboard-01-chunk-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">進行中</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                tasks!.filter(
                  (task) =>
                    // 未完了かつ開始日が過去かつ期限切れでないタスクの数をカウント
                    !isCompletedTask(task.status) &&
                    !isFutureTask(task.start_date) &&
                    !isExpiredTask(task.due_date)
                ).length
              }
            </div>
            <p className="text-xs text-muted-foreground">もくもく</p>
          </CardContent>
        </Card>
        <Card x-chunk="dashboard-01-chunk-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">期限切れ</CardTitle>
            <TriangleAlert className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {
                tasks!.filter(
                  (task) =>
                    // 未完了かつ期限切れのタスクの数をカウント
                    !isCompletedTask(task.status) &&
                    isExpiredTask(task.due_date)
                ).length
              }
            </div>
            <p className="text-xs text-muted-foreground">再調整しよう!</p>
          </CardContent>
        </Card>
        <Card x-chunk="dashboard-01-chunk-3">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              完了したタスク
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {
                tasks!.filter((task) =>
                  // 完了したタスクの数をカウント
                  isCompletedTask(task.status)
                ).length
              }
            </div>
            <p className="text-xs text-muted-foreground">やったー!</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:gap-6 lg:grid-cols-2 xl:grid-cols-2">
        <Card x-chunk="dashboard-01-chunk-4">
          <CardHeader className="flex flex-row items-center">
            <div className="grid gap-1">
              <CardTitle className="text-xl font-medium">
                残り日数が短いタスク
              </CardTitle>
              <CardDescription>
                1週間以内
                {
                  tasks!.filter(
                    (task) =>
                      // 未完了かつ残り日数が7日以内のタスクの数をカウント
                      !isCompletedTask(task.status) &&
                      calcDaysLeft(task.due_date) <= 7
                  ).length
                }
                件
              </CardDescription>
            </div>
            <Button asChild size="sm" className="ml-auto gap-1">
              <Link href="#">
                確認
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          {tasks!
            .filter(
              (task) =>
                // 未完了かつ残り日数が7日以内のタスクの数をカウント
                !isCompletedTask(task.status) &&
                calcDaysLeft(task.due_date) <= 7
            )
            .sort((a, b) => calcDaysLeft(a.due_date) - calcDaysLeft(b.due_date))
            .map((task, index) => (
              <CardContent className="grid gap-6" key={index}>
                <div className="flex items-center gap-4">
                  <div className="grid gap-1">
                    <p className="text-sm font-medium leading-none">
                      {task.title}
                    </p>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <p>{task.teams?.name}</p>
                      <Separator
                        className="bg-zinc-700"
                        orientation="vertical"
                      />
                      <p>{task.tags?.map((tag) => `#${tag.name} `)}</p>
                    </div>
                  </div>
                  <div className={clsx("ml-auto", getDateColor(task.due_date))}>
                    {
                      // 残り日数が0日未満の場合は「(期限切れ)」と表示
                      calcDaysLeft(task.due_date) < 0
                        ? "(期限切れ)"
                        : `残り${calcDaysLeft(task.due_date)}日`
                    }
                  </div>
                </div>
              </CardContent>
            ))}
        </Card>
        <Card x-chunk="dashboard-01-chunk-5">
          <CardHeader className="flex flex-row items-center">
            <div className="grid gap-1">
              <CardTitle className="text-xl font-medium">
                関係あるタスク
              </CardTitle>
              <CardDescription>「音源班」での絞り込み結果</CardDescription>
            </div>
            <Button asChild size="sm" className="ml-auto gap-1">
              <Link href="#">
                絞り込み
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          {tasks!
            .filter(
              (task) =>
                // 関係あるタスクの絞り込み
                task.teams?.name === "音源班"
            )
            .sort((a, b) => calcDaysLeft(a.due_date) - calcDaysLeft(b.due_date))
            .map((task, index) => (
              <CardContent className="grid gap-6" key={index}>
                <div className="flex items-center gap-4">
                  <div className="grid gap-1">
                    <p className="text-sm font-medium leading-none">
                      {task.title}
                    </p>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <p>{task.teams?.name}</p>
                      <Separator
                        className="bg-zinc-700"
                        orientation="vertical"
                      />
                      <p>{task.tags?.map((tag) => `#${tag.name} `)}</p>
                    </div>
                  </div>
                  <div className={clsx("ml-auto", getDateColor(task.due_date))}>
                    {
                      // 残り日数が0日未満の場合は「(期限切れ)」と表示
                      calcDaysLeft(task.due_date) < 0
                        ? "(期限切れ)"
                        : `残り${calcDaysLeft(task.due_date)}日`
                    }
                  </div>
                </div>
              </CardContent>
            ))}
        </Card>
      </div>
    </main>
  );
}
