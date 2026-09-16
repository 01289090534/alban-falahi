(()=>{
  const path=location.pathname.toLowerCase();
  const role=path.includes('driver')?'driver':(path.includes('admin')?'store':'customer');
  const manifests={customer:'manifest.webmanifest',store:'store-manifest.webmanifest',driver:'driver-manifest.webmanifest'};
  const links=[...document.querySelectorAll('link[rel="manifest"]')];
  if(links[0]) links[0].href=manifests[role];
  else {const l=document.createElement('link');l.rel='manifest';l.href=manifests[role];document.head.appendChild(l)}
  if('serviceWorker' in navigator) window.addEventListener('load',()=>navigator.serviceWorker.register('/pwa-sw.js',{scope:'/'}).catch(()=>{}));
  let deferred=null;
  const standalone=()=>window.matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
  const show=()=>{if(standalone()||document.getElementById('pwaInstallBox'))return;const b=document.createElement('div');b.id='pwaInstallBox';b.dir='rtl';b.style.cssText='position:fixed;left:12px;right:12px;bottom:12px;z-index:99999;background:#fff;border:1px solid #ddd;border-radius:16px;padding:12px;box-shadow:0 8px 30px #0002;font-family:Arial,sans-serif;display:flex;align-items:center;gap:10px';b.innerHTML='<div style="flex:1;font-weight:700">📲 ثبّت برنامج ألبان فلاحي على موبايلك</div><button id="pwaInstallBtn" style="border:0;border-radius:10px;padding:10px 14px;background:#222;color:#fff;font-weight:700">تثبيت</button><button id="pwaCloseBtn" style="border:0;background:transparent;font-size:20px">×</button>';document.body.appendChild(b);document.getElementById('pwaCloseBtn').onclick=()=>b.remove();document.getElementById('pwaInstallBtn').onclick=async()=>{if(deferred){deferred.prompt();try{await deferred.userChoice}catch(e){}deferred=null;b.remove()}else alert('من قائمة المتصفح اختر «إضافة إلى الشاشة الرئيسية» أو «تثبيت التطبيق».')}};
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferred=e;show()});
  window.addEventListener('appinstalled',()=>{deferred=null;document.getElementById('pwaInstallBox')?.remove()});
  setTimeout(()=>{if(!standalone())show()},1800);
})();
