// يعرض رصيد البونص الحقيقي للعميل في صفحة الحساب
(()=>{
  const run=async()=>{
    try{
      const s=JSON.parse(localStorage.getItem('alban_auth_session')||'null');
      const customerId=localStorage.getItem('alban_customer_id');
      if(!s?.access_token||!customerId)return;
      const r=await fetch('https://qxwvuxkbcghbkztjrzon.supabase.co/functions/v1/customer-points-secure',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+s.access_token},body:JSON.stringify({customer_id:customerId}),cache:'no-store'});
      const d=await r.json();
      if(!d?.success)return;
      const p=d.points||{};
      const points=Math.max(0,Number(p.total_points)||0);
      const value=Number(p.value_egp)||0;
      const soon=Math.max(0,Number(p.expiring_soon_points)||0);
      const fmt=n=>Number(n||0).toLocaleString('ar-EG');
      const money=n=>Number(n||0).toFixed(2).replace('.', '٫')+' ج.م';
      const set=(id,text)=>{const e=document.getElementById(id);if(e)e.textContent=text};
      set('balance',money(value));
      set('totalPoints',fmt(points));
      set('value',money(value));
      set('soon',fmt(soon));
      set('pointsText',`معاك ${fmt(points)} نقطة — قيمة النقاط ${money(value)}`);
      const top=document.getElementById('topPoints');
      if(top){top.style.display='flex';top.innerHTML=`<span class="points-badge">🎁 ${fmt(points)} نقطة</span><span class="points-badge">💰 ${money(value)}</span>`}
    }catch(e){console.error('bonus widget',e)}
  };
  run();
  window.addEventListener('pageshow',run);
})();
