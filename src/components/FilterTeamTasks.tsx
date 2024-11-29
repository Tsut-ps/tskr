"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { cn } from "@/lib/utils";
import { isCompletedTask, calcDaysLeft, getDateColor } from "@/utils/date";

import { CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type Tasks = {
  id: string;
  title: string;
  status: string;
  start_date: string;
  due_date: string;
  tags: {
    name: string;
  }[];
  teams: {
    id: string;
    name: string;
  } | null;
}[];

type Users = { id: string; teams: { id: string }[] }[] | null;

// ユーザーの選択を記録するアトム
const selectedUserIdAtom = atomWithStorage<string>("user", "", undefined, {
  getOnInit: true,
});

export const FilterTeamTasks = ({
  projectSlug,
  tasks,
  users,
}: {
  projectSlug: string;
  tasks: Tasks;
  users: Users;
}) => {
  const [userId] = useAtom(selectedUserIdAtom);
  const userTeams = users?.find((user) => user.id === userId)?.teams;
  const [mounted, setMounted] = useState(false);

  // ハイドレーションエラー対策
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted)
    return (
      <CardContent>
        <p>タスクを読み込んでいます...</p>
      </CardContent>
    );

  return (
    <>
      {tasks
        .filter(
          (task) =>
            // 未完了のタスクかつユーザーが所属するチームのタスクのみ表示
            !isCompletedTask(task.status) &&
            userTeams?.some((team) => task.teams?.id === team.id)
        )
        .sort((a, b) => calcDaysLeft(a.due_date) - calcDaysLeft(b.due_date))
        .map((task, index) => (
          <Link
            key={index}
            href={`/${projectSlug}/tasks/${task.id}`}
            scroll={false}
          >
            <CardContent
              className="flex items-center gap-4 hover:opacity-80"
              key={index}
            >
              <div className="grid gap-1">
                <p className="text-sm font-medium leading-none">{task.title}</p>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <p>{task.teams?.name}</p>
                  <Separator className="bg-zinc-700" orientation="vertical" />
                  <p>{task.tags?.map((tag) => `#${tag.name} `)}</p>
                </div>
              </div>
              <div
                className={cn(
                  "ml-auto",
                  getDateColor(task.due_date, task.status)
                )}
              >
                {
                  // 残り日数が0日未満の場合は「(期限切れ)」と表示
                  calcDaysLeft(task.due_date) < 0
                    ? "期限切れ"
                    : `残り${calcDaysLeft(task.due_date)}日`
                }
              </div>
            </CardContent>
          </Link>
        ))}
    </>
  );
};
