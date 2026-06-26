import type { WebDavConfig } from './types';

function normalizeBaseUrl(url: string): string {
  return url.trim().replace(/\/+$/, '');
}

function joinUrl(base: string, path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizeBaseUrl(base)}${cleanPath}`;
}

function authHeader(username: string, password: string): string {
  return `Basic ${btoa(`${username}:${password}`)}`;
}

async function webdavFetch(
  config: WebDavConfig,
  path: string,
  init: RequestInit,
): Promise<Response> {
  const url = joinUrl(config.url, path);
  const headers = new Headers(init.headers);
  headers.set('Authorization', authHeader(config.username, config.password));

  return fetch(url, { ...init, headers });
}

export async function testWebDavConnection(config: WebDavConfig): Promise<void> {
  if (!config.url.trim()) throw new Error('请填写 WebDAV 地址');
  if (!config.username.trim()) throw new Error('请填写用户名');

  const res = await webdavFetch(config, config.remotePath || '/', {
    method: 'PROPFIND',
    headers: { Depth: '0' },
  });

  if (res.status === 401 || res.status === 403) {
    throw new Error('认证失败，请检查用户名和密码');
  }
  if (!res.ok && res.status !== 404) {
    throw new Error(`连接失败（HTTP ${res.status}）`);
  }
}

export async function downloadRemoteFile(config: WebDavConfig): Promise<string | null> {
  const res = await webdavFetch(config, config.remotePath, { method: 'GET' });

  if (res.status === 404) return null;
  if (res.status === 401 || res.status === 403) {
    throw new Error('认证失败，请检查用户名和密码');
  }
  if (!res.ok) throw new Error(`下载失败（HTTP ${res.status}）`);

  return res.text();
}

export async function uploadRemoteFile(config: WebDavConfig, content: string): Promise<void> {
  const res = await webdavFetch(config, config.remotePath, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: content,
  });

  if (res.status === 401 || res.status === 403) {
    throw new Error('认证失败，请检查用户名和密码');
  }
  if (!res.ok) throw new Error(`上传失败（HTTP ${res.status}）`);
}