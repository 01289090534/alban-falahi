(()=>{
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money=n=>(Math.round((Number(n)||0)*100)/100).toFixed(2);
  const getProduct=id=>(window.products||[]).find(p=>String(p.id)===String(id));
  const getQty=id=>{const x=(window.cart||[]).find(x=>String(x.product_id)===String(id));return x?.quantity||0};
  const getPrice=id=>{
    const card=document.querySelector('.product[data-cat] [onclick*="'+String(id).replace(/"/g,'\\"')+'"]')?.closest('.product');
    const text=card?.querySelector('.price')?.textContent||'';
    const m=text.replace(/[^0-9.]/g,'');
    const n=Number(m);
    const p=getProduct(id);
    return Number.isFinite(n)&&n>0?n:Number(p?.base_price||0);
  };
  const close=()=>document.getElementById('albanProductModal')?.remove();
  const refreshQty=id=>{const el=document.getElementById('albanProductQty');if(el)el.textContent=String(getQty(id));};
  const adjust=(id,d)=>{
    if(typeof window.change==='function')window.change(id,d);
    refreshQty(id);
  };
  const open=id=>{
    const p=getProduct(id); if(!p)return;
    close();
    const modal=document.createElement('div');
    modal.id='albanProductModal';
    modal.dir='rtl';
    modal.innerHTML=`
      <div class="alban-product-overlay" data-close="1">
        <div class="alban-product-sheet" role="dialog" aria-modal="true" aria-label="تفاصيل المنتج">
          <button class="alban-product-close" type="button" aria-label="إغلاق">×</button>
          <div class="alban-product-image">${p.image_url?`<img src="${esc(p.image_url)}" alt="${esc(p.name_ar||p.name||'')}" onerror="this.parentElement.innerHTML='<span>🥛</span>'">`:'<span>🥛</span>'}</div>
          <div class="alban-product-info">
            <h2>${esc(p.name_ar||p.name||'')}</h2>
            <div class="alban-product-desc">${esc(p.description_ar||p.description||'')}</div>
            <div class="alban-product-price">${money(getPrice(id))} ج.م</div>
            <div class="alban-product-actions">
              <button type="button" class="alban-product-minus" aria-label="نقص">−</button>
              <strong id="albanProductQty">${getQty(id)}</strong>
              <button type="button" class="alban-product-plus" aria-label="إضافة">+</button>
            </div>
          </div>
        </div>
      </div>`;
    document.body.appendChild(modal);
    modal.querySelector('.alban-product-close').onclick=close;
    modal.querySelector('.alban-product-overlay').onclick=e=>{if(e.target.dataset.close)close()};
    modal.querySelector('.alban-product-minus').onclick=()=>adjust(id,-1);
    modal.querySelector('.alban-product-plus').onclick=()=>adjust(id,1);
    document.body.style.overflow='hidden';
    const restore=()=>{if(!document.getElementById('albanProductModal'))document.body.style.overflow=''};
    const observer=new MutationObserver(()=>{if(!document.getElementById('albanProductModal')){document.body.style.overflow='';observer.disconnect()}});
    observer.observe(document.body,{childList:true});
  };
  const style=document.createElement('style');
  style.id='alban-product-details-style';
  style.textContent=`
    #albanProductModal{position:fixed;inset:0;z-index:100000;font-family:Arial,sans-serif}
    #albanProductModal .alban-product-overlay{position:absolute;inset:0;background:rgba(0,0,0,.52);display:flex;align-items:flex-end;justify-content:center}
    #albanProductModal .alban-product-sheet{position:relative;width:min(720px,100%);max-height:94vh;overflow:auto;background:#fff;border-radius:28px 28px 0 0;padding:16px 16px 28px;box-shadow:0 -8px 35px rgba(0,0,0,.2);animation:albanProductUp .2s ease-out}
    #albanProductModal .alban-product-close{position:absolute;top:12px;right:12px;z-index:2;width:40px;height:40px;border:0;border-radius:50%;background:rgba(255,255,255,.92);font-size:30px;line-height:1;cursor:pointer;box-shadow:0 2px 10px rgba(0,0,0,.12)}
    #albanProductModal .alban-product-image{width:100%;height:min(54vh,430px);min-height:260px;border-radius:22px;background:#f1f1f1;display:grid;place-items:center;overflow:hidden}
    #albanProductModal .alban-product-image img{width:100%;height:100%;object-fit:contain;background:#fff}
    #albanProductModal .alban-product-image span{font-size:72px}
    #albanProductModal .alban-product-info{text-align:right;padding:6px 4px 0}
    #albanProductModal .alban-product-info h2{font-size:25px;font-weight:900;margin:14px 0 7px;color:#222}
    #albanProductModal .alban-product-desc{font-size:15px;line-height:1.7;color:#666;min-height:24px}
    #albanProductModal .alban-product-price{font-size:22px;font-weight:900;margin-top:14px;white-space:nowrap}
    #albanProductModal .alban-product-actions{display:flex;align-items:center;justify-content:center;gap:18px;margin:18px auto 0}
    #albanProductModal .alban-product-actions button{width:52px;height:52px;border:0;border-radius:15px;background:#222;color:#fff;font-size:30px;line-height:1;cursor:pointer}
    #albanProductModal .alban-product-actions strong{min-width:42px;text-align:center;font-size:22px}
    @keyframes albanProductUp{from{transform:translateY(30px);opacity:.7}to{transform:translateY(0);opacity:1}}
    @media(min-width:721px){#albanProductModal .alban-product-overlay{align-items:center;padding:20px}#albanProductModal .alban-product-sheet{border-radius:28px;max-height:90vh}}
  `;
  document.head.appendChild(style);
  window.openModal=open;
  window.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
})();