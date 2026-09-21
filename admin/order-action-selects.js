(function(){
  try{
    if(!document.querySelector('link[rel="manifest"]')){const l=document.createElement('link');l.rel='manifest';l.href='/admin/manifest.webmanifest?v=20260920';document.head.appendChild(l)}
    if(!document.querySelector('meta[name="theme-color"]')){const m=document.createElement('meta');m.name='theme-color';m.content='#0877b9';document.head.appendChild(m)}
    if('serviceWorker' in navigator)navigator.serviceWorker.register('/shop-push-sw.js',{scope:'/admin/'}).catch(()=>{});
  }catch(e){}
})();
(function(){
  if(window.__afOrderSelectsLoaded)return; window.__afOrderSelectsLoaded=true;
  const style=document.createElement('style');
  style.textContent='.af-select-modal{position:fixed;inset:0;background:#0008;display:flex;align-items:center;justify-content:center;z-index:100;padding:20px}.af-select-box{background:#fff;border-radius:22px;max-width:430px;width:100%;padding:22px;box-shadow:0 20px 70px #0005}.af-select-box h3{margin:0 0 14px}.af-select-box select{width:100%;padding:14px;border:1px solid #ddd;border-radius:12px;font-size:17px;background:#fff}.af-select-actions{display:flex;gap:8px;justify-content:flex-end;margin-top:16px}.af-select-actions button{border:0;border-radius:12px;padding:11px 16px;font-weight:800;cursor:pointer}.af-select-cancel{background:#fff;border:1px solid #ddd!important}.af-select-ok{background:#198754;color:#fff}.af-select-empty{padding:12px;background:#fff7df;border-radius:12px;color:#8a5b00;font-weight:700}.af-confirm-text{font-size:16px;line-height:1.8;margin:4px 0 12px}.af-confirm-name{font-weight:900}';
  document.head.appendChild(style);
  function close(m){m.remove()}
  function confirmChoice(title,text){
    return new Promise(resolve=>{
      const modal=document.createElement('div'); modal.className='af-select-modal';
      modal.innerHTML='<div class="af-select-box"><h3>'+title+'</h3><div class="af-confirm-text">'+text+'</div><div class="af-select-actions"><button class="af-select-cancel">إلغاء</button><button class="af-select-ok">موافق</button></div></div>';
      document.body.appendChild(modal);
      modal.querySelector('.af-select-cancel').onclick=()=>{close(modal);resolve(false)};
      modal.querySelector('.af-select-ok').onclick=()=>{close(modal);resolve(true)};
    });
  }
  async function api(payload){
    const token=window.__afShopAccessToken||((typeof session!=='undefined'&&session?.access_token)||'');
    const url=window.__afShopApiUrl||((typeof API!=='undefined'&&API)||'https://qxwvuxkbcghbkztjrzon.supabase.co/functions/v1/shop-api');
    if(!token)throw Error('جلسة الموظف غير موجودة');
    const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify(payload)});
    const d=await r.json().catch(()=>({}));
    if(!r.ok)throw Error(d.error||d.message||'تعذر تنفيذ العملية');
    return d;
  }
  async function choose(type,el){
    const onclick=el.getAttribute('onclick'); if(!onclick)return;
    let list=[];
    try{list=type==='driver'?await api({action:'drivers'}):await api({action:'branches'})}catch(e){alert(e.message||'تعذر تحميل القائمة');return}
    if(!Array.isArray(list))list=list?.drivers||list?.branches||list?.data||[];
    if(type==='driver')list=list.filter(x=>(x.branch_id==null||x.branch_id===me?.branch_id)&&x.is_active!==false);
    else list=list.filter(x=>x.id&&x.id!==me?.branch_id&&(x.is_active!==false));
    const modal=document.createElement('div'); modal.className='af-select-modal';
    const title=type==='driver'?'🚗 اختيار السائق':'🏪 اختيار الفرع';
    const label=type==='driver'?'السائق':'الفرع';
    const options=list.map(x=>{const name=x.name_ar||x.name||x.full_name||x.driver_name||x.branch_name||x.title||('رقم '+x.id);return '<option value="'+String(x.id).replace(/"/g,'&quot;')+'" data-name="'+String(name).replace(/"/g,'&quot;')+'">'+String(name).replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</option>'}).join('');
    modal.innerHTML='<div class="af-select-box"><h3>'+title+'</h3>'+(options?'<label style="display:block;font-weight:800;margin-bottom:7px">'+label+'</label><select id="afSelectValue"><option value="">اختر '+label+'</option>'+options+'</select>':'<div class="af-select-empty">لا توجد خيارات متاحة حاليًا.</div>')+'<div class="af-select-actions"><button class="af-select-cancel">إلغاء</button><button class="af-select-ok" '+(options?'':'disabled')+'>اختيار</button></div></div>';
    document.body.appendChild(modal);
    modal.querySelector('.af-select-cancel').onclick=()=>close(modal);
    modal.querySelector('.af-select-ok').onclick=async()=>{
      const select=modal.querySelector('#afSelectValue'); const value=select?.value; if(!value)return;
      const name=select.options[select.selectedIndex]?.dataset?.name||select.options[select.selectedIndex]?.textContent||'';
      close(modal);
      const m=onclick.match(/(assignDriver|transferOrder)\s*\(\s*['\"]([^'\"]+)['\"]\s*\)/);
      if(!m){alert('تعذر تحديد الطلب');return}
      if(type==='driver'){
        const confirmed=await confirmChoice('🚗 تأكيد تعيين السائق','هل تريد تعيين السائق <span class="af-confirm-name">'+String(name).replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</span> لهذا الطلب؟');
        if(!confirmed)return;
        try{await api({action:'assign',order_id:m[2],driver_id:value});if(typeof loadOrders==='function')await loadOrders()}catch(e){alert(e.message||'تعذر تعيين السائق')}
        return;
      }
      const confirmed=await confirmChoice('🏪 تأكيد تحويل الطلب','هل تريد تحويل الطلب إلى فرع <span class="af-confirm-name">'+String(name).replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</span>؟');
      if(!confirmed)return;
      try{await api({action:'transfer',order_id:m[2],to_branch_id:value});if(typeof loadOrders==='function')await loadOrders()}catch(e){alert(e.message||'تعذر تحويل الطلب')}
      return;
    };
  }
  window.transferOrder=function(id){const btn=[...document.querySelectorAll('button[onclick]')].find(b=>(b.getAttribute('onclick')||'').includes("transferOrder('"+id+"')"));if(btn)choose('branch',btn)};
  window.assignDriver=function(id){const btn=[...document.querySelectorAll('button[onclick]')].find(b=>(b.getAttribute('onclick')||'').includes("assignDriver('"+id+"')"));if(btn)choose('driver',btn)};
  document.addEventListener('click',function(e){
    const el=e.target.closest('button'); if(!el)return;
    const text=(el.textContent||'').replace(/\s+/g,' ').trim();
    if(text.includes('تعيين سائق')&&!text.includes('إلغاء')){e.preventDefault();e.stopImmediatePropagation();choose('driver',el);return false}
    if(text.includes('تحويل')&&!text.includes('إلغاء')){e.preventDefault();e.stopImmediatePropagation();choose('branch',el);return false}
  },true);
})();
(function(){
  if(window.__afOrderEditLoaded)return; window.__afOrderEditLoaded=true;
  const style=document.createElement('style');
  style.textContent='.af-edit-modal{position:fixed;inset:0;background:#0008;display:flex;align-items:center;justify-content:center;z-index:110;padding:16px}.af-edit-box{background:#fff;border-radius:22px;max-width:620px;width:100%;max-height:90vh;overflow:auto;padding:20px;box-shadow:0 20px 70px #0005}.af-edit-row{display:grid;grid-template-columns:1fr 110px;gap:10px;align-items:center;padding:12px 0;border-bottom:1px solid #eee}.af-edit-name{font-weight:900}.af-edit-meta{font-size:12px;color:#777;margin-top:4px}.af-edit-row input{width:100%;padding:11px;border:1px solid #ddd;border-radius:11px;font-size:17px;text-align:center}.af-edit-actions{display:flex;gap:8px;justify-content:flex-end;margin-top:16px}.af-edit-actions button{border:0;border-radius:12px;padding:11px 16px;font-weight:800;cursor:pointer}.af-edit-cancel{background:#fff;border:1px solid #ddd!important}.af-edit-ok{background:#198754;color:#fff}.af-edit-reason{width:100%;padding:12px;border:1px solid #ddd;border-radius:11px;font-size:15px;margin-top:8px}';
  document.head.appendChild(style);
  function api(payload){
    const token=window.__afShopAccessToken||((typeof session!=='undefined'&&session?.access_token)||'');
    const url=window.__afShopApiUrl||((typeof API!=='undefined'&&API)||'https://qxwvuxkbcghbkztjrzon.supabase.co/functions/v1/shop-api');
    if(!token)return Promise.reject(Error('جلسة الموظف غير موجودة'));
    return fetch(url,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify(payload)}).then(async r=>{const d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.error||d.message||'تعذر تنفيذ العملية');return d});
  }
  const digits=v=>String(v??'').replace(/[٠-٩]/g,d=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))).replace(/٫/g,'.');
  function close(m){m.remove()}
  window.editOrderItems=async function(id){
    const o=(typeof orders!=='undefined'?(orders||[]).find(x=>String(x.id)===String(id)):null);
    if(!o)return alert('الطلب غير موجود');
    if(['delivered','cancelled','rejected'].includes(o.status))return alert('لا يمكن تعديل طلب مكتمل أو ملغي');
    if(o.payment_status==='paid')return alert('لا يمكن تعديل طلب مدفوع إلكترونيًا قبل تنفيذ الاسترداد المالي');
    const items=(o.order_items||[]).filter(i=>Number(i.quantity||0)>0);
    if(!items.length)return alert('لا توجد أصناف قابلة للتعديل');
    const modal=document.createElement('div');modal.className='af-edit-modal';
    modal.innerHTML='<div class="af-edit-box"><h2 style="margin-top:0">✏️ تعديل أصناف الطلب #'+String(o.order_number||'').replace(/[<>]/g,'')+'</h2><div style="background:#fff7df;color:#8a5b00;padding:10px;border-radius:11px;font-size:13px">اكتب الكمية التي سيتم تسليمها. لا يمكن زيادة الكمية عن المطلوبة.</div><div style="margin-top:10px">'+items.map(i=>'<div class="af-edit-row" data-item-id="'+i.id+'"><div><div class="af-edit-name">'+String(i.product_name_ar||i.product_name_en||'صنف').replace(/[<>]/g,'')+'</div><div class="af-edit-meta">المطلوب: '+i.quantity+' — سعر الوحدة: '+Number(i.unit_price||0).toFixed(2)+' ج</div></div><input class="af-edit-qty" type="number" min="0" max="'+Number(i.quantity||0)+'" step="1" value="'+Number(i.quantity||0)+'"></div>').join('')+'</div><label style="display:block;font-weight:900;margin-top:14px">سبب التعديل</label><select class="af-edit-reason"><option>المنتج غير متوفر</option><option>الكمية المتاحة أقل</option><option>المنتج غير مطابق للجودة المطلوبة</option><option>سبب آخر</option></select><div class="af-edit-actions"><button class="af-edit-cancel">إلغاء</button><button class="af-edit-ok">تأكيد التعديل</button></div></div>';
    document.body.appendChild(modal);
    modal.querySelector('.af-edit-cancel').onclick=()=>close(modal);
    modal.querySelector('.af-edit-ok').onclick=async()=>{
      const changes=[];
      modal.querySelectorAll('.af-edit-row').forEach(row=>{const item=items.find(x=>String(x.id)===String(row.dataset.itemId));const input=row.querySelector('.af-edit-qty');const q=Math.max(0,Math.min(Number(item.quantity||0),Number(digits(input.value))));if(q!==Number(item.quantity||0))changes.push({item_id:item.id,new_quantity:q})});
      if(!changes.length)return alert('لم يتم تغيير أي كمية');
      const reason=modal.querySelector('.af-edit-reason').value;
      const removedText=changes.map(ch=>{const it=items.find(x=>String(x.id)===String(ch.item_id));return (it.product_name_ar||it.product_name_en||'صنف')+': '+it.quantity+' → '+ch.new_quantity}).join('\n');
      if(!confirm('تأكيد تعديل الأصناف؟\n\n'+removedText))return;
      const btn=modal.querySelector('.af-edit-ok');btn.disabled=true;btn.textContent='جاري الحفظ...';
      try{const d=await api({action:'adjust_items',order_id:o.id,changes,reason});close(modal);await loadOrders();alert('تم تعديل الطلب بنجاح ✅\nالإجمالي الجديد: '+Number(d.adjustment?.new_total||0).toFixed(2)+' ج');}catch(e){btn.disabled=false;btn.textContent='تأكيد التعديل';alert(e.message||'تعذر تعديل الطلب')}
    };
  };
})();
(()=>{if(window.__AF_ORDER_ADD_ITEMS_LOADER)return;window.__AF_ORDER_ADD_ITEMS_LOADER=true;const s=document.createElement('script');s.src='/admin/order-add-items.js?v=20260921-1';s.defer=true;document.head.appendChild(s)})();
