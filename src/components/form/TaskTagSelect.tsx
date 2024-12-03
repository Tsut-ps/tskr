"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";

import { deleteTaskTag, createProjectTag, addTaskTag } from "@/app/actions";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
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

export function TaskTagSelect({
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
    const errorCode = await deleteTaskTag(taskId, selectedValue);
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
    const errorCode = await addTaskTag(taskId, selectedValue);
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

      <Popover modal={true}>
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
            <CommandList className="shadcn-scrollbar">
              <CommandEmpty
                className="py-6 text-center text-sm hover:opacity-50 cursor-pointer"
                onClick={() => handleCreateNewTag()}
              >
                タグを追加
              </CommandEmpty>
              <CommandGroup>
                {allTags?.map((tag, index) => (
                  <CommandItem
                    key={index}
                    value={tag.name}
                    onSelect={() => handleAddTaskTag(tag.id)}
                  >
                    {tag.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
