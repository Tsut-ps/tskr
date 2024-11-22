import Link from "next/link";
import { notFound } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/server";
import { calcDaysLeft, getDateColor } from "@/utils/date";

import {
  Card,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
        teams(name, 
          tasks(id, title, start_date, due_date, 
            tags(name)))`
    )
    .eq("slug", projectSlug)
    .single();

  if (!project) notFound();

  return (
    <main className="flex gap-4 p-4 md:gap-6 md:py-8 overflow-x-auto w-full scrollbar-hide">
      {project.teams?.map((team, index) => (
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
              <Link key={index} href={`/${projectSlug}/tasks/${task.id}`}>
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
                          className={cn("ml-auto", getDateColor(task.due_date))}
                        >
                          {
                            // 残り日数が0日未満の場合は「(期限切れ)」と表示
                            calcDaysLeft(task.due_date) < 0
                              ? "(期限切れ)"
                              : `残り${calcDaysLeft(task.due_date)}日`
                          }
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
    </main>
  );
}