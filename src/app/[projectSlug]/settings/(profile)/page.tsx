import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

import { Separator } from "@/components/ui/separator";
import { UserSelect } from "@/components/form/UserSelect";
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
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">プロフィール</h3>
        <p className="text-sm text-muted-foreground">
          使う側の良心の上で成り立っています。他人のものを勝手に変更しないでください。
        </p>
      </div>
      <Separator />
      <div>
        <p>ユーザー名</p>
        <UserSelect projectSlug={projectSlug} users={project.users} />
        <p className="text-sm text-muted-foreground">
          ユーザー名は変更できません。変更したい場合、新しく作成してください。
        </p>
      </div>
      <UserTeamSelect teams={teams || []} />
    </div>
  );
}
