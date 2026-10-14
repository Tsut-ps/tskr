import type { MyKeys, PendingMember, WorkspaceSummary } from "./api-types";
import type { Envelope, PutRecordInput, Role, UserKeysInput } from "./schema";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    credentials: "same-origin",
    headers: init?.body ? { "Content-Type": "application/json" } : undefined,
  });
  if (!res.ok) throw new ApiError(res.status, await res.text());
  return res.json() as Promise<T>;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

const json = (body: unknown) => JSON.stringify(body);

export type Member = { user_id: string; role: Role; name: string; image: string | null; public_key: string | null };

export const api = {
  me: () => request<{ userId: string; keys: MyKeys }>("/api/me"),
  registerKeys: (input: UserKeysInput) => request("/api/me/keys", { method: "PUT", body: json(input) }),
  workspaces: () => request<WorkspaceSummary[]>("/api/workspaces"),
  createWorkspace: (sealedKey: string) =>
    request<{ id: string }>("/api/workspaces", { method: "POST", body: json({ sealedKey }) }),
  members: (id: string) => request<Member[]>(`/api/workspaces/${id}/members`),
  records: (id: string, since: number) =>
    request<{ version: number; records: Envelope[] }>(`/api/workspaces/${id}/records?since=${since}`),
  putRecord: (id: string, recordId: string, input: PutRecordInput) =>
    request<Envelope>(`/api/workspaces/${id}/records/${encodeURIComponent(recordId)}`, {
      method: "PUT",
      body: json(input),
    }),
  createInvite: (id: string) => request<{ inviteId: string }>(`/api/workspaces/${id}/invites`, { method: "POST", body: "{}" }),
  join: (inviteId: string, keyProof: string) =>
    request<{ workspaceId: string }>(`/api/invites/${inviteId}/join`, { method: "POST", body: json({ keyProof }) }),
  pending: (id: string) => request<PendingMember[]>(`/api/workspaces/${id}/pending`),
  approve: (id: string, userId: string, sealedKeys: { epoch: number; sealedKey: string }[]) =>
    request(`/api/workspaces/${id}/members/${userId}/approve`, { method: "POST", body: json({ sealedKeys }) }),
};
