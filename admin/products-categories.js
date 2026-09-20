(function(){
  if(window.__AF_ADMIN_PWA_V3)return;
  window.__AF_ADMIN_PWA_V3=true;
  try{
    if(!document.querySelector('link[rel="manifest"]')){
      const l=document.createElement('link');l.rel='manifest';l.href='/admin/manifest.webmanifest?v=20260920-3';document.head.appendChild(l);
    }
    if(!document.querySelector('meta[name="theme-color"]')){const m=document.createElement('meta');m.name='theme-color';m.content='#0877b9';document.head.appendChild(m)}
    if('serviceWorker' in navigator){navigator.serviceWorker.register('/shop-push-sw.js',{scope:'/admin/'}).then(()=>console.log('Alban Falahi admin PWA service worker ready')).catch(e=>console.warn('admin PWA service worker',e));}
    let deferredInstall=null;
    let installBox=null;
    const isStandalone=()=>window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;
    const removeInstallBox=()=>{if(installBox){installBox.remove();installBox=null}};
    const installNow=async()=>{
      if(deferredInstall){try{deferredInstall.prompt();await deferredInstall.userChoice}catch(e){console.warn('PWA install prompt',e)}deferredInstall=null;return;}
      alert('لتثبيت برنامج المحل على Android: افتح قائمة Chrome ⋮ ثم اختر «إضافة إلى الشاشة الرئيسية» أو «تثبيت التطبيق».');
    };
    const showInstallBox=(ready=false)=>{
      if(isStandalone())return;
      removeInstallBox();
      installBox=document.createElement('div');installBox.id='afInstallAppBox';installBox.dir='rtl';installBox.style.cssText='position:fixed;inset:0;background:#0008;display:flex;align-items:center;justify-content:center;padding:20px;z-index:100000;font-family:Arial,Tahoma,sans-serif';
      installBox.innerHTML='<div style="background:#fff;border-radius:24px;max-width:420px;width:100%;padding:26px;box-shadow:0 20px 70px #0006;text-align:center"><div style="font-size:52px">📲</div><h2 style="margin:8px 0">تثبيت برنامج المحل</h2><p style="color:#666;line-height:1.8;margin:8px 0 18px">ثبّت «ألبان فلاحي — برنامج المحل» على موبايل Android ليظهر كتطبيق مستقل وسهل الفتح.</p><button id="afInstallNow" style="width:100%;border:0;border-radius:13px;padding:15px;background:#198754;color:#fff;font-size:17px;font-weight:900;cursor:pointer">📲 تثبيت التطبيق</button><button id="afInstallLater" style="width:100%;border:1px solid #ddd;border-radius:13px;padding:13px;background:#fff;color:#333;font-size:15px;font-weight:800;cursor:pointer;margin-top:9px">فتح البرنامج بدون تثبيت</button><div id="afInstallHint" style="font-size:12px;color:#888;margin-top:12px">'+(ready?'سيظهر طلب التثبيت من Chrome الآن.':'إذا لم يظهر طلب التثبيت، سيظهر لك شرح إضافة البرنامج للشاشة الرئيسية.')+'</div></div>';
      document.body.appendChild(installBox);document.getElementById('afInstallNow').onclick=installNow;document.getElementById('afInstallLater').onclick=removeInstallBox;
    };
    window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstall=e;if(installBox){const h=document.getElementById('afInstallHint');if(h)h.textContent='التطبيق جاهز للتثبيت من Chrome.'}else showInstallBox(true)});
    window.addEventListener('appinstalled',()=>{deferredInstall=null;removeInstallBox()});
    window.setTimeout(()=>showInstallBox(!!deferredInstall),700);
  }catch(e){console.warn('admin PWA setup',e)}

  if(window.__AF_PRODUCTS_CATEGORIES_V1)return;
  window.__AF_PRODUCTS_CATEGORIES_V1=true;
  const state={products:[],categories:[],open:new Set(),query:''};
  const style=document.createElement('style');
  style.textContent='.afCatToolbar{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:14px}.afCatSearch{flex:1;min-width:220px;padding:13px 15px;border:1px solid #ddd;border-radius:13px;font-size:16px;background:#fff}.afCat{background:#fff;border-radius:18px;margin-bottom:10px;overflow:hidden;box-shadow:0 3px 14px #0000000b;border:1px solid #eee}.afCatHead{width:100%;border:0;background:#fff;padding:15px 16px;display:flex;align-items:center;gap:10px;text-align:right;cursor:pointer;font:inherit}.afCatArrow{font-size:18px;width:24px}.afCatName{font-weight:900;flex:1}.afCatCount{font-size:12px;color:#777;background:#f3f3f3;border-radius:999px;padding:5px 9px}.afCatAvail{font-size:12px;color:#176b3b;background:#e8f8ee;border-radius:999px;padding:5px 9px}.afCatBody{padding:0 16px 12px;border-top:1px solid #eee}.afCatProduct{display:flex;align-items:center;gap:10px;padding:11px 0;border-bottom:1px solid #eee}.afCatProduct:last-child{border-bottom:0}.afCatProductInfo{flex:1;min-width:0}.afCatProductName{font-weight:800}.afCatPrice{color:#555;font-size:13px;margin-top:3px}.afCatToggle{min-width:105px}.afCatEmpty{padding:18px;color:#777;text-align:center}.afCatMuted{color:#777;font-size:13px}.afCatNoProducts{padding:14px;color:#999;text-align:center;background:#fafafa;border-radius:12px;margin:8px 0}.afCatLoadError{padding:14px;color:#a00000;background:#fff0f0;border-radius:12px;margin-top:10px}';
  document.head.appendChild(style);
  window.afShopCategoryState=state;

  window.renderProducts=function(){
    const c=document.getElementById('content');if(!c)return;
    const cats=state.categories.slice().sort((a,b)=>(a.sort_order??9999)-(b.sort_order??9999));
    const q=state.query.trim().toLowerCase();
    const filtered=state.products.filter(p=>!q||String(p.name_ar||'').toLowerCase().includes(q)||String(p.name_en||'').toLowerCase().includes(q));
    const byCat=new Map();
    filtered.forEach(p=>{const key=p.category_id||'__none__';if(!byCat.has(key))byCat.set(key,[]);byCat.get(key).push(p)});

    // مهم: لا نخفي الفئات إذا كانت بلا منتجات مطابقة. اعرض كل الفئات دائمًا.
    const ordered=cats.slice();
    const uncategorized=byCat.get('__none__')||[];
    if(uncategorized.length)ordered.push({id:'__none__',name_ar:'غير مصنف',name_en:'Uncategorized',sort_order:999999});

    const cards=ordered.map(cat=>{
      const items=byCat.get(cat.id)||[];
      const available=items.filter(p=>p.available).length;
      const open=state.open.has(cat.id);
      const body=open
        ? '<div class="afCatBody">'+(items.length
          ? items.map(p=>'<div class="afCatProduct"><div class="afCatProductInfo"><div class="afCatProductName">'+escapeHtml(p.name_ar||p.name_en||'منتج')+'</div><div class="afCatPrice">'+money(p.price)+'</div></div><button class="btn afCatToggle '+(p.available?'green':'red')+'" onclick="window.afToggleProductFromCategories(\''+p.id+'\','+(p.available?'false':'true')+')">'+(p.available?'متاح':'غير متاح')+'</button></div>').join('')
          : '<div class="afCatNoProducts">لا توجد منتجات في هذه الفئة حاليًا</div>')+'</div>'
        : '';
      return '<div class="afCat"><button class="afCatHead" onclick="window.afToggleCategory(\''+cat.id+'\')"><span class="afCatArrow">'+(open?'⌄':'‹')+'</span><span class="afCatName">'+escapeHtml(cat.name_ar||cat.name_en||'قسم')+'</span><span class="afCatAvail">متاح '+available+'</span><span class="afCatCount">'+items.length+' منتج</span></button>'+body+'</div>';
    }).join('');

    c.innerHTML='<div class="card"><h3 style="margin-top:0">🟢🔴 توفر المنتجات حسب الأقسام</h3><p class="afCatMuted">اضغط على اسم القسم لفتح المنتجات أو إغلاقها. التوفر يتغير لنفس الفرع.</p><div class="afCatToolbar"><input class="afCatSearch" id="afCatSearch" placeholder="🔎 ابحث عن منتج..." value="'+escapeHtml(state.query)+'"><button class="btn white" onclick="window.afOpenAllCategories()">فتح الكل</button><button class="btn white" onclick="window.afCloseAllCategories()">إغلاق الكل</button></div></div><div>'+(cards||'<div class="card afCatEmpty">لا توجد فئات.</div>')+'</div>';
    const search=document.getElementById('afCatSearch');if(search)search.oninput=function(){state.query=this.value;renderProducts()};
  };

  window.afToggleCategory=function(id){state.open.has(id)?state.open.delete(id):state.open.add(id);renderProducts()};
  window.afOpenAllCategories=function(){state.categories.forEach(c=>state.open.add(c.id));if(state.products.some(p=>!p.category_id))state.open.add('__none__');renderProducts()};
  window.afCloseAllCategories=function(){state.open.clear();renderProducts()};
  window.afToggleProductFromCategories=async function(id,available){
    try{
      const r=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+session.access_token},body:JSON.stringify({action:'toggle_product',branch_id:me.branch_id,product_id:id,available})});
      const d=await r.json();if(!r.ok||!d.success)throw Error(d.error||'تعذر تحديث التوفر');
      const p=state.products.find(x=>x.id===id);if(p)p.available=available;renderProducts();
    }catch(e){alert(e.message)}
  };

  window.loadProducts=async function(){
    try{
      const r=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+session.access_token},body:JSON.stringify({action:'products',branch_id:me.branch_id})});
      const d=await r.json();if(!r.ok||!d.success)throw Error(d.error||'تعذر تحميل المنتجات');
      state.products=Array.isArray(d.products)?d.products:[];
      try{
        const cr=await sb.from('categories').select('id,name_ar,name_en,sort_order,is_active').eq('is_active',true).order('sort_order',{ascending:true});
        if(cr.error)throw cr.error;
        state.categories=Array.isArray(cr.data)?cr.data:[];
      }catch(catErr){
        const ids=[...new Set(state.products.map(p=>p.category_id).filter(Boolean))];
        state.categories=ids.map((id,i)=>({id,name_ar:'قسم '+(i+1),name_en:'Category '+(i+1),sort_order:i+1}));
      }
      // إذا تعذر جلب جدول الفئات وكان الـAPI يعيد اسم/بيانات الفئة مع المنتج، ابنِ فئات حقيقية من المنتجات بدل شاشة فارغة.
      if(!state.categories.length&&state.products.length){
        const map=new Map();state.products.forEach(p=>{const id=p.category_id;if(!id||map.has(id))return;map.set(id,{id,name_ar:p.category_name_ar||p.category_ar||'قسم',name_en:p.category_name_en||p.category_en||'Category',sort_order:map.size+1})});state.categories=[...map.values()];
      }
      renderProducts();
    }catch(e){const content=document.getElementById('content');if(content)content.innerHTML='<div class="card afCatLoadError">'+escapeHtml(e.message)+'</div>'}
  };
})();
