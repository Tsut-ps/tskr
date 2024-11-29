"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createTask } from "@/app/actions";
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
import { Modal } from "./modal";

const formSchema = z.object({
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

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      taskName: "",
    },
  });

  const onSubmit = async ({ taskName }: z.infer<typeof formSchema>) => {
    const { taskId, errorCode } = await createTask(
      projectSlug,
      teamId,
      taskName
    );
    if (errorCode) {
      toast({
        title: "エラーが発生しました",
        description: "タスクを作成できませんでした。",
      });
    }
    form.reset();
    setOpen(false);
    router.push(`/${projectSlug}/tasks/${taskId}`);
  };

  return (
    <Modal open={open} onOpenChange={setOpen}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
    </Modal>
  );
}
