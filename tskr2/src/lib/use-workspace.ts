import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "./api";
import type { ChangeNotice, WorkspaceSummary } from "./api-types";
import { decryptRecord, encryptRecord, type Identity, newId, openSealedKey } from "./crypto";
import type { Envelope, Payload, RecordKind } from "./schema";

export type Decrypted<K extends RecordKind = RecordKind> = {
  id: string;
  kind: K;
  version: number;
  updatedAt: number;
  updatedBy: string;
  data: Payload<K>;
};

/**
 * 1 ワークスペース分の暗号化レコードを同期し、ブラウザ内で復号して保持する。
 * サーバーからは WebSocket で「変更あり」だけを受け取り、差分は HTTP で取りに行く。
 */
export function useWorkspace(ws: WorkspaceSummary, identity: Identity) {
  const keys = useMemo(() => {
    const map = new Map<number, Uint8Array>();
    for (const [epoch, sealed] of Object.entries(ws.sealedKeys)) map.set(Number(epoch), openSealedKey(sealed, identity));
    return map;
  }, [ws.sealedKeys, identity]);

  const [records, setRecords] = useState<Map<string, Decrypted>>(new Map());
  const [undecryptable, setUndecryptable] = useState(0);
  const version = useRef(0);

  const sync = useCallback(async () => {
    const res = await api.records(ws.id, version.current);
    version.current = res.version;
    let failed = 0;
    setRecords((prev) => {
      const next = new Map(prev);
      for (const env of res.records) {
        if (env.deleted) {
          next.delete(env.id);
          continue;
        }
        const decrypted = tryDecrypt(ws.id, keys, env);
        if (decrypted) next.set(env.id, decrypted);
        else failed++;
      }
      return next;
    });
    if (failed) setUndecryptable((n) => n + failed);
  }, [ws.id, keys]);

  useEffect(() => {
    version.current = 0;
    setRecords(new Map());
    void sync();
    const proto = location.protocol === "https:" ? "wss" : "ws";
    const socket = new WebSocket(`${proto}://${location.host}/api/workspaces/${ws.id}/ws`);
    socket.onmessage = (e) => {
      const notice = JSON.parse(String(e.data)) as ChangeNotice;
      if (notice.type === "changed" && notice.version > version.current) void sync();
    };
    return () => socket.close();
  }, [ws.id, sync]);

  const save = useCallback(
    async <K extends RecordKind>(kind: K, data: Payload<K>, recordId = newId()) => {
      const key = keys.get(ws.currentEpoch);
      if (!key) throw new Error("workspace key unavailable");
      const sealed = encryptRecord(key, { workspaceId: ws.id, recordId, kind, epoch: ws.currentEpoch }, data);
      await api.putRecord(ws.id, recordId, {
        kind,
        epoch: ws.currentEpoch,
        ...sealed,
        baseVersion: records.get(recordId)?.version ?? 0,
        deleted: false,
      });
      await sync();
      return recordId;
    },
    [keys, ws.id, ws.currentEpoch, records, sync],
  );

  const list = useCallback(
    <K extends RecordKind>(kind: K) =>
      [...records.values()].filter((r): r is Decrypted<K> => r.kind === kind).sort((a, b) => a.updatedAt - b.updatedAt),
    [records],
  );

  return { records, list, save, keys, undecryptable };
}

function tryDecrypt(workspaceId: string, keys: Map<number, Uint8Array>, env: Envelope): Decrypted | null {
  const key = keys.get(env.epoch);
  if (!key) return null;
  try {
    const data = decryptRecord(key, { workspaceId, recordId: env.id, kind: env.kind, epoch: env.epoch }, env);
    return { id: env.id, kind: env.kind, version: env.version, updatedAt: env.updatedAt, updatedBy: env.updatedBy, data };
  } catch {
    return null;
  }
}
