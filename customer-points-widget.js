// تحديث البونص من endpoint آمن وإظهار الرصيد الحقيقي في صفحة الحساب
async function refreshCustomerPoints(){
  try{
    const customerId=localStorage.getItem('alban_customer_id');
    const session=JSON.parse(localStorage.getItem('alban_auth_session')||'null');
    if(!customerId||!session?.access_token)return;
    const r=await fetch('https://qxwvuxkbcghbkztjrzon.supabase.co/functions/v1/customer-points-secure',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+session.access_token},body:JSON.stringify({customer_id:customerId}),cache:'no-store'});
    const d=await r.json();
    if(!d?.success)return;
    const p=d.points||{};
    const points=Math.max(0,Number(p.balance??p.total_points??0));
    const value=Number(p.value_egp??0);
    const arabic=n=>String(n).replace(/\d/g,x=>'٠١٢٣٤٥٦٧٨٩'[x]);
    const pointsText=arabic(Math.floor(points).toLocaleString('en-US'));
    const valueText=arabic(value.toFixed(2).replace('.', '٫'))+' ج.م';
    const set=(id,text)=>{const e=document.getElementById(id);if(e)e.textContent=text};
    set('pointsText','متاح للاستخدام: '+pointsText+' نقطة');
    set('totalPoints',pointsText);
    set('value',valueText);
    set('bonusBalance',pointsText+' نقطة = '+valueText);
    const mini=document.getElementById('topPoints');
    if(mini){mini.style.display='flex';mini.innerHTML='<span class="points-badge">🎁 البونص: <strong>'+pointsText+' نقطة</strong> = '+valueText+'</span>';}
    const balance=document.getElementById('balance');
    if(balance)balance.textContent=valueText;
  }catch(e){console.error('customer points widget',e)}
}
refreshCustomerPoints();
setTimeout(refreshCustomerPoints,2500);
setInterval(refreshCustomerPoints,10000);
// trigger deployment/injection v3
