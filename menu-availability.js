(()=>{
  const U='https://qxwvuxkbcghbkztjrzon.supabase.co',K='sb_publishable_JI9lC4YPTCQ8CwMxzvHNIA_C24ULpWH';
  let availability=[];
  const api=async p=>{const r=await fetch(U+'/rest/v1/'+p,{headers:{apikey:K,Authorization:'Bearer '+K}});if(!r.ok)throw Error(await r.text());return r.json()};
  function cardId(el){const h=el.querySelector('[onclick]')?.getAttribute('onclick')||'';const m=h.match(/openModal\(['"]([^'"]+)['"]\)/);return m?m[1]:''}
  async function sync(){
    const branch=document.getElementById('branch')?.value;if(!branch)return;
    try{
      availability=await api('branch_products?select=product_id,price_override,is_available&branch_id=eq.'+encodeURIComponent(branch)+'&is_available=eq.true');
      const allowed=new Map(availability.map(x=>[String(x.product_id),x]));
      document.querySelectorAll('.product').forEach(el=>{
        const id=cardId(el), row=allowed.get(String(id)), ok=!!row;
        el.style.display=ok?'block':'none';
        if(ok){const price=el.querySelector('.price');if(price){const current=Number((price.textContent||'').replace(/[^0-9.]/g,''));price.dataset.basePrice=price.dataset.basePrice||String(Number.isFinite(current)?current:0);const effective=row.price_override!=null?Number(row.price_override):Number(price.dataset.basePrice);price.textContent=effective.toFixed(2)+' ج.م'}}
      });
      window.dispatchEvent(new CustomEvent('alban:branchAvailability',{detail:{branch,availability}}));
    }catch(e){console.error('branch availability',e)}
  }
  window.addEventListener('load',()=>{setTimeout(sync,700);const b=document.getElementById('branch');if(b)b.addEventListener('change',()=>setTimeout(sync,100));});
})();