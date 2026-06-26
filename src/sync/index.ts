import { recordSyncAt } from './config';
import {
  applySnapshotDirect,
  createLocalSnapshot,
  mergeAndApplyRemote,
  mergeSnapshots,
} from './snapshot';
import type { SyncResult, WebDavConfig } from './types';
import { downloadRemoteFile, uploadRemoteFile } from './webdav';
import { parseAndValidateSnapshot } from './validate';

export type { DataSnapshot, SyncResult, WebDavConfig } from './types';
export { DEFAULT_WEBDAV_PATH } from './types';
export { getWebDavConfig, setWebDavConfig, getLastSyncAt, recordSyncAt } from './config';
export { testWebDavConnection } from './webdav';

export async function pullFromWebDav(config: WebDavConfig): Promise<SyncResult> {
  const raw = await downloadRemoteFile(config);
  const syncedAt = Date.now();

  if (!raw) {
    recordSyncAt(syncedAt);
    return {
      pulled: false,
      pushed: false,
      merged: { folders: 0, prompts: 0, versions: 0 },
      syncedAt,
    };
  }

  const remote = parseAndValidateSnapshot(raw);
  const merged = await mergeAndApplyRemote(remote);
  recordSyncAt(syncedAt);

  return {
    pulled: true,
    pushed: false,
    merged,
    syncedAt,
  };
}

export async function pushToWebDav(config: WebDavConfig): Promise<SyncResult> {
  const snapshot = await createLocalSnapshot();
  await uploadRemoteFile(config, JSON.stringify(snapshot, null, 2));
  const syncedAt = Date.now();
  recordSyncAt(syncedAt);

  return {
    pulled: false,
    pushed: true,
    merged: {
      folders: snapshot.folders.length,
      prompts: snapshot.prompts.length,
      versions: snapshot.versions.length,
    },
    syncedAt,
  };
}

/** 拉取远程 → 与本地合并 → 写回远程 */
export async function syncWithWebDav(config: WebDavConfig): Promise<SyncResult> {
  const local = await createLocalSnapshot();
  const raw = await downloadRemoteFile(config);
  const syncedAt = Date.now();

  let merged = local;
  let pulled = false;

  if (raw) {
    const remote = parseAndValidateSnapshot(raw);
    merged = mergeSnapshots(local, remote);
    pulled = true;
  }

  await uploadRemoteFile(config, JSON.stringify(merged, null, 2));
  await applySnapshotDirect(merged);
  recordSyncAt(syncedAt);

  return {
    pulled,
    pushed: true,
    merged: {
      folders: merged.folders.length,
      prompts: merged.prompts.length,
      versions: merged.versions.length,
    },
    syncedAt,
  };
}