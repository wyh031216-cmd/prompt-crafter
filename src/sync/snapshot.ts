import { repo } from '../data';
import { db } from '../db/database';
import type { Folder, Prompt, PromptVersion } from '../types/prompt';
import type { DataSnapshot } from './types';

export async function createLocalSnapshot(): Promise<DataSnapshot> {
  const [folders, prompts] = await Promise.all([
    repo.getAllFolders(),
    repo.getAllPrompts(),
  ]);

  const versionGroups = await Promise.all(
    prompts.map((p) => repo.getVersions(p.id)),
  );

  return {
    version: '1.1',
    exportedAt: Date.now(),
    folders,
    prompts,
    versions: versionGroups.flat(),
  };
}

function mergeById<T extends { id: string }>(
  local: T[],
  remote: T[],
  pick: (a: T, b: T) => T,
): T[] {
  const map = new Map<string, T>();
  for (const item of local) map.set(item.id, item);
  for (const item of remote) {
    const existing = map.get(item.id);
    map.set(item.id, existing ? pick(existing, item) : item);
  }
  return Array.from(map.values());
}

function mergePrompts(local: Prompt[], remote: Prompt[]): Prompt[] {
  return mergeById(local, remote, (a, b) => (a.updatedAt >= b.updatedAt ? a : b));
}

function mergeFolders(local: Folder[], remote: Folder[]): Folder[] {
  return mergeById(local, remote, (a, b) => (a.createdAt >= b.createdAt ? a : b));
}

function mergeVersions(local: PromptVersion[], remote: PromptVersion[]): PromptVersion[] {
  return mergeById(local, remote, (a, b) => (a.createdAt >= b.createdAt ? a : b));
}

export function mergeSnapshots(local: DataSnapshot, remote: DataSnapshot): DataSnapshot {
  return {
    version: '1.1',
    exportedAt: Date.now(),
    folders: mergeFolders(local.folders, remote.folders),
    prompts: mergePrompts(local.prompts, remote.prompts),
    versions: mergeVersions(local.versions, remote.versions),
  };
}

/** 直接写入 Dexie 表，保留远程 ID（同步专用） */
export async function applySnapshotDirect(snapshot: DataSnapshot): Promise<void> {
  await db.transaction('rw', db.folders, db.prompts, db.versions, async () => {
    const existingFolders = await db.folders.toArray();
    const existingPrompts = await db.prompts.toArray();
    const existingVersions = await db.versions.toArray();

    const folderMap = new Map(existingFolders.map((f) => [f.id, f]));
    const promptMap = new Map(existingPrompts.map((p) => [p.id, p]));
    const versionMap = new Map(existingVersions.map((v) => [v.id, v]));

    for (const f of snapshot.folders) folderMap.set(f.id, f);
    for (const p of snapshot.prompts) promptMap.set(p.id, p);
    for (const v of snapshot.versions) versionMap.set(v.id, v);

    await db.folders.clear();
    await db.prompts.clear();
    await db.versions.clear();

    await db.folders.bulkAdd(Array.from(folderMap.values()));
    await db.prompts.bulkAdd(Array.from(promptMap.values()));
    await db.versions.bulkAdd(Array.from(versionMap.values()));
  });
}

export async function mergeAndApplyRemote(remote: DataSnapshot): Promise<{
  folders: number;
  prompts: number;
  versions: number;
}> {
  const local = await createLocalSnapshot();
  const merged = mergeSnapshots(local, remote);
  await applySnapshotDirect(merged);
  return {
    folders: merged.folders.length,
    prompts: merged.prompts.length,
    versions: merged.versions.length,
  };
}