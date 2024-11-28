"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Plus, X } from "lucide-react";

import {
  updateTaskTeam,
  deleteTaskTag,
  createProjectTag,
  addTaskTag,
  deleteTaskUser,
  createProjectUser,
  addTaskUser,
  updateTaskStatus,
  updateTaskProgress,
  updateTaskDescription,
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
import { Progress } from "@/components/ui/progress";
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

  const handleCreateNewTag = async () => {
    if (!searchValue) {
      toast({
        variant: "destructive",
        title: "タグの追加に失敗しました。",
        description: "タグ名を入力してください。",
      });
      return;
    }
    const { tagId, errorCode } = await createProjectTag(
      projectSlug,
      searchValue
    );
    if (errorCode || !tagId) {
      toast({
        variant: "destructive",
        title: "タグの作成に失敗しました。",
        description: `何度も続く場合は管理者に連絡してください。(${errorCode})`,
      });
    } else {
      handleAddTaskTag(tagId);
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
                onClick={() => handleCreateNewTag()}
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

export function TaskUserArea({
  projectSlug,
  taskId,
  allUsers,
  users,
}: {
  projectSlug: string;
  taskId: string;
  allUsers: { id: string; name: string }[];
  users: { id: string; name: string }[];
}) {
  const [searchValue, setSearchValue] = useState("");

  const handleDeleteTaskUser = async (selectedValue: string) => {
    const errorCode = await deleteTaskUser(projectSlug, taskId, selectedValue);
    if (errorCode) {
      toast({
        variant: "destructive",
        title: "担当者の削除に失敗しました。",
        description: `何度も続く場合は管理者に連絡してください。(${errorCode})`,
      });
    } else {
      toast({
        title: "削除済み",
        description: "担当者を削除しました。",
      });
    }
  };

  const handleCreateNewUser = async () => {
    if (!searchValue) {
      toast({
        variant: "destructive",
        title: "担当者の追加に失敗しました。",
        description: "ユーザー名を入力してください。",
      });
      return;
    }
    const { userId, errorCode } = await createProjectUser(
      projectSlug,
      searchValue
    );
    if (errorCode || !userId) {
      toast({
        variant: "destructive",
        title: "ユーザー名の作成に失敗しました。",
        description: `何度も続く場合は管理者に連絡してください。(${errorCode})`,
      });
    } else {
      handleAddTaskUser(userId);
    }
  };

  const handleAddTaskUser = async (selectedValue: string) => {
    const errorCode = await addTaskUser(projectSlug, taskId, selectedValue);
    if (errorCode) {
      toast({
        variant: "destructive",
        title: "担当者の追加に失敗しました。",
        description: `何度も続く場合は管理者に連絡してください。(${errorCode})`,
      });
    } else {
      setSearchValue("");
      toast({
        title: "追加済み",
        description: "担当者を追加しました。",
      });
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1">
      {users.length ? (
        users?.map((user, index) => (
          <Badge key={index} variant="secondary">
            {user.name}
            <X
              size="16px"
              className="ml-1 hover:opacity-50 cursor-pointer"
              onClick={() => handleDeleteTaskUser(user.id)}
            />
          </Badge>
        ))
      ) : (
        <span className="text-red-500">(未割り当て)</span>
      )}

      <Popover>
        <PopoverTrigger asChild>
          <Plus size="20px" className="ml-1" />
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandInput
              placeholder="ユーザーを検索/追加"
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandList>
              <CommandEmpty
                className="py-6 text-center text-sm hover:opacity-50 cursor-pointer"
                onClick={() => handleCreateNewUser()}
              >
                ユーザーを追加
              </CommandEmpty>
              <CommandGroup>
                <ScrollArea className="h-[200px]">
                  {allUsers?.map((user, index) => (
                    <CommandItem
                      key={index}
                      value={user.name}
                      onSelect={() => handleAddTaskUser(user.id)}
                    >
                      {user.name}
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

export function TaskStatusArea({
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

export function TaskProgressArea({
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

const FormSchema = z.object({
  description: z.string().max(1000, {
    message: "1000文字以下で入力してください。",
  }),
});

export function TaskDescriptionArea({
  projectSlug,
  taskId,
  description,
}: {
  projectSlug: string;
  taskId: string;
  description: string;
}) {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  });

  const onSubmit = async () => {
    const { description } = form.getValues();
    const errorCode = await updateTaskDescription(
      projectSlug,
      taskId,
      description
    );
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
        className="grid w-full gap-2"
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
