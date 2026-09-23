const U='https://qxwvuxkbcghbkztjrzon.supabase.co';
const K='sb_publishable_JI9lC4YPTCQ8CwMxzvHNIA_C24ULpWH';
let albanDeliveryOpen=true;
let albanDeliveryTimer=null;

// PREVIEW TEST ONLY: close delivery at 20:00 so the closed-state UI can be tested now.
// Remove this override before merging; production hours remain 10:00 -> 01:00.
const ALBAN_PREVIEW_TEST_END='20:00';

function albanMinutes(v){
  const m=String(v||'').slice(0,5).split(':').map(Number);
  return Number.isFinite(m[0])&&Number.isFinite(m[1])?m[0]*60+m[1]:null;
}
function albanDeliveryIsOpen(start,end){
  const s=albanMinutes(start),e=albanMinutes(end);
  if(s===null||e===null||s===e)return true;
  const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Africa/Cairo',hour:'2-digit',minute:'2-digit',hour12:false}).formatToParts(new Date());
  const h=Number(parts.find(x=>x.type==='hour')?.value||0),m=Number(parts.find(x=>x.type==='minute')?.value||0);
  const now=h*60+m;
  return s<e ? now>=s&&now<e : now>=s||now<e;
}
function albanDeliveryBanner(start,end){
  let el=document.getElementById('deliveryHoursBanner');
  if(!el){
    el=document.createElement('div'); el.id='deliveryHoursBanner';
    el.style.cssText='margin-top:12px;padding:13px 14px;border-radius:15px;background:#fff4e8;color:#9a4b00;font-weight:900;text-align:center;line-height:1.7';
    const header=document.querySelector('header.header'); if(header) header.appendChild(el);
  }
  const s=String(start||'10:00').slice(0,5),e=String(end||'01:00').slice(0,5);
  if(albanDeliveryOpen){el.style.display='none';return;}
  el.style.display='block';
  el.innerHTML='🌙 <strong>التوصيل مغلق حاليًا</strong><br><span style="font-weight:700">يبدأ التوصيل يوميًا من الساعة '+s+' صباحًا</span><br><span style="font-size:12px;font-weight:600">يمكنك تصفح المنيو وتجهيز طلبك الآن، وسيصبح تأكيد الطلب متاحًا عند بدء التوصيل.</span>';
}
function albanDeliveryApply(start,end){
  albanDeliveryOpen=albanDeliveryIsOpen(start,end);
  albanDeliveryBanner(start,end);
  const btn=document.getElementById('confirm');
  if(btn){btn.disabled=!albanDeliveryOpen;btn.style.opacity=albanDeliveryOpen?'1':'.55';btn.textContent=albanDeliveryOpen?'تأكيد الطلب ❤️':'التوصيل مغلق حاليًا 🌙';}
}
async function albanLoadDeliveryHours(){
  try{
    const r=await fetch(U+'/rest/v1/store_settings?select=delivery_start,delivery_end&id=eq.true',{headers:{apikey:K,Authorization:'Bearer '+K},cache:'no-store'});
    const rows=await r.json();
    const s=rows?.[0]?.delivery_start||'10:00:00';
    const e=ALBAN_PREVIEW_TEST_END;
    albanDeliveryApply(s,e);
    if(albanDeliveryTimer)clearInterval(albanDeliveryTimer);
    albanDeliveryTimer=setInterval(()=>albanDeliveryApply(s,e),30000);
  }catch(err){console.error('delivery hours',err);}
}
window.addEventListener('load',albanLoadDeliveryHours);
const albanOriginalOrder=window.order;
window.order=async function(){
  if(!albanDeliveryOpen){
    if(typeof showErr==='function')showErr('التوصيل مغلق حاليًا. يبدأ التوصيل من الساعة 10:00 صباحًا ❤️');
    return;
  }
  return albanOriginalOrder.apply(this,arguments);
};
