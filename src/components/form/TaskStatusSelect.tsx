"use client";

import { useState } from "react";

import { updateTaskStatus } from "@/app/actions";
import { toast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function TaskStatusSelect({
  projectSlug,
  taskId,
  status,
}: {
  projectSlug: string;
  taskId: string;
  status: string;
}) {
  const [selectedStatus, setSelectedStatus] = useState(status);

  const handleUpdateTaskStatus = async (selectedValue: string) => {
    setSelectedStatus(selectedValue); // 楽観的更新
    const errorCode = await updateTaskStatus(
      projectSlug,
      taskId,
      selectedValue
    );
    if (errorCode) {
      setSelectedStatus(status); // 失敗時に元に戻す
      toast({
        variant: "destructive",
        title: "ステータスの更新に失敗しました。",
        description: `何度も続く場合は管理者に連絡してください。(${errorCode})`,
      });
    } else {
      toast({
        title: "更新済み",
        description: "ステータスを更新しました。",
      });
    }
  };

  return (
    <Select value={selectedStatus} onValueChange={handleUpdateTaskStatus}>
      <SelectTrigger className="w-auto -my-2 -ml-3 border-transparent hover:bg-accent hover:text-accent-foreground">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={"open"}>進行中</SelectItem>
        <SelectItem value={"closed"}>完了</SelectItem>
      </SelectContent>
    </Select>
  );
}
