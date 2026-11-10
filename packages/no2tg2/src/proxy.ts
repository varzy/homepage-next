import type { Agent } from 'node:http';

import { ProxyAgent as NodeProxyAgent } from 'proxy-agent';
import { ProxyAgent as UndiciProxyAgent, setGlobalDispatcher } from 'undici';

const proxyDispatcherCache = new Map<string, UndiciProxyAgent>();

export function resolveProxyUrl(env: NodeJS.ProcessEnv = process.env): string | null {
  return (
    env.https_proxy ??
    env.HTTPS_PROXY ??
    env.http_proxy ??
    env.HTTP_PROXY ??
    env.all_proxy ??
    env.ALL_PROXY ??
    null
  );
}

export function createNodeProxyAgent(env: NodeJS.ProcessEnv = process.env): Agent | null {
  const proxyUrl = resolveProxyUrl(env);
  if (!proxyUrl) {
    return null;
  }

  return new NodeProxyAgent({
    getProxyForUrl: () => proxyUrl,
  });
}

function getProxyDispatcher(proxyUrl: string): UndiciProxyAgent {
  const cached = proxyDispatcherCache.get(proxyUrl);
  if (cached) {
    return cached;
  }

  const dispatcher = new UndiciProxyAgent(proxyUrl);
  proxyDispatcherCache.set(proxyUrl, dispatcher);
  return dispatcher;
}

export function applyGlobalProxyForFetch(env: NodeJS.ProcessEnv = process.env): string | null {
  const proxyUrl = resolveProxyUrl(env);
  if (!proxyUrl) {
    return null;
  }

  setGlobalDispatcher(getProxyDispatcher(proxyUrl));
  return proxyUrl;
}
