(()=>{
  const U='https://qxwvuxkbcghbkztjrzon.supabase.co',K='sb_publishable_JI9lC4YPTCQ8CwMxzvHNIA_C24ULpWH';
  let availability=[];
  const api=async p=>{const r=await fetch(U+'/rest/v1/'+p,{headers:{apikey:K,Authorization:'Bearer '+K}});if(!r.ok)throw Error(await r.text());return r.json()};
  function cardId(el){const h=el.querySelector('[onclick]')?.getAttribute('onclick')||'';const m=h.match(/openModal\\(['"]([^'"]+)['"]\\)/);return m?m[1]:''}
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

  // Override the legacy create-order call with the current UUID-based database RPC.
  window.order=async function(){
    const t=totals();
    if(!cart.length)return showErr('السلة فارغة');
    if(!selectedAddress?.id)return showErr('اختار أو أضف عنوان التوصيل');
    const branchId=document.getElementById('branch')?.value;
    if(!branchId)return showErr('اختار الفرع');
    const btn=document.getElementById('confirm');
    btn.disabled=true;btn.textContent='جاري تأكيد الطلب...';
    try{
      const r=await fetch(U+'/rest/v1/rpc/create_customer_order',{method:'POST',headers:{'Content-Type':'application/json',apikey:K,Authorization:'Bearer '+K},body:JSON.stringify({
        _customer_id:cid,_branch_id:branchId,_address_id:selectedAddress.id,_payment_method:payMethod,_tip_amount:t.tip,_notes:document.getElementById('notes').value.trim(),
        _items:cart.map(x=>({product_id:x.product_id,quantity:x.quantity,notes:x.note||''}))
      })});
      let j={};try{j=await r.json()}catch{}
      if(!r.ok||j.error)throw Error(j.message||j.error||'حدث خطأ غير متوقع');
      localStorage.removeItem('alban_cart_v1');cart=[];useBonus=false;
      document.getElementById('cart').classList.remove('show');document.getElementById('bar').classList.remove('show');
      document.getElementById('success').style.display='block';
      document.getElementById('successText').innerHTML='رقم الطلب: <strong>#'+j.order.order_number+'</strong><br>خصم البونص: <strong>0.00 ج.م</strong><br>الإجمالي النهائي: <strong>'+Number(j.order.total).toFixed(2)+' ج.م</strong><br>🎁 رصيد البونص المتبقي: <strong>0 نقطة</strong>';
      window.scrollTo({top:document.body.scrollHeight,behavior:'smooth'});
    }catch(e){console.error('create customer order',e);showErr(e.message||'حدث خطأ غير متوقع')}finally{btn.disabled=false;btn.textContent='تأكيد الطلب ❤️'}
  };
})();