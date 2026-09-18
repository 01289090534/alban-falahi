// عرض عدد التقييمات بصيغة K مع الحفاظ على العدد الحقيقي
(()=>{
  const BASE_DISPLAY=1000;
  const formatCount=n=>{
    const v=Math.max(0,Math.floor(Number(n)||0));
    if(v<1000)return String(v);
    const k=v/1000;
    return (Math.round(k*10)/10).toFixed(k%1===0?0:1)+'K';
  };
  const apply=()=>{
    const el=document.getElementById('rating');
    if(!el)return;
    const m=el.textContent.match(/\((\d+)\s*تقييم\)/);
    if(!m)return;
    const realCount=Number(m[1])||0;
    const displayCount=BASE_DISPLAY+realCount;
    el.textContent=el.textContent.replace(/\(\d+\s*تقييم\)/,'('+formatCount(displayCount)+' تقييم)');
  };
  apply();
  new MutationObserver(apply).observe(document.body,{subtree:true,childList:true,characterData:true});
})();