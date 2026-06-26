export type UrlSafetyOptions = {
  /** 为 true 时拒绝非 https（WebDAV 等敏感场景） */
  requireHttps?: boolean;
  /** 允许空字符串（未配置时） */
  allowEmpty?: boolean;
};

/** 校验并规范化 http(s) URL，拒绝 javascript: 等危险协议 */
export function normalizeHttpUrl(raw: string, opts: UrlSafetyOptions = {}): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    if (opts.allowEmpty) return '';
    throw new Error('URL 不能为空');
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error('URL 格式无效');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('仅支持 http 或 https 地址');
  }

  if (opts.requireHttps && parsed.protocol !== 'https:') {
    throw new Error('请使用 HTTPS 地址以保护密钥与密码安全');
  }

  return parsed.toString().replace(/\/$/, '');
}

/** 自定义 API 端点：仅允许 https，降低密钥被劫持风险 */
export function normalizeApiBaseUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) throw new Error('请填写 API Base URL');
  return normalizeHttpUrl(trimmed, { requireHttps: true });
}