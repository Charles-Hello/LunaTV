export const DEFAULT_CONFIG_SUBSCRIPTION_URL =
  process.env.NEXT_PUBLIC_DEFAULT_CONFIG_SUBSCRIPTION_URL ||
  'https://raw.githubusercontent.com/hafrey1/LunaTV-config/refs/heads/main/LunaTV-config.txt';

const CONFIG_SUBSCRIPTION_FETCH_TIMEOUT_MS = 30_000;
const CONFIG_SUBSCRIPTION_FETCH_USER_AGENT = 'LunaTV-ConfigFetcher/1.0';

export async function decodeSubscribedConfig(rawContent: string): Promise<string> {
  const trimmedContent = rawContent.trim();

  if (!trimmedContent) {
    throw new Error('配置订阅内容为空');
  }

  if (trimmedContent.startsWith('{') || trimmedContent.startsWith('[')) {
    JSON.parse(trimmedContent);
    return trimmedContent;
  }

  try {
    const bs58 = (await import('bs58')).default;
    const decodedBytes = bs58.decode(trimmedContent);
    const decodedContent = new TextDecoder().decode(decodedBytes);

    JSON.parse(decodedContent);
    return decodedContent;
  } catch (error) {
    console.warn('配置订阅 Base58 解码失败:', error);
    throw new Error('配置订阅解码失败');
  }
}

export async function fetchSubscribedConfig(url: string): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CONFIG_SUBSCRIPTION_FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': CONFIG_SUBSCRIPTION_FETCH_USER_AGENT,
      },
    });

    if (!response.ok) {
      throw new Error(`请求失败: ${response.status} ${response.statusText}`);
    }

    const rawContent = await response.text();
    return decodeSubscribedConfig(rawContent);
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error('订阅配置请求超时');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
