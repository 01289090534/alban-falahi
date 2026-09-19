(()=>{
function addStyle(){
 if(document.getElementById('mainCatsStyle'))return;
 const s=document.createElement('style');
 s.id='mainCatsStyle';
 s.textContent=`
 .main-cat-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:14px}
 .main-cat-box{border:1px solid #e6ddd5;border-radius:16px;background:#fff;padding:16px}
 .main-cat-box img{width:100%;height:130px;object-fit:cover;border-radius:12px}
 .main-cat-box h3{margin:10px 0 5px}.main-cat-box p{color:#786d64}.main-cat-actions{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}.main-cat-actions .btn{flex:1;min-width:72px}.main-cat-order{display:flex;gap:6px;margin-top:8px}.main-cat-order button{border:1px solid #ddd;background:#fafafa;border-radius:9px;padding:7px 10px;cursor:pointer}
 .main-cat-list{display:grid;gap:8px;margin:15px 0}
 .main-cat-item{display:flex;gap:9px;align-items:center;padding:9px;border:1px solid #eee;border-radius:10px}
 .main-cat-form{display:grid;gap:10px}.main-cat-form input{padding:11px;border:1px solid #ddd;border-radius:10px}`;
 document.head.appendChild(s);
}
function showModal(html){
 const b=document.createElement('div');b.className='dash-modal-back';
 b.innerHTML='<div class="dash-modal" dir="rtl">'+html+'</div>';
 document.body.appendChild(b);return b;
}
async function addGroup(){
 const b=showModal('<div class="head"><h2>إضافة قسم رئيسي</h2><button class="btn light" id="x">إغلاق</button></div><div class="main-cat-form"><label>اسم القسم بالعربي *</label><input id="ar" type="text"><label>اسم القسم بالإنجليزي *</label><input id="en" type="text"><label>صورة القسم</label><input id="img" type="file" accept="image/jpeg,image/png,image/webp"><button class="btn" id="save">حفظ القسم</button></div>');
 b.querySelector('#x').onclick=()=>b.remove();
 b.querySelector('#save').onclick=async()=>{
  const ar=b.querySelector('#ar').value.trim(),en=b.querySelector('#en').value.trim(),file=b.querySelector('#img').files[0];
  if(!ar||!en){alert('اكتب الاسم العربي والإنجليزي');return}
  try{
   let image_url=null;
   if(file){
    if(!/^image\/(jpeg|png|webp|jpg)$/i.test(file.type))throw Error('اختار صورة JPG أو PNG أو WEBP');
    if(file.size>8*1024*1024)throw Error('حجم الصورة كبير. الحد الأقصى 8 ميجابايت');
    const token=JSON.parse(localStorage.getItem('alban_admin_session')||'{}').access_token;
    if(!token)throw Error('جلسة الإدارة غير موجودة');
    const path='category-groups/'+Date.now()+'-'+crypto.randomUUID()+'.'+(file.name.split('.').pop()||'jpg');
    const u='https://qxwvuxkbcghbkztjrzon.supabase.co/storage/v1/object/product-images/'+path;
    const rr=await fetch(u,{method:'POST',headers:{Authorization:'Bearer '+token,apikey:'sb_publishable_JI9lC4YPTCQ8CwMxzvHNIA_C24ULpWH','Content-Type':file.type},body:file});
    if(!rr.ok)throw Error('فشل رفع صورة القسم');
    image_url='https://qxwvuxkbcghbkztjrzon.supabase.co/storage/v1/object/public/product-images/'+path;
   }
   const last=await api('category_groups?select=sort_order&order=sort_order.desc&limit=1');
   const sort_order=last.length?Number(last[0].sort_order||0)+1:0;
   await api('category_groups',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({name_ar:ar,name_en:en,image_url,sort_order,is_active:true})});
   b.remove();await renderMainCategories();
  }catch(e){alert(String(e.message||e))}
 };
}
async function renderMainCategories(){
 addStyle();
 $('content').innerHTML='<div class="card"><div class="head"><div><h2>الأقسام الرئيسية</h2><div class="sub">إدارة الأقسام الرئيسية وربط الفئات بها — مستقلة عن المنتجات.</div></div><button class="btn" id="addMainGroup">+ إضافة قسم</button></div><div id="mainCatGrid" class="main-cat-grid"><div class="card">جارٍ تحميل البيانات...</div></div></div>';
 $('addMainGroup').onclick=addGroup;
 try{
  const results=await Promise.all([
   api('category_groups?select=*&is_active=eq.true&order=sort_order.asc,id.asc'),
   api('categories?select=id,name_ar,name_en,category_group_id,is_active&order=sort_order.asc,id.asc')
  ]);
  const groups=results[0]||[],cats=results[1]||[],grid=$('mainCatGrid');
  const cards=groups.map(g=>{
   const count=cats.filter(c=>c.category_group_id===g.id).length;
   return '<div class="main-cat-box">'+(g.image_url?'<img src="'+esc(g.image_url)+'">':'')+'<h3>'+esc(g.name_ar||'بدون اسم')+'</h3><p>'+esc(g.name_en||'')+' — '+count+' فئة</p><div class="main-cat-actions"><button class="btn light" onclick="editMainCategoryGroup(\''+g.id+'\')">تعديل</button><button class="btn light" onclick="manageMainCategoryGroup(\''+g.id+'\')">إدارة الفئات</button><button class="btn light" onclick="deleteMainCategoryGroup(\''+g.id+'\')">حذف</button></div><div class="main-cat-order"><button onclick="moveMainCategoryGroup(\''+g.id+'\',-1)">↑ أعلى</button><button onclick="moveMainCategoryGroup(\''+g.id+'\',1)">↓ أسفل</button></div></div>';
  }).join('');
  const un=cats.filter(c=>!c.category_group_id).length;
  grid.innerHTML=cards+(un?'<div class="main-cat-box"><h3>📦 غير مصنف</h3><p>'+un+' فئة</p><button class="btn light" onclick="manageMainCategoryGroup(\'none\')">تعيين الفئات</button></div>':'')||'<div class="main-cat-box"><h3>لا توجد أقسام</h3><p>أضف أول قسم رئيسي للبدء.</p></div>';
 }catch(e){err(e)}
}
async function editMainCategoryGroup(id){try{const rows=await api('category_groups?id=eq.'+id+'&select=*'),g=rows&&rows[0];if(!g)throw Error('القسم غير موجود');const b=showModal('<div class="head"><h2>تعديل القسم الرئيسي</h2><button class="btn light" id="x">إغلاق</button></div><div class="main-cat-form"><label>اسم القسم بالعربي *</label><input id="ar" type="text" value="'+esc(g.name_ar||'')+'"><label>اسم القسم بالإنجليزي *</label><input id="en" type="text" value="'+esc(g.name_en||'')+'"><label>تغيير صورة القسم (اختياري)</label><input id="img" type="file" accept="image/jpeg,image/png,image/webp"><button class="btn" id="save">حفظ التعديل</button></div>');b.querySelector('#x').onclick=()=>b.remove();b.querySelector('#save').onclick=async()=>{const ar=b.querySelector('#ar').value.trim(),en=b.querySelector('#en').value.trim(),file=b.querySelector('#img').files[0];if(!ar||!en){alert('اكتب الاسم العربي والإنجليزي');return}try{const body={name_ar:ar,name_en:en,updated_at:new Date().toISOString()};if(file){if(!/^image\\/(jpeg|png|webp|jpg)$/i.test(file.type))throw Error('اختار صورة JPG أو PNG أو WEBP');if(file.size>8*1024*1024)throw Error('حجم الصورة كبير. الحد الأقصى 8 ميجابايت');const token=JSON.parse(localStorage.getItem('alban_admin_session')||'{}').access_token;if(!token)throw Error('جلسة الإدارة غير موجودة');const path='category-groups/'+Date.now()+'-'+crypto.randomUUID()+'.'+(file.name.split('.').pop()||'jpg');const u='https://qxwvuxkbcghbkztjrzon.supabase.co/storage/v1/object/product-images/'+path;const rr=await fetch(u,{method:'POST',headers:{Authorization:'Bearer '+token,apikey:'sb_publishable_JI9lC4YPTCQ8CwMxzvHNIA_C24ULpWH','Content-Type':file.type},body:file});if(!rr.ok)throw Error('فشل رفع صورة القسم');body.image_url='https://qxwvuxkbcghbkztjrzon.supabase.co/storage/v1/object/public/product-images/'+path}await api('category_groups?id=eq.'+id,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify(body)});b.remove();await renderMainCategories()}catch(e){alert(String(e.message||e))}}}catch(e){err(e)}}
async function deleteMainCategoryGroup(id){if(!confirm('هل أنت متأكد من حذف هذا القسم الرئيسي؟ الفئات التابعة له لن تُحذف، وسيتم تحويلها إلى غير مصنف.'))return;try{const cs=await api('categories?category_group_id=eq.'+id+'&select=id');for(const c of cs||[])await api('categories?id=eq.'+c.id,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({category_group_id:null,updated_at:new Date().toISOString()})});await api('category_groups?id=eq.'+id,{method:'DELETE'});await renderMainCategories()}catch(e){alert('تعذر حذف القسم: '+String(e.message||e))}}
async function moveMainCategoryGroup(id,d){try{const gs=await api('category_groups?select=id,sort_order&is_active=eq.true&order=sort_order.asc,id.asc'),i=gs.findIndex(g=>String(g.id)===String(id)),j=i+d;if(i<0||j<0||j>=gs.length)return;const a=gs[i],b=gs[j],ao=Number(a.sort_order||0),bo=Number(b.sort_order||0);await api('category_groups?id=eq.'+a.id,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({sort_order:bo,updated_at:new Date().toISOString()})});await api('category_groups?id=eq.'+b.id,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({sort_order:ao,updated_at:new Date().toISOString()})});await renderMainCategories()}catch(e){alert('تعذر إعادة الترتيب: '+String(e.message||e))}}
async function manageMainCategoryGroup(id){
 try{
  const cats=await api('categories?select=id,name_ar,category_group_id&order=sort_order.asc,id.asc');
  const title=id==='none'?'غير مصنف':'القسم';
  const b=showModal('<div class="head"><h2>تعيين فئات — '+title+'</h2><button class="btn light" id="x">إغلاق</button></div><div class="main-cat-list">'+cats.map(c=>'<label class="main-cat-item"><input type="checkbox" data-id="'+c.id+'" '+((id==='none'?!c.category_group_id:c.category_group_id===id)?'checked':'')+'><span>'+esc(c.name_ar)+'</span></label>').join('')+'</div><button class="btn" id="save">حفظ التوزيع</button>');
  b.querySelector('#x').onclick=()=>b.remove();
  b.querySelector('#save').onclick=async()=>{
   try{
    const selected=[...b.querySelectorAll('input[data-id]:checked')].map(x=>x.dataset.id);
    await Promise.all(cats.filter(c=>selected.includes(c.id)&&c.category_group_id!==id&&id!=='none').map(c=>api('categories?id=eq.'+c.id,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({category_group_id:id,updated_at:new Date().toISOString()})})));
    if(id!=='none')await Promise.all(cats.filter(c=>c.category_group_id===id&&!selected.includes(c.id)).map(c=>api('categories?id=eq.'+c.id,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({category_group_id:null,updated_at:new Date().toISOString()})})));
    b.remove();await renderMainCategories();
   }catch(e){alert(e.message)}
  };
 }catch(e){err(e)}
}
window.renderMainCategories=renderMainCategories;
window.manageMainCategoryGroup=manageMainCategoryGroup;window.editMainCategoryGroup=editMainCategoryGroup;window.deleteMainCategoryGroup=deleteMainCategoryGroup;window.moveMainCategoryGroup=moveMainCategoryGroup;
})();