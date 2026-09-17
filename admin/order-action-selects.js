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
      try{
        await api({action:'transfer',order_id:m[2],to_branch_id:value});
        if(typeof loadOrders==='function')await loadOrders();
      }catch(e){alert(e.message||'تعذر تحويل الطلب')}
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