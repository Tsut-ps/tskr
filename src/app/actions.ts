"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function getProjectName(slug: string) {
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("name")
    .eq("slug", slug)
    .single();

  return project?.name;
}

export async function updateTaskTeam(
  projectSlug: string,
  taskId: string,
  teamId: string
) {
  const supabase = await createClient();

  // エラーがなければ更新した1行のデータが返る
  const { status, error } = await supabase
    .from("tasks")
    .update({ team_id: teamId })
    .eq("id", taskId)
    .select()
    .single();

  revalidatePath(`${projectSlug}/tasks/${taskId}`);

  // エラー時のみステータスコードを返す
  const errorCode = error ? status : undefined;
  return errorCode;
}
