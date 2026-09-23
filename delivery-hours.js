const U='https://qxwvuxkbcghbkztjrzon.supabase.co';
const K='sb_publishable_JI9lC4YPTCQ8CwMxzvHNIA_C24ULpWH';
let albanDeliveryOpen=true;
let albanDeliveryTimer=null;
const ALBAN_PREVIEW_TEST_START='10:00';
const ALBAN_PREVIEW_TEST_END='13:00';
function albanMinutes(v){const m=String(v||'').slice(0,5).split(':').map(Number);return Number.isFinite(m[0])&&Number.isFinite(m[1])?m[0]*60+m[1]:null}
function albanDeliveryIsOpen(start,end){const s=albanMinutes(start),e=albanMinutes(end);if(s===null||e===null||s===e)return true;const p=new Intl.DateTimeFormat('en-GB',{timeZone:'Africa/Cairo',hour:'2-digit',minute:'2-digit',hour12:false}).formatToParts(new Date());const now=Number(p.find(x=>x.type==='hour')?.value||0)*60+Number(p.find(x=>x.type==='minute')?.value||0);return s<e?now>=s&&now<e:now>=s||now<e}
function albanDeliveryBanner(start,end){let el=document.getElementById('deliveryHoursBanner');if(!el){el=document.createElement('div');el.id='deliveryHoursBanner';el.style.cssText='margin:12px 0;padding:13px 14px;border-radius:15px;background:#fff4e8;color:#9a4b00;font-weight:900;text-align:center;line-height:1.7';const header=document.querySelector('.header');if(header)header.insertAdjacentElement('afterend',el)}const s=String(start||'10:00').slice(0,5),e=String(end||'01:00').slice(0,5);el.style.display=albanDeliveryOpen?'none':'block';if(!albanDeliveryOpen)el.innerHTML='🌙 <strong>التوصيل مغلق حاليًا</strong><br><span style="font-weight:700">يبدأ التوصيل يوميًا من الساعة '+s+' صباحًا</span><br><span style="font-size:12px;font-weight:600">يمكنك تصفح المنيو وتجهيز طلبك الآن، وسيصبح تأكيد الطلب متاحًا عند بدء التوصيل.</span>'}
function albanDeliveryApply(start,end){albanDeliveryOpen=albanDeliveryIsOpen(start,end);albanDeliveryBanner(start,end);const btn=document.getElementById('confirm');if(btn){btn.disabled=!albanDeliveryOpen;btn.style.opacity=albanDeliveryOpen?'1':'.55';btn.textContent=albanDeliveryOpen?'تأكيد الطلب ❤️':'التوصيل مغلق حاليًا 🌙'}}
function albanLoadDeliveryHours(){const s=ALBAN_PREVIEW_TEST_START,e=ALBAN_PREVIEW_TEST_END;albanDeliveryApply(s,e);if(albanDeliveryTimer)clearInterval(albanDeliveryTimer);albanDeliveryTimer=setInterval(()=>albanDeliveryApply(s,e),30000)}
if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',albanLoadDeliveryHours,{once:true});}else{albanLoadDeliveryHours();}
