export class ApiError extends Error {
  constructor(message, status, errors) {
    super(message);
    this.status = status;
    this.errors = errors || {};
  }
}

async function request(path, { method = 'GET', body, params } = {}) {
  let qs = '';
  if (params) {
    const clean = Object.entries(params).filter(([, v]) => v !== '' && v != null);
    if (clean.length) qs = '?' + new URLSearchParams(clean).toString();
  }
  let res;
  try {
    res = await fetch(`/api${path}${qs}`, {
      method,
      credentials: 'same-origin',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('Cannot reach the server. Check your connection and try again.', 0);
  }
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
      // Session is invalid: clear the stale cookie first so the edge gate does not bounce us back.
      fetch('/api/auth/logout', { method: 'POST' }).finally(() => window.location.assign('/login'));
    }
    throw new ApiError(data.message || 'Something went wrong', res.status, data.errors);
  }
  return data;
}

export const api = {
  get: (path, params) => request(path, { params }),
  post: (path, body) => request(path, { method: 'POST', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  del: (path) => request(path, { method: 'DELETE' }),
};
