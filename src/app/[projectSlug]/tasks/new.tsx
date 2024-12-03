"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createTask, createTeam } from "@/app/actions";
import { toast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { NewTaskModal, NewTeamModal } from "./modal";

const taskFormSchema = z.object({
  taskName: z
    .string()
    .min(2, {
      message: "2文字以上で入力してください。",
    })
    .max(50, {
      message: "50文字以内で入力してください。",
    }),
});

export function NewTask({
  projectSlug,
  teamId,
}: {
  projectSlug: string;
  teamId: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const form = useForm<z.infer<typeof taskFormSchema>>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      taskName: "",
    },
  });

  const onSubmit = async ({ taskName }: z.infer<typeof taskFormSchema>) => {
    const { taskId, errorCode } = await createTask(
      projectSlug,
      teamId,
      taskName
    );
    if (errorCode) {
      toast({
        variant: "destructive",
        title: "エラーが発生しました。",
        description: "タスクを作成できませんでした。",
      });
    } else {
      form.reset();
      setOpen(false);
      router.push(`/${projectSlug}/tasks/${taskId}`);
    }
  };

  return (
    <NewTaskModal open={open} onOpenChange={setOpen}>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col w-full space-y-4"
        >
          <FormField
            control={form.control}
            name="taskName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>タスク名</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit">タスクを作成</Button>
        </form>
      </Form>
    </NewTaskModal>
  );
}

const teamFormSchema = z.object({
  teamName: z
    .string()
    .min(2, {
      message: "2文字以上で入力してください。",
    })
    .max(20, {
      message: "20文字以内で入力してください。",
    }),
});

export function NewTeam({ projectSlug }: { projectSlug: string }) {
  const [open, setOpen] = useState(false);

  const form = useForm<z.infer<typeof teamFormSchema>>({
    resolver: zodResolver(teamFormSchema),
    defaultValues: {
      teamName: "",
    },
  });

  const onSubmit = async ({ teamName }: z.infer<typeof teamFormSchema>) => {
    const { errorCode } = await createTeam(projectSlug, teamName);
    if (errorCode) {
      toast({
        variant: "destructive",
        title: "エラーが発生しました。",
        description: "チームを作成できませんでした。",
      });
    } else {
      form.reset();
      setOpen(false);
    }
  };

  return (
    <NewTeamModal open={open} onOpenChange={setOpen}>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col w-full space-y-4"
        >
          <FormField
            control={form.control}
            name="teamName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>チーム名</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit">チームを作成</Button>
        </form>
      </Form>
    </NewTeamModal>
  );
}
