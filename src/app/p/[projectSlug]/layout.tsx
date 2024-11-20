import { notFound } from "next/navigation";

// プロジェクトUUIDの正規表現
const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { projectSlug: string };
}) {
  const uuid = params.projectSlug;

  if (!uuidRegex.test(uuid)) {
    console.log("Invalid UUID");
    notFound();
  }

  return children;
}
