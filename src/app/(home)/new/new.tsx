"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createProject } from "@/app/actions";
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
  projectName: z
    .string()
    .min(2, {
      message: "2文字以上で入力してください。",
    })
    .max(50, {
      message: "20文字以内で入力してください。",
    }),
});

export function NewProject() {
  const router = useRouter();
  const [open, setOpen] = useState(true);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      projectName: "",
    },
  });

  const onSubmit = async ({ projectName }: z.infer<typeof formSchema>) => {
    const { projectSlug, errorCode } = await createProject(projectName);
    if (errorCode) {
      toast({
        title: "エラーが発生しました",
        description: "プロジェクトを作成できませんでした。",
      });
    }
    form.reset();
    setOpen(false);
    router.push(`/${projectSlug}`);
  };

  return (
    <Modal open={open} onOpenChange={setOpen}>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col w-full space-y-4"
        >
          <FormField
            control={form.control}
            name="projectName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>プロジェクト名</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit">プロジェクトを作成</Button>
        </form>
      </Form>
    </Modal>
  );
}
