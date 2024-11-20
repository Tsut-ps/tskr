"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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

type StoreProject = {
  slug: string;
  name: string;
};

const storeProjects: StoreProject[] = [
  {
    slug: "00000000-0000-0000-0000-000000000000",
    name: "(dummy)",
  },
];

export function Combobox() {
  const { projectSlug } = useParams();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedSlug, setSelectedSlug] = useState(projectSlug);

  // 選択中のプロジェクトを取得 (遷移時に再取得しない)
  const selectedProject = useMemo(
    () =>
      storeProjects.find((storeProject) => storeProject.slug === selectedSlug),
    [selectedSlug]
  );

  return (
    <div className="hidden md:flex">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="md:w-[180px] lg:w-[240px] justify-between"
          >
            {selectedProject?.name ?? "プロジェクトを選択"}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[240px] p-0">
          <Command>
            <CommandInput placeholder="プロジェクトを探す" />
            <CommandList>
              <CommandEmpty>プロジェクトが見つかりません。</CommandEmpty>
              <CommandGroup heading="アクセス履歴一覧">
                {storeProjects.map((project) => (
                  <CommandItem
                    key={project.slug}
                    value={project.name}
                    onSelect={() => {
                      setSelectedSlug(project.slug);
                      setOpen(false);
                      router.push(`/p/${project.slug}`);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedSlug === project.slug
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    {project.name}
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandGroup heading="新規">
                <CommandItem
                  value="新しいプロジェクトを作成"
                  onSelect={() => {
                    setSelectedSlug("");
                    setOpen(false);
                    router.push("/p/new");
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  新しいプロジェクトを作成
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
