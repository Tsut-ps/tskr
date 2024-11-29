import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

import { UserTeamSelect } from "@/components/form/UserTeamSelect";

export default async function SettingProfilePage({
  params,
}: {
  params: { projectSlug: string };
}) {
  const supabase = await createClient();
  const projectSlug = params.projectSlug;

  // 外部キーに基づく関係の自動検出
  const { data: project } = await supabase
    .from("projects")
    .select(`id, name, users(id, name)`)
    .eq("slug", projectSlug)
    .single();

  if (!project) notFound();

  const { data: teams } = await supabase
    .from("teams")
    .select("id, name, users(id)")
    .eq("project_id", project.id);

  return (
    <div className="space-y-2">
      <h3 className="text-lg font-medium">所属チーム</h3>
      <p className="text-muted-foreground">
        携わっているチームを選択すると、「全体」にて所属チームのタスクを確認できます。
      </p>
      <UserTeamSelect teams={teams || []} />
    </div>
  );
}
