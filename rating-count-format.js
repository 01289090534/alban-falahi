// تنسيق عدد التقييمات: الـ6 تقييمات الحالية = بداية 1K، وبعدها نحسب التقييمات الجديدة
(()=>{
  const BASE_REVIEWS=6;
  const BASE_DISPLAY=1000;
  const formatCount=n=>{
    const x=Math.max(0,Number(n)||0);
    if(x<1000)return String(Math.floor(x));
    const k=x/1000;
    return (Math.round(k*10)/10).toFixed(1).replace('.0','')+'K';
  };
  const apply=()=>{
    const el=document.getElementById('rating');
    if(!el)return;
    const m=el.textContent.match(/\((\d+)\s*تقييم\)/);
    if(!m)return;
    const realCount=Number(m[1])||0;
    const displayCount=BASE_DISPLAY+Math.max(0,realCount-BASE_REVIEWS);
    el.textContent=el.textContent.replace(/\(\d+\s*تقييم\)/,'('+formatCount(displayCount)+' تقييم)');
  };
  apply();
  new MutationObserver(apply).observe(document.body,{subtree:true,childList:true,characterData:true});
})();
