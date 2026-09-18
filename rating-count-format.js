// عرض عدد التقييمات: يبدأ من 1000 ويُضاف إليه كل التقييمات الحقيقية
(()=>{
  const BASE_DISPLAY=1000;
  const formatCount=n=>Math.max(0,Math.floor(Number(n)||0)).toLocaleString('en-US');
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