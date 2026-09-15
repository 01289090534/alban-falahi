// تنسيق عدد التقييمات: بعد 1000 يظهر بصيغة K
(()=>{
  const formatCount=n=>{
    const x=Number(n)||0;
    if(x<1000)return String(Math.floor(x));
    const k=x/1000;
    return (k>=10?Math.round(k):Math.round(k*10)/10)+'K';
  };
  const apply=()=>{
    const el=document.getElementById('rating');
    if(!el)return;
    const m=el.textContent.match(/\((\d+)\s*تقييم\)/);
    if(!m)return;
    el.textContent=el.textContent.replace('('+m[1]+' تقييم)','('+formatCount(m[1])+' تقييم)');
  };
  apply();
  new MutationObserver(apply).observe(document.body,{subtree:true,childList:true,characterData:true});
})();
