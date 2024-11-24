import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Modal } from "./modal";
import { TextFormArea } from "./form";
import { DatePickerWithRange } from "./date-picker";

export default async function Page({
  params,
}: {
  params: {
    projectSlug: string;
    taskId: string;
  };
}) {
  const supabase = await createClient();
  const taskId = params.taskId;

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

  if (!task) notFound();

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
    <Modal
      TaskTitle={task.title}
      createdTime={createdTime}
      updatedTime={updatedTime}
      isSameDate={isSameDate}
    >
      <Separator className="!my-4" />
      <Table>
        <TableBody>
          <TableRow>
            <TableCell className="w-32 text-muted-foreground">チーム</TableCell>
            <TableCell>{task.team!.name}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="text-muted-foreground">タグ</TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-1">
                {task.tags?.map((tag, index) => (
                  <Badge key={index} variant="secondary">
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="text-muted-foreground">
              開始/終了予定
            </TableCell>
            <TableCell className="flex items-center gap-1">
              <DatePickerWithRange
                startDate={task.start_date}
                dueDate={task.due_date}
              />
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="text-muted-foreground">担当者</TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-1">
                {task.users.length ? (
                  task.users.map((user, index) => (
                    <Badge key={index} variant="secondary">
                      {user.name}
                    </Badge>
                  ))
                ) : (
                  <span className="text-muted-foreground">(未割り当て)</span>
                )}
              </div>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="text-muted-foreground">ステータス</TableCell>
            <TableCell>{task.status === "open" ? "進行中" : "完了"}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="text-muted-foreground">
              大体の進捗率
            </TableCell>
            <TableCell className="flex items-center">
              <Progress value={task.progress} className="w-[60%] h-3 mr-2" />
              {task.progress}%
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <Separator className="!mb-6" />
      <TextFormArea defaultValue={task.description as string} />
    </Modal>
  );
}
