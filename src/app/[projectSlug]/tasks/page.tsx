import Link from "next/link";
import { notFound } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/server";
import { calcDaysLeft, getDateColor, isCompletedTask } from "@/utils/date";

import {
  Card,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NewTask, NewTeam } from "./new";

export default async function Page({
  params,
}: {
  params: { projectSlug: string };
}) {
  const supabase = await createClient();
  const projectSlug = params.projectSlug;

  // 外部キーに基づく関係の自動検出
  const { data: project } = await supabase
    .from("projects")
    .select(
      `name, 
        teams(id, name, 
          tasks(id, title, start_date, due_date, status, description,
            tags(name)))`
    )
    .eq("slug", projectSlug)
    .single();

  if (!project) notFound();

  return (
    <main className="flex gap-4 p-4 md:gap-6 md:py-6 overflow-x-auto w-auto h-[calc(100svh-4rem)] shadcn-scrollbar">
      {project.teams?.map((team, index) => (
        <div key={index} className="w-96 flex-none">
          <div className="flex flex-row items-center justify-between p-3">
            <div className="grid gap-1">
              <CardTitle className="text-xl font-medium">{team.name}</CardTitle>
              <CardDescription>{team.tasks?.length}件のタスク</CardDescription>
            </div>
            <NewTask projectSlug={projectSlug} teamId={team.id} />
          </div>
          <div className="grid gap-2 pb-8">
            {team.tasks
              ?.sort((a, b) => {
                if (isCompletedTask(a.status) && !isCompletedTask(b.status))
                  return 1;
                if (!isCompletedTask(a.status) && isCompletedTask(b.status))
                  return -1;
                return calcDaysLeft(a.due_date) - calcDaysLeft(b.due_date);
              })
              .map((task, index) => (
                <Link
                  key={index}
                  href={`/${projectSlug}/tasks/${task.id}`}
                  scroll={false}
                >
                  <Card
                    key={index}
                    className={cn(isCompletedTask(task.status) && "opacity-60")}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-center gap-4">
                        <div className="grid gap-2">
                          <p className="text-sm font-medium leading-none pt-1">
                            {task.title}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            {task.description}
                          </p>
                          <div className="flex flex-wrap gap-1 pt-1">
                            {task.tags?.map((tag, index) => (
                              <Badge key={index} variant="secondary">
                                #{tag.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        {
                          <div
                            className={cn(
                              "ml-auto whitespace-nowrap",
                              getDateColor(task.due_date, task.status)
                            )}
                          >
                            {task.status === "closed"
                              ? "完了"
                              : // 残り日数が0日未満の場合は「(期限切れ)」と表示
                              calcDaysLeft(task.due_date) < 0
                              ? "期限切れ"
                              : `残り${calcDaysLeft(task.due_date)}日`}
                          </div>
                        }
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
          </div>
        </div>
      ))}
      <NewTeam projectSlug={projectSlug} />
    </main>
  );
}
