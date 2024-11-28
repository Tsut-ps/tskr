import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import {
  TaskTeamArea,
  TaskTagArea,
  TaskUserArea,
  TaskStatusArea,
  TaskProgressArea,
  TaskDescriptionArea,
} from "@/app/[projectSlug]/@modal/(.)tasks/[taskId]/form";
import { DatePickerWithRange } from "@/app/[projectSlug]/@modal/(.)tasks/[taskId]/date-picker";

export default async function Page({
  params,
}: {
  params: {
    projectSlug: string;
    taskId: string;
  };
}) {
  const supabase = await createClient();
  const projectSlug = params.projectSlug;
  const taskId = params.taskId;

  const { data: project } = await supabase
    .from("projects")
    .select("name, teams(id, name), tags(id, name), users(id, name)")
    .eq("slug", projectSlug)
    .single();

  // 外部キーに基づく関係の自動検出
  const { data: task } = await supabase
    .from("tasks")
    .select(
      `id, title, description, start_date, due_date, status, progress,created_at, updated_at,
				team:teams(*),
				tags(*),
        users(id, name)
      `
    )
    .eq("id", taskId)
    .single();

  if (!project || !task) notFound();

  const createdDate = new Date(task.created_at);
  const updatedDate = new Date(task.updated_at);

  // 同じ場合は更新がないと判定
  const isSameDate = createdDate.getTime() === updatedDate.getTime();

  // 月火水木金土日
  const week = ["日", "月", "火", "水", "木", "金", "土"];

  const createdTime = `${createdDate.getFullYear()}年${createdDate.getMonth()}月${createdDate.getDate()}日(${
    week[createdDate.getDay()]
  }) ${createdDate.getHours()}:${createdDate.getMinutes()}`;
  const updatedTime = `${updatedDate.getFullYear()}年${updatedDate.getMonth()}月${updatedDate.getDate()}日(${
    week[updatedDate.getDay()]
  }) ${updatedDate.getHours()}:${updatedDate.getMinutes()}`;

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:py-8 max-w-screen-xl">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href={`/${projectSlug}/`}>
              {project.name}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href={`/${projectSlug}/tasks`}>
              すべてのタスク
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink>{task.team?.name}</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div>
        <h2 className="mt-10 scroll-m-20 text-2xl font-semibold tracking-tight transition-colors first:mt-0">
          {task.title}
        </h2>
        <div className="text-sm text-muted-foreground">
          {isSameDate ? `作成日時: ${createdTime}` : `更新日時: ${updatedTime}`}
        </div>
      </div>

      <div className="md:flex gap-4 md:gap-6 w-full">
        <Table>
          <TableBody>
            <TableRow>
              <TableCell className="w-32 text-muted-foreground">
                チーム
              </TableCell>
              <TableCell>
                <TaskTeamArea
                  preValue={task.team!.id}
                  projectSlug={projectSlug}
                  taskId={task.id}
                  teams={project.teams}
                />
              </TableCell>
            </TableRow>

            <TableRow>
              <TableCell className="text-muted-foreground">タグ</TableCell>
              <TableCell>
                <TaskTagArea
                  projectSlug={projectSlug}
                  taskId={task.id}
                  allTags={project.tags}
                  tags={task.tags}
                />
              </TableCell>
            </TableRow>

            <TableRow>
              <TableCell className="text-muted-foreground">
                開始/終了予定
              </TableCell>
              <TableCell className="flex items-center gap-1">
                <DatePickerWithRange
                  projectSlug={projectSlug}
                  taskId={task.id}
                  startDate={task.start_date || undefined}
                  dueDate={task.due_date || undefined}
                />
              </TableCell>
            </TableRow>

            <TableRow>
              <TableCell className="text-muted-foreground">担当者</TableCell>
              <TableCell>
                <TaskUserArea
                  projectSlug={projectSlug}
                  taskId={task.id}
                  allUsers={project.users}
                  users={task.users}
                />
              </TableCell>
            </TableRow>

            <TableRow>
              <TableCell className="text-muted-foreground">
                ステータス
              </TableCell>
              <TableCell>
                <TaskStatusArea
                  projectSlug={projectSlug}
                  taskId={task.id}
                  status={task.status}
                />
              </TableCell>
            </TableRow>

            <TableRow>
              <TableCell className="text-muted-foreground">
                大体の進捗率
              </TableCell>
              <TableCell className="flex items-center">
                <TaskProgressArea
                  projectSlug={projectSlug}
                  taskId={task.id}
                  progress={task.progress}
                />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <TaskDescriptionArea
          projectSlug={projectSlug}
          taskId={task.id}
          description={task.description as string}
        />
      </div>
    </main>
  );
}
