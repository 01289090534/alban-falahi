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

  const setHero=()=>{
    const img=document.querySelector('#products .pic img');
    if(img?.src)hero.style.backgroundImage='url("'+img.src.replace(/"/g,'')+'")';
  };
  setHero();
  window.addEventListener('alban:productsRendered',setHero);
  new MutationObserver(setHero).observe(document.getElementById('products')||document.body,{childList:true,subtree:true});

  /* طبقة اللمسات النهائية: تصميم فقط، لا تغيّر أي وظيفة أو بيانات */
  const style=document.createElement('style');
  style.textContent=`
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
