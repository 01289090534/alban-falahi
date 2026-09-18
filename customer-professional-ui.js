(()=>{ 
  const root=document.body;
  if(!root||!document.getElementById('cats')||document.getElementById('afpProfessionalUI'))return;
  const mark=document.createElement('div');mark.id='afpProfessionalUI';document.body.prepend(mark);

  const top=document.createElement('div');
  top.className='afp-topbar';
  top.innerHTML='<div class="afp-top-actions"><button class="afp-circle" type="button" onclick="toggleCart()" aria-label="السلة">🛒</button><a class="afp-circle" href="account.html" aria-label="حسابك">👤</a></div><div class="afp-brand-mini"><img src="favicon.svg" alt="" class="afp-logo-img"><span>ألبان فلاحي</span></div><div class="afp-top-actions"><a class="afp-circle afp-back" href="orders.html" aria-label="طلباتك">→</a></div>';
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
  let activeCat=null;
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
  window.addEventListener('alban:productsRendered',()=>{setHero();applyFilter()});
  new MutationObserver(()=>{setHero();applyFilter()}).observe(document.getElementById('products')||document.body,{childList:true,subtree:true});

  const style=document.createElement('style');
  style.textContent=`
    .afp-search-wrap{margin:12px 14px 4px;height:52px;background:#fff;border:1px solid #e2e2e2;border-radius:17px;display:flex;align-items:center;gap:8px;padding:0 13px;box-shadow:0 4px 15px rgba(0,0,0,.055);direction:rtl}
    .afp-search-icon{font-size:26px;color:#777;line-height:1}
    #afpSearch{flex:1;border:0;outline:0;background:transparent;font-size:15px;color:#222;font-family:inherit;min-width:0}
    #afpSearch::placeholder{color:#999}
    #afpClearSearch{border:0;background:#eee;color:#666;width:28px;height:28px;border-radius:50%;font-size:19px;line-height:1;display:grid;place-items:center;cursor:pointer}
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
