"use client";

import { useEffect, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { createProjectUser } from "@/app/actions";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// ユーザーの選択を記録するアトム
const selectedUserIdAtom = atomWithStorage<string>("user", "", undefined, {
  getOnInit: true,
});

export function ProjectUserSelect({
  projectSlug,
  users,
}: {
  projectSlug: string;
  users: { id: string; name: string }[];
}) {
  const [selectedUserId, setSelectedUserId] = useAtom(selectedUserIdAtom);
  const [searchValue, setSearchValue] = useState("");
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // ハイドレーションエラー対策
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCreateNewUser = async () => {
    if (!searchValue) {
      toast({
        variant: "destructive",
        title: "ユーザーの追加に失敗しました。",
        description: "ユーザー名を入力してください。",
      });
      return;
    }
    const { userId, errorCode } = await createProjectUser(
      projectSlug,
      searchValue,
      "settings"
    );
    if (errorCode || !userId) {
      toast({
        variant: "destructive",
        title: "ユーザー名の作成に失敗しました。",
        description: `何度も続く場合は管理者に連絡してください。(${errorCode})`,
      });
    } else {
      handleChangeUser(userId);
    }
  };

  const handleChangeUser = (selectedValue: string) => {
    setSelectedUserId(selectedValue);
    setOpen(false);
    toast({
      title: "ユーザーを変更しました。",
    });
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-64 justify-between my-2"
          >
            {mounted && selectedUserId ? (
              users.find((user) => user.id === selectedUserId)?.name || (
                <span className="text-muted-foreground">
                  (ユーザーが見つかりません)
                </span>
              )
            ) : (
              <span className="text-muted-foreground">(ユーザーを選択)</span>
            )}
            <ChevronDown className="h-4 w-4 ml-1 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0">
          <Command>
            <CommandInput
              placeholder="ユーザーを検索"
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
                {users.map((user, index) => (
                  <CommandItem
                    key={index}
                    value={user.name}
                    onSelect={() => handleChangeUser(user.id)}
                  >
                    <Check
                      size="20px"
                      className={cn(
                        "mr-2",
                        selectedUserId === user.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {user.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </>
  );
}
