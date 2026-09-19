(()=>{ 
  const root=document.body;
  if(!root||!document.getElementById('cats')||document.getElementById('afpProfessionalUI'))return;
  const mark=document.createElement('div');mark.id='afpProfessionalUI';document.body.prepend(mark);

  const top=document.createElement('div');
  top.className='afp-topbar';
  top.innerHTML='<div class="afp-top-actions"><button class="afp-circle" type="button" onclick="toggleCart()" aria-label="السلة">🛒</button><a class="afp-circle" href="account.html" aria-label="حسابك">👤</a></div><div class="afp-brand-mini"><img src="https://qxwvuxkbcghbkztjrzon.supabase.co/storage/v1/object/public/product-images/customer-branding/app-icon.png" alt="ألبان فلاحي" class="afp-logo-img"><span>ألبان فلاحي</span></div><div class="afp-top-actions"><a class="afp-circle afp-back" href="orders.html" aria-label="طلباتك">→</a></div>';
  document.body.insertBefore(top,document.querySelector('main.wrap'));

  const hero=document.createElement('div');
  hero.className='afp-hero';
  hero.innerHTML='<div class="afp-hero-copy"><b>ألبان فلاحي</b><span>طبيعي 100% • فريش يوم بيوم</span></div>';
  document.body.insertBefore(hero,document.querySelector('main.wrap'));

  const promos=document.createElement('div');
  promos.className='afp-promos';
  promos.innerHTML='<div class="afp-promo"><div><b>🎁 توصيل مجاني</b><small>عند طلب 500 ج.م أو أكثر</small></div><span class="afp-promo-icon">🚚</span></div><div class="afp-promo"><div><b>🥛 منتجات فلاحي طبيعية</b><small>اختيارات يومية طازجة</small></div><span class="afp-promo-icon">❤️</span></div>';
  const main=document.querySelector('main.wrap');
  const catsSection=document.getElementById('cats')?.closest('section');
  if(main&&catsSection) main.insertBefore(promos,catsSection);

  const search=document.createElement('div');
  search.className='afp-search-wrap';
  search.innerHTML='<span class="afp-search-icon">⌕</span><input id="afpSearch" type="search" autocomplete="off" placeholder="ابحث عن منتج..." aria-label="البحث عن منتج"><button id="afpClearSearch" type="button" aria-label="مسح البحث">×</button>';
  if(main&&catsSection) main.insertBefore(search,catsSection);

  const groupSection=document.createElement('section');
  groupSection.className='afp-main-groups-section';
  groupSection.innerHTML='<div class="afp-section-head"><div><div class="title">تصفح حسب الأقسام</div><div class="afp-section-sub">اختار القسم اللي تحب تتصفح منتجاته</div></div></div><div id="afpMainGroups" class="afp-main-groups"><div class="afp-groups-loading">جاري تحميل الأقسام...</div></div>';
  if(main&&catsSection) main.insertBefore(groupSection,catsSection);

  let activeCat=null, allCategories=[], groups=[];
  const applyFilter=()=>{
    const term=(document.getElementById('afpSearch')?.value||'').trim().toLowerCase();
    document.querySelectorAll('#products .product').forEach(card=>{
      const cat=String(card.dataset.cat||'');
      const text=card.textContent.toLowerCase();
      const catOK=!activeCat||cat===String(activeCat);
      const textOK=!term||text.includes(term);
      card.style.display=(catOK&&textOK)?'block':'none';
    });
  };
  const originalFilter=window.filterCat;
  window.filterCat=function(id,el){activeCat=id;if(originalFilter)originalFilter(id,el);applyFilter();};

  search.querySelector('#afpSearch').addEventListener('input',applyFilter);
  search.querySelector('#afpClearSearch').addEventListener('click',()=>{const i=document.getElementById('afpSearch');i.value='';i.focus();applyFilter()});

  const setHero=()=>{
    const img=document.querySelector('#products .pic img');
    if(img?.src)hero.style.backgroundImage='url("'+img.src.replace(/"/g,'')+'")';
  };
  setHero();

  async function loadMainGroups(){
    try{
      const r=await fetch('https://qxwvuxkbcghbkztjrzon.supabase.co/rest/v1/category_groups?select=id,name_ar,name_en,image_url,sort_order,is_active&is_active=eq.true&order=sort_order.asc,id.asc',{
        cache:'no-store',
        headers:{apikey:'sb_publishable_JI9lC4YPTCQ8CwMxzvHNIA_C24ULpWH',Authorization:'Bearer sb_publishable_JI9lC4YPTCQ8CwMxzvHNIA_C24ULpWH'}
      });
      if(!r.ok)throw Error('groups');
      groups=await r.json();
      allCategories=Array.isArray(window.categories)?window.categories:[];
      renderMainGroups();
    }catch(e){
      document.getElementById('afpMainGroups').innerHTML='<div class="afp-groups-empty">تصفح الفئات متاح بالأسفل 👇</div>';
    }
  }
  function renderMainGroups(){
    const box=document.getElementById('afpMainGroups');
    if(!box)return;
    if(!groups.length){box.innerHTML='<div class="afp-groups-empty">تصفح الفئات بالأسفل 👇</div>';return;}
    box.innerHTML=groups.map(g=>{
      const count=allCategories.filter(c=>String(c.category_group_id||'')===String(g.id)).length;
      const img=g.image_url?'<img src="'+String(g.image_url).replace(/"/g,'&quot;')+'" alt="" loading="lazy" onerror="this.style.display=\'none\'">':'<span class="afp-group-placeholder">🥛</span>';
      return '<button type="button" class="afp-main-group" data-group="'+g.id+'" onclick="window.afpSelectMainGroup(\''+g.id+'\')"><div class="afp-group-img">'+img+'</div><b>'+esc(g.name_ar||g.name_en||'قسم')+'</b>'+(count?'<small>'+arabicNum(count)+' فئة</small>':'')+'</button>';
    }).join('');
  }
  function arabicNum(n){return String(n).replace(/\d/g,d=>'٠١٢٣٤٥٦٧٨٩'[d])}
  window.afpSelectMainGroup=function(id){
    const cats=allCategories.filter(c=>String(c.category_group_id||'')===String(id));
    document.querySelectorAll('.afp-main-group').forEach(x=>x.classList.toggle('active',String(x.dataset.group)===String(id)));
    const buttons=document.querySelectorAll('#cats .cat');
    buttons.forEach(b=>b.style.display='none');
    const allBtn=document.querySelector('#cats .cat.active');
    cats.forEach(c=>{
      const btn=[...buttons].find(b=>String(b.getAttribute('onclick')||'').includes(String(c.id)));
      if(btn)btn.style.display='';
    });
    if(cats.length){
      const first=cats[0];
      const btn=[...buttons].find(b=>String(b.getAttribute('onclick')||'').includes(String(first.id)));
      activeCat=null;
      buttons.forEach(b=>b.classList.remove('active'));
      if(btn){btn.style.display='';btn.classList.add('active');window.filterCat(first.id,btn)}
      document.getElementById('cats').scrollIntoView({behavior:'smooth',block:'center'});
    }else{
      activeCat=null;
      buttons.forEach(b=>b.style.display='');
      const all=document.querySelector('#cats .cat');
      if(all){buttons.forEach(b=>b.classList.remove('active'));all.classList.add('active');window.filterCat(null,all)}
    }
  };
  window.afpShowAllCategories=function(){
    activeCat=null;
    document.querySelectorAll('#cats .cat').forEach(b=>b.style.display='');
    const all=document.querySelector('#cats .cat');
    if(all)window.filterCat(null,all);
    document.querySelectorAll('.afp-main-group').forEach(x=>x.classList.remove('active'));
  };

  window.addEventListener('alban:productsRendered',()=>{setHero();applyFilter();});
  setTimeout(loadMainGroups,0);

  const style=document.createElement('style');
  style.textContent=`
    .afp-search-wrap{margin:12px 14px 4px;height:52px;background:#fff;border:1px solid #e2e2e2;border-radius:17px;display:flex;align-items:center;gap:8px;padding:0 13px;box-shadow:0 4px 15px rgba(0,0,0,.055);direction:rtl}
    .afp-search-icon{font-size:26px;color:#777;line-height:1}
    #afpSearch{flex:1;border:0;outline:0;background:transparent;font-size:15px;color:#222;font-family:inherit;min-width:0}
    #afpSearch::placeholder{color:#999}
    #afpClearSearch{border:0;background:#eee;color:#666;width:28px;height:28px;border-radius:50%;font-size:19px;line-height:1;display:grid;place-items:center;cursor:pointer}
    .afp-section-head{display:flex;align-items:end;justify-content:space-between;gap:10px;margin:4px 0}
    .afp-section-sub{font-size:12px;color:#888;margin-top:-7px;margin-bottom:8px}
    .afp-main-groups{display:flex;gap:10px;overflow-x:auto;padding:2px 2px 12px;scroll-snap-type:x proximity;-webkit-overflow-scrolling:touch}
    .afp-main-group{flex:0 0 126px;border:1px solid #e5e5e5;background:#fff;border-radius:18px;padding:8px;cursor:pointer;text-align:right;scroll-snap-align:start;box-shadow:0 4px 14px rgba(0,0,0,.045);font-family:inherit;transition:.15s}
    .afp-main-group.active{border-color:#0877b9;box-shadow:0 0 0 2px rgba(8,119,185,.12)}
    .afp-group-img{height:88px;border-radius:13px;background:#f3f7f8;display:grid;place-items:center;overflow:hidden;margin-bottom:7px}
    .afp-group-img img{width:100%;height:100%;object-fit:cover}
    .afp-group-placeholder{font-size:34px}
    .afp-main-group b{display:block;font-size:13px;line-height:1.35;color:#222}
    .afp-main-group small{display:block;color:#888;font-size:10px;margin-top:4px}
    .afp-groups-loading,.afp-groups-empty{padding:18px;text-align:center;color:#888;background:#fff;border-radius:16px;border:1px solid #eee}
    body:has(#cats) .cats{scroll-snap-type:x proximity;padding-top:3px!important;padding-bottom:10px!important}
    body:has(#cats) .cat{scroll-snap-align:start;transition:transform .15s ease,box-shadow .15s ease,background .15s ease!important}
    body:has(#cats) .cat:active{transform:scale(.96)!important}
    body:has(#cats) #products .product{transition:transform .15s ease,box-shadow .15s ease!important}
    body:has(#cats) #products .product:active{transform:scale(.985)!important}
    body:has(#cats) #products .product .pic img{transition:transform .25s ease!important}
    body:has(#cats) #products .product:active .pic img{transform:scale(1.025)!important}
    body:has(#cats) .free{font-weight:950!important;letter-spacing:.1px}
    body:has(#cats) .title{letter-spacing:-.2px!important}
    body:has(#cats) .bar{backdrop-filter:blur(10px)!important}
    body:has(#cats) .nav{padding-bottom:env(safe-area-inset-bottom)!important}
    @media(max-width:480px){
      .afp-search-wrap{margin:10px 11px 3px;height:49px}
      .afp-main-group{flex-basis:118px}
      .afp-group-img{height:82px}
      body:has(#cats) .cats{padding-left:11px!important;padding-right:11px!important}
      body:has(#cats) #products{grid-template-columns:repeat(2,minmax(0,1fr))!important}
      body:has(#cats) #products .product{min-width:0!important}
      body:has(#cats) #products .product .pic{aspect-ratio:1/1!important;height:auto!important;min-height:0!important}
      body:has(#cats) .info span{font-size:10px!important}
      body:has(#cats) .afp-promo{flex-basis:86%!important}
    }
  `;
  document.head.appendChild(style);
})();