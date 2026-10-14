import { Check, Hash, Link, Plus, ShieldCheck, UserPlus } from "lucide-react";
import { type FormEvent, useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import type { PendingMember, WorkspaceSummary } from "@/lib/api-types";
import { authClient } from "@/lib/auth-client";
import {
  createInviteToken,
  createWorkspaceKey,
  encryptRecord,
  type Identity,
  proveKey,
  publicKeyFingerprint,
  sealKey,
  verifyKeyProof,
} from "@/lib/crypto";
import { taskStatuses } from "@/lib/schema";
import { useWorkspace } from "@/lib/use-workspace";
import { cn } from "@/lib/utils";

const statusLabel: Record<(typeof taskStatuses)[number], string> = {
  open: "未対応",
  in_progress: "処理中",
  done: "処理済み",
  closed: "完了",
};

/** Discord 風レイアウト: ワークスペース列 (サーバー) / チーム列 (チャンネル) / タスク */
export function Shell({ userName, identity }: { userId: string; userName: string; identity: Identity }) {
  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [names, setNames] = useState<Record<string, string>>({});

  const reload = useCallback(async () => {
    const list = await api.workspaces();
    setWorkspaces(list);
    setSelected((cur) => cur ?? list[0]?.id ?? null);
  }, []);

  useEffect(() => {
    void (async () => {
      // 招待リンク /invite/<id>#<token>。トークンは # 以降にあるのでサーバーには届かない
      const match = location.pathname.match(/^\/invite\/([\w-]+)$/);
      const token = location.hash.slice(1);
      if (match?.[1] && token) {
        const { workspaceId } = await api.join(match[1], proveKey(token, identity.publicKey));
        history.replaceState(null, "", "/");
        setSelected(workspaceId);
      }
      await reload();
    })();
  }, [identity, reload]);

  const createWorkspace = async () => {
    const name = prompt("ワークスペース名")?.trim();
    if (!name) return;
    const key = createWorkspaceKey();
    const { id } = await api.createWorkspace(sealKey(key, identity.publicKey));
    const ctx = { workspaceId: id, recordId: "workspace", kind: "workspace" as const, epoch: 1 };
    await api.putRecord(id, "workspace", { kind: "workspace", epoch: 1, baseVersion: 0, deleted: false, ...encryptRecord(key, ctx, { name }) });
    setSelected(id);
    await reload();
  };

  const current = workspaces.find((w) => w.id === selected);

  return (
    <div className="h-dvh flex">
      <nav className="w-[72px] shrink-0 bg-rail flex flex-col items-center gap-2 py-3">
        {workspaces.map((w) => (
          <button
            key={w.id}
            title={names[w.id] ?? "ワークスペース"}
            onClick={() => setSelected(w.id)}
            className={cn(
              "size-12 rounded-3xl bg-background flex items-center justify-center font-semibold transition-all hover:rounded-2xl hover:bg-primary",
              w.id === selected && "rounded-2xl bg-primary",
              w.status === "pending" && "opacity-50",
            )}
          >
            {(names[w.id] ?? "?").slice(0, 2)}
          </button>
        ))}
        <button
          title="ワークスペースを作成"
          onClick={() => void createWorkspace()}
          className="size-12 rounded-3xl bg-background text-success flex items-center justify-center hover:rounded-2xl hover:bg-success hover:text-white transition-all"
        >
          <Plus />
        </button>
      </nav>

      {current?.status === "active" ? (
        <WorkspaceView
          key={current.id}
          ws={current}
          identity={identity}
          userName={userName}
          onName={(name) => setNames((n) => (n[current.id] === name ? n : { ...n, [current.id]: name }))}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          {current ? "管理者の承認待ちです" : "左の + からワークスペースを作成してください"}
        </div>
      )}
    </div>
  );
}

function WorkspaceView({
  ws,
  identity,
  userName,
  onName,
}: {
  ws: WorkspaceSummary;
  identity: Identity;
  userName: string;
  onName: (name: string) => void;
}) {
  const { list, records, save, keys, undecryptable } = useWorkspace(ws, identity);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState("");
  const isAdmin = ws.role === "owner" || ws.role === "admin";
  const canWrite = ws.role !== "viewer";

  const workspace = records.get("workspace");
  const name = workspace?.kind === "workspace" ? (workspace.data as { name: string }).name : "…";
  useEffect(() => onName(name), [name, onName]);

  const teams = list("team");
  const activeTeam = teams.find((t) => t.id === teamId) ?? teams[0];
  const tasks = list("task").filter((t) => t.data.teamId === activeTeam?.id);

  const addTeam = async () => {
    const teamName = prompt("チーム名")?.trim();
    if (teamName) setTeamId(await save("team", { name: teamName }));
  };

  const createInvite = async () => {
    const token = createInviteToken();
    const { inviteId } = await api.createInvite(ws.id);
    await save("invite", { inviteId, token }, `invite-${inviteId}`);
    setInviteLink(`${location.origin}/invite/${inviteId}#${token}`);
  };

  return (
    <>
      <aside className="w-60 shrink-0 bg-sidebar flex flex-col">
        <header className="h-12 px-4 flex items-center font-semibold border-b shadow-sm">{name}</header>
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          <div className="flex items-center justify-between px-2 pt-2 pb-1 text-xs font-semibold uppercase text-muted-foreground">
            チーム
            {canWrite && (
              <button title="チームを追加" onClick={() => void addTeam()} className="hover:text-foreground">
                <Plus className="size-4" />
              </button>
            )}
          </div>
          {teams.map((t) => (
            <button
              key={t.id}
              onClick={() => setTeamId(t.id)}
              className={cn(
                "w-full flex items-center gap-1.5 rounded px-2 py-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                t.id === activeTeam?.id && "bg-accent text-accent-foreground",
              )}
            >
              <Hash className="size-4 shrink-0" />
              <span className="truncate">{t.data.name}</span>
            </button>
          ))}
          {isAdmin && <PendingMembers ws={ws} keys={keys} invites={list("invite").map((i) => i.data)} />}
        </div>
        {isAdmin && (
          <div className="p-2 border-t space-y-2">
            <Button size="sm" variant="secondary" className="w-full" onClick={() => void createInvite()}>
              <UserPlus /> 招待リンクを作成
            </Button>
            {inviteLink && (
              <Button size="sm" variant="ghost" className="w-full" onClick={() => void navigator.clipboard.writeText(inviteLink)}>
                <Link /> リンクをコピー
              </Button>
            )}
          </div>
        )}
        <footer className="h-14 px-3 flex items-center justify-between bg-rail/60 text-sm">
          <span className="truncate">{userName}</span>
          <Button size="sm" variant="ghost" onClick={() => void authClient.signOut().then(() => location.reload())}>
            ログアウト
          </Button>
        </footer>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-12 px-4 flex items-center gap-2 border-b shadow-sm font-semibold">
          <Hash className="size-5 text-muted-foreground" />
          {activeTeam?.data.name ?? "チームがありません"}
          <span className="ml-auto flex items-center gap-1 text-xs font-normal text-muted-foreground" title="内容はブラウザで暗号化されています">
            <ShieldCheck className="size-4 text-success" /> E2E
            {undecryptable > 0 && <span className="text-destructive">（復号できない項目 {undecryptable} 件）</span>}
          </span>
        </header>
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          {tasks.map((t) => (
            <div key={t.id} className="flex items-center gap-3 rounded px-3 py-2 hover:bg-accent/50">
              <button
                disabled={!canWrite}
                onClick={() => {
                  const next = taskStatuses[(taskStatuses.indexOf(t.data.status) + 1) % taskStatuses.length]!;
                  void save("task", { ...t.data, status: next }, t.id);
                }}
                className="text-xs rounded bg-secondary px-2 py-0.5 w-16 shrink-0"
              >
                {statusLabel[t.data.status]}
              </button>
              <span className={cn("flex-1 truncate", t.data.status === "closed" && "line-through text-muted-foreground")}>
                {t.data.title}
              </span>
              {t.data.dueDate && <span className="text-xs text-muted-foreground">{t.data.dueDate}</span>}
            </div>
          ))}
        </div>
        {activeTeam && canWrite && <NewTask onSubmit={(title) => save("task", newTask(activeTeam.id, title))} />}
      </main>
    </>
  );
}

function newTask(teamId: string, title: string) {
  return { teamId, title, status: "open" as const, progress: 0, assigneeIds: [], tagIds: [], embeds: [] };
}

function NewTask({ onSubmit }: { onSubmit: (title: string) => Promise<unknown> }) {
  const [title, setTitle] = useState("");
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    await onSubmit(title.trim());
    setTitle("");
  };
  return (
    <form onSubmit={(e) => void submit(e)} className="p-4 pt-0">
      <Input placeholder="タスクを追加" value={title} onChange={(e) => setTitle(e.target.value)} className="bg-accent border-0" />
    </form>
  );
}

