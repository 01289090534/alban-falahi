(()=>{
  const originalFetch=window.fetch.bind(window);
  const apiBase='https://qxwvuxkbcghbkztjrzon.supabase.co/rest/v1/';
  const proxyBase='https://qxwvuxkbcghbkztjrzon.supabase.co/functions/v1/admin-api';
  window.fetch=(input,init={})=>{
    const raw=typeof input==='string'?input:input?.url;
    if(!raw||!raw.startsWith(apiBase)) return originalFetch(input,init);
    const u=new URL(raw);
    const path=u.pathname.slice(apiBase.length)+u.search;
    const target=proxyBase+'?path='+encodeURIComponent(path);
    const h=new Headers(init.headers||((input instanceof Request)?input.headers:undefined));
    const token=localStorage.getItem('alban_admin_session');
    try{const s=JSON.parse(token||'null');if(s?.access_token)h.set('Authorization','Bearer '+s.access_token)}catch{}
    if(!h.has('Content-Type')&&init.body)h.set('Content-Type','application/json');
    return originalFetch(target,{...init,headers:h});
  };
})();