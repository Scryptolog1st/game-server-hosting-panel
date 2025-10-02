const API = 'http://localhost:8080';

export function getToken() {
  return localStorage.getItem('access') || '';
}
export function setTokens(access: string, refresh?: string) {
  localStorage.setItem('access', access);
  if (refresh) localStorage.setItem('refresh', refresh);
}
export function clearTokens() {
  localStorage.removeItem('access');
  localStorage.removeItem('refresh');
}

async function req(path: string, opts: RequestInit = {}) {
  const headers = new Headers(opts.headers || {});
  headers.set('Content-Type', 'application/json');
  const tok = getToken();
  if (tok) headers.set('Authorization', `Bearer ${tok}`);
  const res = await fetch(API + path, { ...opts, headers });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const api = {
  // auth
  login: (email: string, password: string) =>
    req('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  me: () => req('/auth/me'),

  // servers
  listServers: () => req('/servers'),
  createServer: (payload: any) =>
    req('/servers', { method: 'POST', body: JSON.stringify(payload) }),

  // nodes
  listNodes: () => req('/nodes'),

  // assignments
  assignServer: (serverId: string, nodeId: string) =>
    req(`/servers/${serverId}/assign`, {
      method: 'PATCH',
      body: JSON.stringify({ nodeId }),
    }),
  unassignServer: (serverId: string) =>
    req(`/servers/${serverId}/unassign`, { method: 'PATCH' }),
};
