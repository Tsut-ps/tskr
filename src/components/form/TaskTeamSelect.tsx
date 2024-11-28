"use client";

import { useState } from "react";

import { updateTaskTeam } from "@/app/actions";
import { toast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function TaskTeamSelect({
  preValue,
  taskId,
  teams,
}: {
  preValue: string;
  taskId: string;
  teams: { id: string; name: string }[];
}) {
  const [selectedTeam, setSelectedTeam] = useState(preValue);

  const handleUpdateTaskTeam = async (selectedValue: string) => {
    setSelectedTeam(selectedValue); // 楽観的更新
    const errorCode = await updateTaskTeam(taskId, selectedValue);
    if (errorCode) {
      setSelectedTeam(preValue); // 失敗時に元に戻す
      toast({
        variant: "destructive",
        title: "タスクのチームの更新に失敗しました。",
        description: `何度も続く場合は管理者に連絡してください。(${errorCode})`,
      });
    } else {
      toast({
        title: "更新済み",
        description: "タスクのチームを更新しました。",
      });
    }
  };

  return (
    <Select value={selectedTeam} onValueChange={handleUpdateTaskTeam}>
      <SelectTrigger className="w-auto -my-2 -ml-3 pl-4 border-transparent hover:bg-accent hover:text-accent-foreground">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {teams.map((team, index) => (
          <SelectItem key={index} value={team.id}>
            {team.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
