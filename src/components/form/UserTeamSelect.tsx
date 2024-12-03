"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { addUserTeam, deleteUserTeam } from "@/app/actions";

import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// ユーザーを記録するアトム
const selectedUserIdAtom = atomWithStorage<string>("user", "", undefined, {
  getOnInit: true,
});

export function UserTeamSelect({
  teams,
}: {
  teams: { id: string; name: string; users: { id: string }[] }[];
}) {
  const { projectSlug } = useParams();
  const [userId] = useAtom(selectedUserIdAtom);
  const [mounted, setMounted] = useState(false);
  const userTeams = teams?.filter((team) =>
    team.users?.some((user) => user.id === userId)
  );

  // ハイドレーションエラー対策
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleAddUserTeam = async (teamId: string) => {
    const errorCode = await addUserTeam(userId, teamId);
    if (errorCode) {
      toast({
        variant: "destructive",
        title: "所属チームの選択に失敗しました。",
        description: errorCode,
      });
    }
  };

  const handleDeleteUserTeam = async (teamId: string) => {
    const errorCode = await deleteUserTeam(userId, teamId);
    if (errorCode) {
      toast({
        variant: "destructive",
        title: "所属チームの削除に失敗しました。",
        description: errorCode,
      });
    }
  };

  return (
    <div>
      {mounted && !userId && (
        <Link href={`/${projectSlug}/settings`} className="hover:opacity-80">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>ユーザーが選択されていません。</AlertTitle>
            <AlertDescription>
              プロフィールでユーザーを選択してください。
            </AlertDescription>
          </Alert>
        </Link>
      )}
      {teams?.map((team, index) => (
        <div
          key={index}
          className="flex flex-row items-center space-x-2 space-y-1"
        >
          <Checkbox
            id={team.id}
            disabled={!mounted || !userId}
            checked={
              mounted && userTeams?.some((userTeam) => userTeam.id === team.id)
            }
            onCheckedChange={(checked) => {
              checked
                ? handleAddUserTeam(team.id)
                : handleDeleteUserTeam(team.id);
            }}
          />
          <label
            htmlFor={team.id}
            className="font-normal peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {team.name}
          </label>
        </div>
      ))}
    </div>
  );
}
