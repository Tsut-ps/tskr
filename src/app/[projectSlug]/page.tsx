import Link from "next/link";
import { notFound } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Activity,
  ArrowUpRight,
  CheckCircle,
  SquarePen,
  TriangleAlert,
  Wrench,
} from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import {
  isFutureTask,
  isExpiredTask,
  isCompletedTask,
  calcDaysLeft,
  getDateColor,
} from "@/utils/date";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FilterTeamTasks } from "@/components/FilterTeamTasks";

export default async function Page({
  params,
}: {
  params: { projectSlug: string };
}) {
  const supabase = await createClient();
  const slug = params.projectSlug;

  // 外部キーに基づく関係の自動検出
  const { data: project } = await supabase
    .from("projects")
    .select(
      `id, name, 
        tasks(id, title, status, start_date, due_date,
          tags(name), 
          teams(id, name))`
    )
    .eq("slug", slug)
    .single();

  if (!project) notFound();

  const { data: users } = await supabase
    .from("users")
    .select("id, teams(id)")
    .eq("project_id", project.id);

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
            <span className="text-2xl font-bold">
              {
                project.tasks!.filter(
                  (task) =>
                    // 未完了かつ開始日が未来のタスクの数をカウント
                    !isCompletedTask(task.status) &&
                    isFutureTask(task.start_date)
                ).length
              }
            </span>
            <p className="text-xs text-muted-foreground">始めよう!</p>
          </CardContent>
        </Card>
        <Card x-chunk="dashboard-01-chunk-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">進行中</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">
              {
                project.tasks!.filter(
                  (task) =>
                    // 未完了かつ開始日が過去かつ期限切れでないタスクの数をカウント
                    !isCompletedTask(task.status) &&
                    !isFutureTask(task.start_date) &&
                    !isExpiredTask(task.due_date)
                ).length
              }
            </span>
            <p className="text-xs text-muted-foreground">もくもく</p>
          </CardContent>
        </Card>
        <Card x-chunk="dashboard-01-chunk-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">期限切れ</CardTitle>
            <TriangleAlert className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold text-red-600">
              {
                project.tasks!.filter(
                  (task) =>
                    // 未完了かつ期限切れのタスクの数をカウント
                    !isCompletedTask(task.status) &&
                    isExpiredTask(task.due_date)
                ).length
              }
            </span>
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
            <span className="text-2xl font-bold text-green-600">
              {
                project.tasks!.filter((task) =>
                  // 完了したタスクの数をカウント
                  isCompletedTask(task.status)
                ).length
              }
            </span>
            <span className="text-muted-foreground">
              <span className="mx-1.5">/</span>
              {project.tasks!.length}
            </span>
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
                  project.tasks!.filter(
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
              <Link href={`${slug}/tasks`}>
                確認
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          {project
            .tasks!.filter(
              (task) =>
                // 未完了かつ残り日数が7日以内のタスクの数をカウント
                !isCompletedTask(task.status) &&
                calcDaysLeft(task.due_date) <= 7
            )
            .sort((a, b) => calcDaysLeft(a.due_date) - calcDaysLeft(b.due_date))
            .map((task, index) => (
              <Link
                key={index}
                href={`/${slug}/tasks/${task.id}`}
                scroll={false}
              >
                <CardContent
                  className="flex items-center gap-4 hover:opacity-80"
                  key={index}
                >
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
                      {task.tags?.map((tag, index) => (
                        <span key={index}>#{tag.name}</span>
                      ))}
                    </div>
                  </div>
                  <div
                    className={cn(
                      "ml-auto",
                      getDateColor(task.due_date, task.status)
                    )}
                  >
                    {
                      // 残り日数が0日未満の場合は「(期限切れ)」と表示
                      calcDaysLeft(task.due_date) < 0
                        ? "期限切れ"
                        : `残り${calcDaysLeft(task.due_date)}日`
                    }
                  </div>
                </CardContent>
              </Link>
            ))}
        </Card>
        <Card x-chunk="dashboard-01-chunk-5">
          <CardHeader className="flex flex-row items-center">
            <div className="grid gap-1">
              <CardTitle className="text-xl font-medium">
                関係あるタスク
              </CardTitle>
              <CardDescription>所属チームでの絞り込み結果</CardDescription>
            </div>
            <Button asChild size="sm" className="ml-auto gap-1">
              <Link href={`/${slug}/settings/select-team/`}>
                設定
                <Wrench className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <FilterTeamTasks
            projectSlug={slug}
            tasks={project.tasks}
            users={users}
          />
        </Card>
      </div>
    </main>
  );
}
