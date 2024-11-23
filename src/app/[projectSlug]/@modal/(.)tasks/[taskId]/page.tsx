import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Modal } from "./modal";

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
      `*,
				team:teams(*),
				tags:tags(*)`
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
            <TableCell className="text-muted-foreground">開始/終了予定</TableCell>
            <TableCell>
              {task.start_date} → {task.due_date}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="text-muted-foreground">担当者</TableCell>
            <TableCell>{}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="text-muted-foreground">進捗率</TableCell>
            <TableCell>{}%</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="text-muted-foreground">説明</TableCell>
            <TableCell>{task.description}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Modal>
  );
}
