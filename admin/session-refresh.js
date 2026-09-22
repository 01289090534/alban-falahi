/* Alban Falahi — shop session keep-alive
   Scope: authentication/session refresh only. Does not perform logout.
*/
(function () {
  const KEY = 'alban_shop_session';
  let refreshing = null;

  function readSession() {
    try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (_) { return null; }
  }

  function writeSession(session) {
    if (session) localStorage.setItem(KEY, JSON.stringify(session));
    return session;
  }

  async function refreshIfNeeded(force) {
    const s = readSession();
    if (!s || !s.refresh_token) return s;
    if (refreshing) return refreshing;
    const exp = Number(s.expires_at || 0);
    if (!force && exp && exp * 1000 > Date.now() + 60_000) return s;
    refreshing = fetch('/auth/v1/token?grant_type=refresh_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': s.apikey || '' },
      body: JSON.stringify({ refresh_token: s.refresh_token })
    }).then(async r => {
      if (!r.ok) return s;
      const n = await r.json();
      return writeSession(Object.assign({}, s, n, { expires_at: n.expires_at || Math.floor(Date.now()/1000) + (n.expires_in || 3600) }));
    }).catch(() => s).finally(() => { refreshing = null; });
    return refreshing;
  }

  window.AlbanShopSession = { readSession, writeSession, refreshIfNeeded };
  refreshIfNeeded(false);
  window.addEventListener('focus', () => refreshIfNeeded(false));
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refreshIfNeeded(false); });
})();
