"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useMemo, useEffect } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";

import { cn } from "@/lib/utils";
import { getProjectName } from "./actions";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
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

// プロジェクトの履歴を保存するアトム (アクセス履歴)
const recentProjectsAtom = atomWithStorage<StoreProject[]>(
  "project",
  [],
  undefined,
  {
    getOnInit: true,
  }
);

export function ProjectCombobox() {
  const router = useRouter();
  const projectSlug = useParams().projectSlug as string;

  const [recentProjects, setRecentProjects] = useAtom(recentProjectsAtom);
  const [selectedSlug, setSelectedSlug] = useState("");
  const [open, setOpen] = useState(false);

  // ハイドレーションエラー対策
  useEffect(() => {
    if (!projectSlug) return;
    setSelectedSlug(projectSlug);
  }, [projectSlug]);

  // プロジェクト履歴に追加
  useEffect(() => {
    // プロジェクトのSlugがない場合は何もしない (レンダリング中は取得できない)
    if (!projectSlug) return;

    const fetchProjectName = async () => {
      const projectName = await getProjectName(projectSlug);
      // プロジェクト名が取得できない場合は追加しない
      if (!projectName) return;

      setRecentProjects((prev) => {
        // すでに追加済みの場合はプロジェクト名のみ更新
        if (prev.some((project) => project.slug === projectSlug)) {
          return prev.map((project) =>
            project.slug === projectSlug
              ? { slug: projectSlug, name: projectName }
              : project
          );
        }
        // それ以外は新規追加
        return [...prev, { slug: projectSlug, name: projectName }];
      });
    };
    fetchProjectName();
  }, [projectSlug, setRecentProjects]);

  // 選択中のプロジェクトを取得 (遷移時に再取得しない)
  const selectedProject = useMemo(
    () =>
      recentProjects.find(
        (recentProject) => recentProject.slug === selectedSlug
      ),
    [recentProjects, selectedSlug]
  );

  return (
    <div className="md:flex">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="md:w-[180px] lg:w-[240px] justify-between"
          >
            <span className="truncate">
              {selectedProject?.name ?? "プロジェクトを選択"}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[240px] p-0">
          <Command>
            <CommandInput placeholder="プロジェクトを探す" />
            <CommandList>
              <CommandEmpty>プロジェクトが見つかりません。</CommandEmpty>
              <CommandGroup heading="アクセス履歴一覧">
                {recentProjects.map((project) => (
                  <CommandItem
                    key={project.slug}
                    value={project.name}
                    onSelect={() => {
                      setSelectedSlug(project.slug);
                      setOpen(false);
                      router.push(`/${project.slug}`);
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
                    <span className="truncate">{project.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup heading="新規">
                <CommandItem
                  value="新しいプロジェクトを作成"
                  onSelect={() => {
                    setSelectedSlug("");
                    setOpen(false);
                    router.push("/new");
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
