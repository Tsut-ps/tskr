"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { updateTaskTeam } from "@/app/actions";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export function TaskTeamArea({
  preValue,
  projectSlug,
  taskId,
  teams,
}: {
  preValue: string;
  projectSlug: string;
  taskId: string;
  teams: { id: string; name: string }[];
}) {
  const [selectedTeam, setSelectedTeam] = useState(preValue);

  const handleUpdateTaskTeam = async (selectedValue: string) => {
    setSelectedTeam(selectedValue); // 楽観的更新
    const errorCode = await updateTaskTeam(projectSlug, taskId, selectedValue);
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

const FormSchema = z.object({
  memo: z.string().max(1000, {
    message: "1000文字以下で入力してください。",
  }),
});

export function TextFormArea({ preValue }: { preValue: string }) {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  });

  function onSubmit() {
    toast({ title: "メモを更新しました。" });
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="grid w-full gap-2"
      >
        <FormField
          control={form.control}
          name="memo"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="ml-2">メモ</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="ここにメモを入力"
                  defaultValue={preValue}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">メモを更新</Button>
      </form>
    </Form>
  );
}
