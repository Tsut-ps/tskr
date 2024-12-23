import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

import { UserSelect } from "@/components/form/UserSelect";

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

  return (
    <div className="space-y-2">
      <h3 className="text-lg font-medium">ユーザー名</h3>
      <p className="text-muted-foreground">
        所属チームなどの判定に用います。
      </p>
      <UserSelect projectSlug={projectSlug} users={project.users} />
      <p className="text-sm text-muted-foreground">
        悪用を防ぐため、各ユーザーの名前は変更できません。変更したい場合、新しく作成してください。
      </p>
    </div>
  );
}
