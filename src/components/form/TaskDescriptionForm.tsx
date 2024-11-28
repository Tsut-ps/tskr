"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { updateTaskDescription } from "@/app/actions";
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
import { Textarea } from "@/components/ui/textarea";

const FormSchema = z.object({
  description: z.string().max(1000, {
    message: "1000文字以下で入力してください。",
  }),
});

export function TaskDescriptionForm({
  taskId,
  description,
}: {
  taskId: string;
  description: string;
}) {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  });

  const onSubmit = async () => {
    const { description } = form.getValues();
    const errorCode = await updateTaskDescription(taskId, description);
    if (errorCode) {
      toast({
        variant: "destructive",
        title: "メモの更新に失敗しました。",
        description: `何度も続く場合は管理者に連絡してください。(${errorCode})`,
      });
    } else {
      toast({
        title: "更新済み",
        description: "タスクのメモを更新しました。",
      });
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col w-full gap-2"
      >
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="ml-2">メモ</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="ここにメモを入力"
                  defaultValue={description}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" variant="secondary">
          メモを更新
        </Button>
      </form>
    </Form>
  );
}
