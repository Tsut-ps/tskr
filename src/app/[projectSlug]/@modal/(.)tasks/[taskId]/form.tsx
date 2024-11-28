"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Plus, X } from "lucide-react";

import {
  updateTaskTeam,
  deleteTaskTag,
  createTaskTag,
  addTaskTag,
} from "@/app/actions";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";

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

export function TaskTagArea({
  projectSlug,
  taskId,
  allTags,
  tags,
}: {
  projectSlug: string;
  taskId: string;
  allTags: { id: string; name: string }[];
  tags: { id: string; name: string }[];
}) {
  const [searchValue, setSearchValue] = useState("");

  const handleDeleteTaskTag = async (selectedValue: string) => {
    const errorCode = await deleteTaskTag(projectSlug, taskId, selectedValue);
    if (errorCode) {
      toast({
        variant: "destructive",
        title: "タグの削除に失敗しました。",
        description: `何度も続く場合は管理者に連絡してください。(${errorCode})`,
      });
    } else {
      toast({
        title: "削除済み",
        description: "タグを削除しました。",
      });
    }
  };

  const handleAddTaskNewTag = async () => {
    if (!searchValue) {
      toast({
        variant: "destructive",
        title: "タグの追加に失敗しました。",
        description: "タグ名を入力してください。",
      });
      return;
    }
    const { errorCode, addErrorCode } = await createTaskTag(
      projectSlug,
      taskId,
      searchValue
    );
    if (errorCode || addErrorCode) {
      toast({
        variant: "destructive",
        title: "タグの追加に失敗しました。",
        description: `何度も続く場合は管理者に連絡してください。(${
          errorCode || addErrorCode
        })`,
      });
    } else {
      setSearchValue("");
      toast({
        title: "追加済み",
        description: "タグを追加しました。",
      });
    }
  };

  const handleAddTaskTag = async (selectedValue: string) => {
    const errorCode = await addTaskTag(projectSlug, taskId, selectedValue);
    if (errorCode) {
      toast({
        variant: "destructive",
        title: "タグの追加に失敗しました。",
        description: `何度も続く場合は管理者に連絡してください。(${errorCode})`,
      });
    } else {
      setSearchValue("");
      toast({
        title: "追加済み",
        description: "タグを追加しました。",
      });
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1">
      {tags?.map((tag, index) => (
        <Badge key={index} variant="secondary">
          {tag.name}
          <X
            size="16px"
            className="ml-1 hover:opacity-50 cursor-pointer"
            onClick={() => handleDeleteTaskTag(tag.id)}
          />
        </Badge>
      ))}

      <Popover>
        <PopoverTrigger asChild>
          <Plus size="20px" className="ml-1" />
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandInput
              placeholder="タグを検索/追加"
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandList>
              <CommandEmpty
                className="py-6 text-center text-sm hover:opacity-50 cursor-pointer"
                onClick={() => handleAddTaskNewTag()}
              >
                タグを追加
              </CommandEmpty>
              <CommandGroup>
                <ScrollArea className="h-[200px]">
                  {allTags?.map((tag, index) => (
                    <CommandItem
                      key={index}
                      value={tag.name}
                      onSelect={() => handleAddTaskTag(tag.id)}
                    >
                      {tag.name}
                    </CommandItem>
                  ))}
                </ScrollArea>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
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
