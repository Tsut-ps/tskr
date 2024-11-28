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

export async function getProjectId(slug: string) {
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("slug", slug)
    .single();

  return project?.id;
}

export async function updateTaskTeam(
  projectSlug: string,
  taskId: string,
  teamId: string
) {
  const supabase = await createClient();

  // エラーがなければ更新した1行のデータが返る
  // RLS 未設定などで0行更新(成功)になるときの対策
  const { status, error } = await supabase
    .from("tasks")
    .update({ team_id: teamId })
    .eq("id", taskId)
    .select()
    .single();

  error && console.error(error);
  revalidatePath(`${projectSlug}/tasks/${taskId}`);

  // エラー時のみステータスコードを返す
  const errorCode = error ? status : undefined;
  return errorCode;
}

export async function deleteTaskTag(
  projectSlug: string,
  taskId: string,
  tagId: string
) {
  const supabase = await createClient();

  // エラーがなければ削除した1行のデータが返る
  const { status, error } = await supabase
    .from("task_tags")
    .delete()
    .match({ task_id: taskId, tag_id: tagId })
    .select()
    .single();

  error && console.error(error);
  revalidatePath(`${projectSlug}/tasks/${taskId}`);

  // エラー時のみステータスコードを返す
  const errorCode = error ? status : undefined;
  return errorCode;
}

export async function createTaskTag(
  projectSlug: string,
  taskId: string,
  tagName: string
) {
  const supabase = await createClient();
  const projectId = (await getProjectId(projectSlug)) as string;

  // エラーがなければ追加した1行のデータが返る
  const { data, status, error } = await supabase
    .from("tags")
    .insert({ project_id: projectId, name: tagName })
    .select()
    .single();

  if (error) {
    console.error(error);
    const errorCode = error ? status : undefined;
    return { errorCode };
  }

  const addErrorCode = await addTaskTag(projectSlug, taskId, data.id);

  return { addErrorCode };
}

export async function addTaskTag(
  projectSlug: string,
  taskId: string,
  tagId: string
) {
  const supabase = await createClient();

  // エラーがなければ追加した1行のデータが返る
  const { status, error } = await supabase
    .from("task_tags")
    .insert({ task_id: taskId, tag_id: tagId })
    .select()
    .single();

  error && console.error(error);
  revalidatePath(`${projectSlug}/tasks/${taskId}`);

  // エラー時のみステータスコードを返す
  const errorCode = error ? status : undefined;
  return errorCode;
}
