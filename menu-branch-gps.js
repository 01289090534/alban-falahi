(()=>{
  const U='https://qxwvuxkbcghbkztjrzon.supabase.co';
  const K='sb_publishable_JI9lC4YPTCQ8CwMxzvHNIA_C24ULpWH';
  const BRANCHES=U+'/rest/v1/branches?select=id,name_ar,name_en,latitude,longitude&is_active=eq.true';
  const R=6371;
  const distance=(a,b,c,d)=>{const p=Math.PI/180,x=(c-a)*p,y=(d-b)*p,q=Math.sin(x/2)**2+Math.cos(a*p)*Math.cos(c*p)*Math.sin(y/2)**2;return 2*R*Math.asin(Math.sqrt(q))};
  const setStatus=t=>{const el=document.getElementById('status');if(el)el.textContent=t};
  const apply=branch=>{const s=document.getElementById('branch');if(!s||!branch)return false;const value=String(branch.id);if(!Array.from(s.options).some(o=>String(o.value)===value))return false;s.value=value;s.dispatchEvent(new Event('change',{bubbles:true}));if(typeof window.branchChanged==='function'){try{window.branchChanged()}catch(e){console.warn('branchChanged',e)}};setStatus('📍 '+(branch.name_ar||branch.name_en||'تم اختيار أقرب فرع'));return true};
  async function choose(){
    if(!navigator.geolocation){setStatus('📍 GPS غير متاح - اختر الفرع يدويًا');return}
    setStatus('📍 جاري تحديد أقرب فرع...');
    let branches=[];
    try{const r=await fetch(BRANCHES,{headers:{apikey:K,Authorization:'Bearer '+K}});if(!r.ok)throw Error(await r.text());branches=await r.json()}catch(e){console.error('branch GPS data',e);setStatus('📍 تعذر تحميل الفروع');return}
    const usable=branches.filter(b=>Number.isFinite(Number(b.latitude))&&Number.isFinite(Number(b.longitude)));
    if(!usable.length){setStatus('📍 لا توجد إحداثيات للفروع');return}
    navigator.geolocation.getCurrentPosition(pos=>{
      const {latitude,longitude}=pos.coords;
      const nearest=usable.reduce((best,b)=>!best||distance(latitude,longitude,Number(b.latitude),Number(b.longitude))<best.d?{b,d:distance(latitude,longitude,Number(b.latitude),Number(b.longitude))}:best,null);
      if(nearest){apply(nearest.b);localStorage.setItem('alban_gps_branch_id',String(nearest.b.id));localStorage.setItem('alban_gps_branch_at',String(Date.now()))}
    },err=>{console.warn('customer GPS',err);setStatus(err.code===1?'📍 اسمح بالموقع لاختيار أقرب فرع تلقائيًا':'📍 تعذر تحديد الموقع - اختر الفرع يدويًا')},{enableHighAccuracy:true,timeout:10000,maximumAge:60000});
  }
  const start=()=>{let tries=0;const timer=setInterval(()=>{tries++;const s=document.getElementById('branch');if(s&&s.options.length>1){clearInterval(timer);choose()}if(tries>=40)clearInterval(timer)},250)};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
