(()=>{
const SUPA='https://qxwvuxkbcghbkztjrzon.supabase.co';
const KEY='sb_publishable_JI9lC4YPTCQ8CwMxzvHNIA_C24ULpWH';
const BUCKET='product-images';
const escU=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
const getSession=()=>{try{return JSON.parse(localStorage.getItem('alban_admin_session')||'null')}catch{return null}};
async function apiU(path,opt={}){const s=getSession();if(!s?.access_token)throw Error('جلسة الإدارة غير موجودة');const r=await fetch(SUPA+'/functions/v1/admin-api?path='+encodeURIComponent(path),{...opt,headers:{Accept:'application/json','Content-Type':'application/json',Authorization:'Bearer '+s.access_token,...(opt.headers||{})}});const t=await r.text();let d=null;try{d=t?JSON.parse(t):null}catch{d=t}if(!r.ok)throw Error(d?.message||d?.error||'حدث خطأ');return d?.data??d}

let cropState=null;
async function loadImage(file){
  if(!file)return null;
  if(!/^image\/(jpeg|png|webp|jpg)$/i.test(file.type))throw Error('اختار صورة JPG أو PNG أو WEBP');
  if(file.size>8*1024*1024)throw Error('حجم الصورة كبير. الحد الأقصى 8 ميجابايت');
  const url=URL.createObjectURL(file);
  try{
    const img=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=()=>rej(Error('تعذر قراءة الصورة'));i.src=url});
    return img;
  }finally{URL.revokeObjectURL(url)}
}
function drawCrop(){
  if(!cropState)return;
  const {canvas,img,zoom,x,y}=cropState;
  const ctx=canvas.getContext('2d');
  const size=canvas.width;
  ctx.clearRect(0,0,size,size);
  ctx.fillStyle='#eee';ctx.fillRect(0,0,size,size);
  const base=Math.max(size/img.width,size/img.height);
  const scale=base*zoom;
  const w=img.width*scale,h=img.height*scale;
  ctx.drawImage(img,(size-w)/2+x,(size-h)/2+y,w,h);
}
function openCropper(img,onDone){
  const old=document.getElementById('prodCropModal');if(old)old.remove();
  const m=document.createElement('div');m.id='prodCropModal';m.className='cat-modal-back';
  m.innerHTML='<div class="cat-modal" dir="rtl" style="max-width:520px"><h3>ضبط صورة المنتج</h3><p style="color:#666;margin:0 0 10px">كبّر الصورة واسحبها بالماوس أو بإصبعك حتى تظهر بالشكل المناسب.</p><div class="crop-stage"><canvas id="cropCanvas" width="420" height="420"></canvas><div class="crop-frame"></div></div><label class="crop-zoom">🔍 التكبير <input id="cropZoom" type="range" min="1" max="3" step="0.01" value="1"></label><div class="cat-form-actions"><button class="btn light" id="cropCancel">إلغاء</button><button class="btn" id="cropApply">استخدام الصورة</button></div></div>';
  document.body.appendChild(m);
  const canvas=document.getElementById('cropCanvas');
  cropState={canvas,img,zoom:1,x:0,y:0};drawCrop();
  const zoom=document.getElementById('cropZoom');zoom.oninput=()=>{cropState.zoom=Number(zoom.value);drawCrop()};
  let dragging=false,lastX=0,lastY=0;
  const start=(cx,cy)=>{dragging=true;lastX=cx;lastY=cy};
  const move=(cx,cy)=>{if(!dragging)return;cropState.x+=cx-lastX;cropState.y+=cy-lastY;lastX=cx;lastY=cy;drawCrop()};
  const end=()=>{dragging=false};
  canvas.addEventListener('mousedown',e=>start(e.clientX,e.clientY));
  window.addEventListener('mousemove',e=>move(e.clientX,e.clientY));
  window.addEventListener('mouseup',end);
  canvas.addEventListener('touchstart',e=>{const t=e.touches[0];start(t.clientX,t.clientY)},{passive:true});
  canvas.addEventListener('touchmove',e=>{const t=e.touches[0];move(t.clientX,t.clientY)},{passive:true});
  canvas.addEventListener('touchend',end);
  document.getElementById('cropCancel').onclick=()=>{window.removeEventListener('mousemove',move);window.removeEventListener('mouseup',end);m.remove()};
  document.getElementById('cropApply').onclick=()=>{canvas.toBlob(blob=>{if(!blob)return;onDone(blob,canvas.toDataURL('image/webp',.84));m.remove()},'image/webp',.84)};
}
async function uploadCropped(blob){
  const path='products/'+Date.now()+'-'+crypto.randomUUID()+'.webp';
  const s=getSession();
  const r=await fetch(SUPA+'/storage/v1/object/'+BUCKET+'/'+path,{method:'POST',headers:{apikey:KEY,Authorization:'Bearer '+s.access_token,'Content-Type':'image/webp','x-upsert':'false'},body:blob});
  const t=await r.text();
  if(!r.ok)throw Error((()=>{try{return JSON.parse(t)?.message||JSON.parse(t)?.error}catch{return t}})()||'فشل رفع الصورة');
  return SUPA+'/storage/v1/object/public/'+BUCKET+'/'+path;
}
async function deleteProduct(id,name){
  if(!id)return;
  if(!confirm('هل أنت متأكد من حذف المنتج «'+String(name||'هذا المنتج')+'»؟\n\nسيختفي من برنامج العميل ومن الفروع، مع الاحتفاظ به داخليًا لحماية الطلبات القديمة.'))return;
  try{
    await apiU('branch_products?product_id=eq.'+encodeURIComponent(id),{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({is_available:false,availability_status:'unavailable',updated_at:new Date().toISOString()})});
    await apiU('products?id=eq.'+encodeURIComponent(id),{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({is_active:false,updated_at:new Date().toISOString()})});
    alert('تم حذف المنتج من القائمة والفروع بنجاح');
    if(typeof window.products==='function')window.products();
  }catch(e){alert('تعذر حذف المنتج: '+(e.message||e))}
}
async function productFormUpload(catId,id){
  const old=document.getElementById('prodUploadModal');if(old)old.remove();
  const edit=!!id;
  try{
    const cat=(await apiU('categories?id=eq.'+encodeURIComponent(catId)))[0];if(!cat)return;
    let x={name_ar:'',name_en:'',description_ar:'',description_en:'',base_price:0,image_url:''};
    if(edit){x=(await apiU('products?id=eq.'+encodeURIComponent(id)))[0];if(!x)return}
    const m=document.createElement('div');m.id='prodUploadModal';m.className='cat-modal-back';
    m.innerHTML='<div class="cat-modal" dir="rtl"><h3>'+(edit?'تعديل المنتج':'إضافة منتج جديد')+'</h3><div class="prod-form-cat">الفئة: <b>'+escU(cat.name_ar)+'</b><small>'+escU(cat.name_en||'')+'</small></div><div class="prod-photo-box"><div id="prodPreview">'+(x.image_url?'<img src="'+escU(x.image_url)+'">':'🧀')+'</div><label class="upload-btn">📷 اختيار صورة المنتج<input id="prodImageFile" type="file" accept="image/jpeg,image/png,image/webp" hidden></label><small>بعد اختيار الصورة هتقدر تعمل زوم وتحرك الصورة قبل الحفظ</small></div><label>اسم المنتج بالعربي <span>*</span><input id="puNameAr" value="'+escU(x.name_ar||'')+'" placeholder="اسم المنتج بالعربي"></label><label>اسم المنتج بالإنجليزي <span>*</span><input id="puNameEn" value="'+escU(x.name_en||'')+'" placeholder="Product name in English" dir="ltr"></label><label>الوصف بالعربي<input id="puDescAr" value="'+escU(x.description_ar||'')+'" placeholder="وصف المنتج بالعربي"></label><label>الوصف بالإنجليزي<input id="puDescEn" value="'+escU(x.description_en||'')+'" placeholder="Product description in English" dir="ltr"></label><label>السعر <span>*</span><input id="puPrice" type="number" min="0" step="0.01" value="'+Number(x.base_price||0)+'"></label><div class="cat-form-actions"><button class="btn light" id="puCancel">إلغاء</button><button class="btn" id="puSave">'+(edit?'💾 حفظ التعديل':'إضافة المنتج')+'</button></div></div>';
    document.body.appendChild(m);
    let selectedBlob=null;
    document.getElementById('puCancel').onclick=()=>m.remove();
    document.getElementById('prodImageFile').onchange=async e=>{
      const file=e.target.files?.[0];if(!file)return;
      try{
        const img=await loadImage(file);
        openCropper(img,(blob,preview)=>{selectedBlob=blob;document.getElementById('prodPreview').innerHTML='<img src="'+preview+'">';});
      }catch(err){alert(err.message||err);e.target.value=''}
    };
    document.getElementById('puSave').onclick=async()=>{
      const ar=document.getElementById('puNameAr').value.trim(),en=document.getElementById('puNameEn').value.trim(),da=document.getElementById('puDescAr').value.trim(),de=document.getElementById('puDescEn').value.trim(),price=Number(document.getElementById('puPrice').value);
      if(!ar)return alert('اكتب اسم المنتج بالعربي');if(!en)return alert('اكتب اسم المنتج بالإنجليزي');if(!Number.isFinite(price)||price<0)return alert('السعر غير صحيح');
      const b=document.getElementById('puSave');b.disabled=true;b.textContent='جارٍ الحفظ...';
      try{
        let image=x.image_url||null;if(selectedBlob)image=await uploadCropped(selectedBlob);
        if(edit)await apiU('products?id=eq.'+encodeURIComponent(id),{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({name_ar:ar,name_en:en,description_ar:da,description_en:de,base_price:price,image_url:image,updated_at:new Date().toISOString()})});
        else{const rows=await apiU('products?select=sort_order&order=sort_order.desc&limit=1');const sort=(rows[0]?.sort_order||0)+1;await apiU('products',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({category_id:catId,name_ar:ar,name_en:en,description_ar:da,description_en:de,base_price:price,image_url:image,is_active:false,sort_order:sort})})}
        m.remove();if(typeof window.products==='function')window.products();
      }catch(e){b.disabled=false;b.textContent=edit?'💾 حفظ التعديل':'إضافة المنتج';alert(e.message||e)}
    };
  }catch(e){alert(e.message||e)}
}
window.addProductC=catId=>productFormUpload(catId);
window.editProductC=async id=>{const x=(await apiU('products?id=eq.'+encodeURIComponent(id)))[0];if(x)productFormUpload(x.category_id,id)};
window.deleteProductC=deleteProduct;
if(!document.getElementById('prodUploadStyle')){
 const s=document.createElement('style');s.id='prodUploadStyle';s.textContent=`
 .prod-photo-box{background:#f8f3ee;border:1px dashed #cdbdaf;border-radius:16px;padding:14px;text-align:center;margin-bottom:14px}
 .prod-photo-box>div{width:150px;height:150px;margin:0 auto 12px;border-radius:16px;overflow:hidden;background:#eee;display:grid;place-items:center;font-size:55px}
 .prod-photo-box img{width:100%;height:100%;object-fit:cover}
 .upload-btn{display:inline-block!important;width:auto!important;background:#1e88e5;color:#fff;padding:10px 18px;border-radius:10px;cursor:pointer;font-weight:700}
 .prod-photo-box>small{display:block;color:#777;margin-top:8px}
 .crop-stage{width:420px;max-width:100%;aspect-ratio:1;margin:10px auto 14px;position:relative;border-radius:16px;overflow:hidden;background:#111;touch-action:none;box-shadow:0 4px 20px rgba(0,0,0,.15)}
 .crop-stage canvas{width:100%;height:100%;display:block;cursor:grab;touch-action:none}
 .crop-stage canvas:active{cursor:grabbing}
 .crop-frame{position:absolute;inset:0;border:2px solid rgba(255,255,255,.85);pointer-events:none;box-shadow:0 0 0 9999px rgba(0,0,0,.12)}
 .crop-zoom{display:flex!important;align-items:center;gap:10px;margin:12px 0;font-weight:700}
 .crop-zoom input{flex:1}
 `;document.head.appendChild(s)
 }
})();