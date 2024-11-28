"use client";

import { useState } from "react";

import { updateTaskProgress } from "@/app/actions";
import { toast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";

export function TaskProgressSelect({
  projectSlug,
  taskId,
  progress,
}: {
  projectSlug: string;
  taskId: string;
  progress: number;
}) {
  const [selectedProgress, setSelectedProgress] = useState(progress);

  const handleUpdateTaskProgress = async (selectedValue: string) => {
    setSelectedProgress(Number(selectedValue)); // 楽観的更新
    const errorCode = await updateTaskProgress(
      projectSlug,
      taskId,
      Number(selectedValue)
    );
    if (errorCode) {
      setSelectedProgress(progress); // 失敗時に元に戻す
      toast({
        variant: "destructive",
        title: "進捗率の更新に失敗しました。",
        description: `何度も続く場合は管理者に連絡してください。(${errorCode})`,
      });
    } else {
      toast({
        title: "更新済み",
        description: "進捗率を更新しました。",
      });
    }
  };

  return (
    <Select
      value={selectedProgress.toString()}
      onValueChange={handleUpdateTaskProgress}
    >
      <Progress value={progress} className="w-[60%] h-3 mr-2" />
      <SelectTrigger className="w-auto -my-2 border-transparent hover:bg-accent hover:text-accent-foreground">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((value, index) => (
          <SelectItem key={index} value={value.toString()}>
            {value}%
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
