import { notFound } from "next/navigation";

// プロジェクトUUIDの正規表現
const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { projectId: string };
}) {
  const uuid = params.projectId;

  if (!uuidRegex.test(uuid)) {
    notFound();
  }

  return children;
}
