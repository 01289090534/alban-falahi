(()=>{
  const originalFetch=window.fetch.bind(window);
  const apiBase='https://qxwvuxkbcghbkztjrzon.supabase.co/rest/v1/';
  const proxyBase='https://qxwvuxkbcghbkztjrzon.supabase.co/functions/v1/admin-api';
  const authBase='https://qxwvuxkbcghbkztjrzon.supabase.co/auth/v1/token?grant_type=refresh_token';
  const publishableKey='sb_publishable_JI9lC4YPTCQ8CwMxzvHNIA_C24ULpWH';
  let refreshPromise=null;
  const readSession=()=>{try{return JSON.parse(localStorage.getItem('alban_admin_session')||'null')}catch{return null}};
  const saveSession=s=>{localStorage.setItem('alban_admin_session',JSON.stringify(s));return s};
  async function refreshSession(){
    const s=readSession();
    if(!s?.refresh_token)return null;
    if(refreshPromise)return refreshPromise;
    refreshPromise=(async()=>{
      const r=await originalFetch(authBase,{method:'POST',headers:{apikey:publishableKey,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:s.refresh_token})});
      const d=await r.json().catch(()=>null);
      if(!r.ok||!d?.access_token)return null;
      const next={...s,access_token:d.access_token,refresh_token:d.refresh_token||s.refresh_token,expires_in:d.expires_in||s.expires_in,expires_at:d.expires_at||Math.floor(Date.now()/1000)+(d.expires_in||3600)};
      saveSession(next);return next;
    })().finally(()=>{refreshPromise=null});
    return refreshPromise;
  }
  window.fetch=async(input,init={})=>{
    const raw=typeof input==='string'?input:input?.url;
    if(!raw||!raw.startsWith(apiBase))return originalFetch(input,init);
    const u=new URL(raw);
    const path=u.pathname.slice(apiBase.length)+u.search;
    const target=proxyBase+'?path='+encodeURIComponent(path);
    const makeRequest=async()=>{
      const h=new Headers(init.headers||((input instanceof Request)?input.headers:undefined));
      const s=readSession();
      if(s?.access_token)h.set('Authorization','Bearer '+s.access_token);
      if(!h.has('Content-Type')&&init.body)h.set('Content-Type','application/json');
      return originalFetch(target,{...init,headers:h});
    };
    let r=await makeRequest();
    if(r.status===401){
      const s=await refreshSession();
      if(s?.access_token)r=await makeRequest();
    }
    return r;
  };
})();