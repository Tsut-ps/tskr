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

export async function createProjectTag(projectSlug: string, tagName: string) {
  const supabase = await createClient();
  const projectId = (await getProjectId(projectSlug)) as string;

  // エラーがなければ追加した1行のデータが返る
  const { data, status, error } = await supabase
    .from("tags")
    .insert({ project_id: projectId, name: tagName })
    .select()
    .single();

  const tagId = data?.id;

  error && console.error(error);
  const errorCode = error ? status : undefined;
  return { tagId, errorCode };
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

export async function updateTaskDate(
  projectSlug: string,
  taskId: string,
  startDate: string,
  dueDate: string
) {
  const supabase = await createClient();

  // エラーがなければ更新した1行のデータが返る
  const { status, error } = await supabase
    .from("tasks")
    .update({ start_date: startDate, due_date: dueDate })
    .eq("id", taskId)
    .select()
    .single();

  error && console.error(error);
  revalidatePath(`${projectSlug}/tasks/${taskId}`);

  // エラー時のみステータスコードを返す
  const errorCode = error ? status : undefined;
  return errorCode;
}

export async function deleteTaskUser(
  projectSlug: string,
  taskId: string,
  userId: string
) {
  const supabase = await createClient();

  // エラーがなければ削除した1行のデータが返る
  const { status, error } = await supabase
    .from("task_users")
    .delete()
    .match({ task_id: taskId, user_id: userId })
    .select()
    .single();

  error && console.error(error);
  revalidatePath(`${projectSlug}/tasks/${taskId}`);

  // エラー時のみステータスコードを返す
  const errorCode = error ? status : undefined;
  return errorCode;
}

export async function createProjectUser(
  projectSlug: string,
  userName: string,
  revalidateTarget?: string
) {
  const supabase = await createClient();
  const projectId = (await getProjectId(projectSlug)) as string;

  // エラーがなければ追加した1行のデータが返る
  const { data, status, error } = await supabase
    .from("users")
    .insert({ project_id: projectId, name: userName })
    .select()
    .single();

  const userId = data?.id;

  revalidateTarget === "settings" && revalidatePath(`${projectSlug}/settings`);

  error && console.error(error);
  const errorCode = error ? status : undefined;
  return { userId, errorCode };
}

export async function addTaskUser(
  projectSlug: string,
  taskId: string,
  userId: string
) {
  const supabase = await createClient();

  // エラーがなければ追加した1行のデータが返る
  const { status, error } = await supabase
    .from("task_users")
    .insert({ task_id: taskId, user_id: userId })
    .select()
    .single();

  error && console.error(error);
  revalidatePath(`${projectSlug}/tasks/${taskId}`);

  // エラー時のみステータスコードを返す
  const errorCode = error ? status : undefined;
  return errorCode;
}

export async function updateTaskStatus(
  projectSlug: string,
  taskId: string,
  taskStatus: string
) {
  const supabase = await createClient();

  // エラーがなければ更新した1行のデータが返る
  const { status: resStatus, error } = await supabase
    .from("tasks")
    .update({ status: taskStatus })
    .eq("id", taskId)
    .select()
    .single();

  error && console.error(error);
  revalidatePath(`${projectSlug}/tasks/${taskId}`);

  // エラー時のみステータスコードを返す
  const errorCode = error ? resStatus : undefined;
  return errorCode;
}

export async function updateTaskProgress(
  projectSlug: string,
  taskId: string,
  progress: number
) {
  const supabase = await createClient();

  // エラーがなければ更新した1行のデータが返る
  const { status: resStatus, error } = await supabase
    .from("tasks")
    .update({ progress })
    .eq("id", taskId)
    .select()
    .single();

  error && console.error(error);
  revalidatePath(`${projectSlug}/tasks/${taskId}`);

  // エラー時のみステータスコードを返す
  const errorCode = error ? resStatus : undefined;
  return errorCode;
}

export async function updateTaskDescription(
  projectSlug: string,
  taskId: string,
  description: string
) {
  const supabase = await createClient();

  // エラーがなければ更新した1行のデータが返る
  const { status: resStatus, error } = await supabase
    .from("tasks")
    .update({ description })
    .eq("id", taskId)
    .select()
    .single();

  error && console.error(error);
  revalidatePath(`${projectSlug}/tasks/${taskId}`);

  // エラー時のみステータスコードを返す
  const errorCode = error ? resStatus : undefined;
  return errorCode;
}
