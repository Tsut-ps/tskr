"use server";

import { createClient } from "@/utils/supabase/server";

export async function getProjectName(slug: string) {
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("name")
    .eq("slug", slug)
    .single();

  return project?.name;
}
