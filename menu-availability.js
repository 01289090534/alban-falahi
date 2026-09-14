(()=>{
  const U='https://qxwvuxkbcghbkztjrzon.supabase.co',K='sb_publishable_JI9lC4YPTCQ8CwMxzvHNIA_C24ULpWH';
  let availability=[];
  const api=async p=>{const r=await fetch(U+'/rest/v1/'+p,{headers:{apikey:K,Authorization:'Bearer '+K}});if(!r.ok)throw Error(await r.text());return r.json()};
  async function sync(){
    const branch=document.getElementById('branch')?.value;if(!branch)return;
    try{
      availability=await api('branch_products?select=product_id,price_override,is_available&branch_id=eq.'+encodeURIComponent(branch)+'&is_available=eq.true');
      const allowed=new Map(availability.map(x=>[String(x.product_id),x]));
      document.querySelectorAll('.product').forEach(el=>{const ok=allowed.has(String(el.dataset.productId));el.style.display=ok?'block':'none';if(ok){const p=allowed.get(String(el.dataset.productId));const price=el.querySelector('.price');if(price){const base=price.dataset.basePrice;price.textContent=(p.price_override!=null?Number(p.price_override):Number(base)).toFixed(2)+' ج.م'}}});
      document.querySelectorAll('.cat').forEach(el=>{if(el.dataset.catFilter==='all')return;});
      window.dispatchEvent(new CustomEvent('alban:branchAvailability',{detail:{branch,availability}}));
    }catch(e){console.error('branch availability',e)}
  }
  const originalFetch=window.fetch.bind(window);
  window.fetch=(input,init={})=>originalFetch(input,init);
  window.addEventListener('load',()=>{setTimeout(sync,500);const b=document.getElementById('branch');if(b)b.addEventListener('change',()=>setTimeout(sync,50));});
})();