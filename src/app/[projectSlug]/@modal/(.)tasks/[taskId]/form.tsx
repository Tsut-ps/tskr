"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

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
  memo: z.string().max(1000, {
    message: "1000文字以下で入力してください。",
  }),
});

export function TextFormArea({ defaultValue }: { defaultValue: string }) {
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
                  defaultValue={defaultValue}
                  className="focus-visible:ring-transparent"
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
