// تحديث البونص من endpoint آمن وإظهاره في كل الصفحات
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
    const text='🎁 البونص: '+pointsText+' نقطة = '+valueText;
    const setText=(id,t)=>{const e=document.getElementById(id);if(e&&e.textContent!==t)e.textContent=t};
    setText('pointsText','متاح للاستخدام: '+pointsText+' نقطة');
    setText('totalPoints',pointsText);
    setText('value',valueText);
    setText('bonusBalance',pointsText+' نقطة = '+valueText);
    setText('bonusText','متاح '+pointsText+' نقطة = '+valueText);
    setText('points',text);
    const mini=document.getElementById('topPoints');
    if(mini){mini.style.display='flex';mini.innerHTML='<span class="points-badge">'+text+'</span>';}
    const balance=document.getElementById('balance');
    if(balance)balance.textContent=valueText;
  }catch(e){console.error('customer points widget',e)}
}
refreshCustomerPoints();
setTimeout(refreshCustomerPoints,1000);
setTimeout(refreshCustomerPoints,3000);
setTimeout(refreshCustomerPoints,6000);
setInterval(refreshCustomerPoints,10000);
// trigger deployment/injection v4
