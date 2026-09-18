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

  // استخدم أول صورة منتج متاحة كخلفية للغلاف، بدون إضافة خدمة خارجية.
  const setHero=()=>{
    const img=document.querySelector('#products .pic img');
    if(img?.src)hero.style.backgroundImage='url("'+img.src.replace(/"/g,'')+'")';
  };
  setHero();
  window.addEventListener('alban:productsRendered',setHero);
  new MutationObserver(setHero).observe(document.getElementById('products')||document.body,{childList:true,subtree:true});
})();