/** 招待された人の公開鍵を、招待トークンの MAC で検証してからワークスペース鍵を渡す */
function PendingMembers({
  ws,
  keys,
  invites,
}: {
  ws: WorkspaceSummary;
  keys: Map<number, Uint8Array>;
  invites: { inviteId: string; token: string }[];
}) {
  const [pending, setPending] = useState<PendingMember[]>([]);
  const load = useCallback(() => void api.pending(ws.id).then(setPending), [ws.id]);
  useEffect(load, [load]);

  if (pending.length === 0) return null;

  return (
    <div className="pt-4">
      <div className="px-2 pb-1 text-xs font-semibold uppercase text-muted-foreground">承認待ち</div>
      {pending.map((p) => {
        const token = invites.find((i) => i.inviteId === p.inviteId)?.token;
        const verified = !!token && verifyKeyProof(token, p.publicKey, p.keyProof);
        return (
          <div key={p.userId} className="px-2 py-1.5 text-sm">
            <div className="flex items-center justify-between">
              <span className="truncate">{p.name}</span>
              <Button
                size="icon"
                variant="ghost"
                disabled={!verified}
                title={verified ? "承認して鍵を渡す" : "鍵の検証に失敗しました"}
                onClick={() =>
                  void api
                    .approve(ws.id, p.userId, [...keys].map(([epoch, key]) => ({ epoch, sealedKey: sealKey(key, p.publicKey) })))
                    .then(load)
                }
              >
                <Check />
              </Button>
            </div>
            <div className={cn("text-xs", verified ? "text-muted-foreground" : "text-destructive")}>
              {verified ? `指紋 ${publicKeyFingerprint(p.publicKey)}` : "鍵を検証できません"}
            </div>
          </div>
        );
      })}
    </div>
  );
}
