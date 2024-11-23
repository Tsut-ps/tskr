import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

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

  return (
    <Modal>
      {task.title} - {task.team!.name}
    </Modal>
  );
}
