"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";

import { deleteTaskUser, createProjectUser, addTaskUser } from "@/app/actions";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  Command,
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
import { Separator } from "@/components/ui/separator";

export function TaskUserSelect({
  projectSlug,
  taskId,
  allUsers,
  assignedUsers,
}: {
  projectSlug: string;
  taskId: string;
  allUsers: { id: string; name: string }[];
  assignedUsers: { id: string; name: string }[];
}) {
  const [searchValue, setSearchValue] = useState("");

  const handleDeleteTaskUser = async (selectedValue: string) => {
    const errorCode = await deleteTaskUser(taskId, selectedValue);
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
    const errorCode = await addTaskUser(taskId, selectedValue);
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

  const isUserNameExists = allUsers.some(
    (user) => user.name === searchValue.trim()
  );

  const isUserAssigned = (targetUserId: string) => {
    return assignedUsers.some((user) => user.id === targetUserId);
  };

  return (
    <div className="flex flex-wrap items-center gap-1">
      {assignedUsers.length ? (
        assignedUsers?.map((user, index) => (
          <Badge key={index} variant="outline">
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

      <Popover modal={true}>
        <PopoverTrigger asChild>
          <Plus size="20px" className="ml-1" />
        </PopoverTrigger>
        <PopoverContent className="w-[240px] p-0">
          <Command>
            <CommandInput
              placeholder="ユーザーを検索/追加"
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandList className="shadcn-scrollbar">
              <CommandGroup>
                {allUsers?.map((user, index) => (
                  <CommandItem
                    key={index}
                    value={user.name}
                    disabled={isUserAssigned(user.id)}
                    onSelect={() => handleAddTaskUser(user.id)}
                  >
                    {user.name}
                  </CommandItem>
                ))}
              </CommandGroup>
              <Separator />
              {searchValue && !isUserNameExists && (
                <CommandGroup>
                  <CommandItem
                    className="py-4"
                    value={searchValue}
                    onSelect={handleCreateNewUser}
                  >
                    <Plus size="20px" className="mr-2" />
                    {searchValue} を追加
                  </CommandItem>
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
