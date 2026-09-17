(()=>{
const BRAND_SUPA='https://qxwvuxkbcghbkztjrzon.supabase.co';
const BRAND_KEY='sb_publishable_JI9lC4YPTCQ8CwMxzvHNIA_C24ULpWH';
const BRAND_BUCKET='product-images';
const be=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
async function brandUpload(file,kind){
  if(!file) return null;
  if(!/^image\/(jpeg|png|webp|jpg)$/i.test(file.type)) throw Error('اختار صورة JPG أو PNG أو WEBP');
  if(file.size>8*1024*1024) throw Error('حجم الصورة كبير. الحد الأقصى 8 ميجابايت');
  const ext=file.type==='image/png'?'png':file.type==='image/webp'?'webp':'jpg';
  const path='customer-branding/'+kind+'-'+Date.now()+'-'+crypto.randomUUID()+'.'+ext;
  const s=(()=>{try{return JSON.parse(localStorage.getItem('alban_admin_session')||'null')}catch{return null}})();
  if(!s?.access_token) throw Error('جلسة الإدارة غير موجودة');
  const r=await fetch(BRAND_SUPA+'/storage/v1/object/'+BRAND_BUCKET+'/'+path,{method:'POST',headers:{apikey:BRAND_KEY,Authorization:'Bearer '+s.access_token,'Content-Type':file.type,'x-upsert':'false'},body:file});
  const t=await r.text();let d=null;try{d=JSON.parse(t)}catch{}
  if(!r.ok) throw Error(d?.message||d?.error||t||'فشل رفع الصورة');
  return BRAND_SUPA+'/storage/v1/object/public/'+BRAND_BUCKET+'/'+path;
}
window.settings=async()=>{
  loading();
  try{
    const [rows,br,bd]=await Promise.all([api('store_settings?select=*'),api('branches?select=id,name_ar,is_active'),api('branch_delivery_settings?select=*')]);
    const s=rows[0]||{},map=new Map(bd.map(x=>[x.branch_id,x]));
    $('content').innerHTML='<div class="grid">'+
      '<div class="card"><h2>🎨 هوية برنامج العميل</h2><p class="sub">ارفع اللوجو وصورة البانر/الخلفية التي تظهر أعلى برنامج العميل. التغيير يظهر للعميل بعد تحديث البرنامج.</p>'+ 
      '<div class="settings-grid">'+
      '<div class="field"><label>لوجو برنامج العميل</label><input id="brandLogo" type="file" accept="image/jpeg,image/png,image/webp"><small>يفضل صورة مربعة PNG أو WEBP، حتى 8 ميجابايت.</small><div id="brandLogoPreview" style="margin-top:10px">'+(s.customer_logo_url?'<img src="'+be(s.customer_logo_url)+'" style="width:110px;height:110px;object-fit:contain;border:1px solid #ddd;border-radius:16px;background:#fff;padding:8px">':'<span class="sub">لم يتم رفع لوجو بعد</span>')+'</div></div>'+ 
      '<div class="field"><label>صورة خلفية البانر العلوي</label><input id="brandHero" type="file" accept="image/jpeg,image/png,image/webp"><small>يفضل صورة أفقية 16:9 أو 3:1 حسب شكل البانر الحالي، حتى 8 ميجابايت.</small><div id="brandHeroPreview" style="margin-top:10px">'+(s.customer_home_hero_url?'<img src="'+be(s.customer_home_hero_url)+'" style="width:100%;max-width:420px;height:150px;object-fit:cover;border:1px solid #ddd;border-radius:16px">':'<span class="sub">لم يتم رفع صورة خلفية بعد</span>')+'</div></div>'+ 
      '</div><div id="brandMsg"></div><button class="btn" id="saveBranding">💾 حفظ هوية برنامج العميل</button></div>'+ 
      '<div class="card"><h2>إعدادات العميل والتوصيل</h2><div class="settings-grid"><div class="field"><label>بداية الدليفري</label><input id="s_start" type="time" value="'+tm(s.delivery_start)+'"></div><div class="field"><label>نهاية الدليفري</label><input id="s_end" type="time" value="'+tm(s.delivery_end)+'"></div><div class="field"><label>رسوم التوصيل</label><input id="s_fee" type="number" value="'+(s.delivery_fee??25)+'"></div><div class="field"><label>مجاني من</label><input id="s_free" type="number" value="'+(s.free_delivery_threshold??500)+'"></div><div class="field"><label>كل كام جنيه = نقاط</label><input id="s_step" type="number" value="'+(s.points_egp_step??100)+'"></div><div class="field"><label>عدد النقاط</label><input id="s_points" type="number" value="'+(s.points_per_step??1)+'"></div><div class="field"><label>قيمة النقطة بالجنيه</label><input id="s_value" type="number" step="0.001" value="'+(s.point_value_egp??0.005)+'"></div><div class="field"><label>رسوم الخدمة %</label><input id="s_service" type="number" step="0.1" value="'+(s.service_fee_percent??2)+'"></div></div><label class="check"><input id="s_tip" type="checkbox" '+(s.tip_enabled?'checked':'')+'> تفعيل البقشيش</label><label class="check"><input id="s_schedule" type="checkbox" '+(s.scheduling_enabled?'checked':'')+'> السماح بالطلب المجدول</label><button class="btn" onclick="saveSettings()">💾 حفظ</button><div id="settingsMsg"></div></div></div>'+ 
      '<div class="card"><h2>إعدادات كل فرع</h2><div class="list">'+br.map(x=>{const q=map.get(x.id)||{};return '<div class="item"><div><b>'+be(x.name_ar)+'</b></div><div><label class="check"><input id="ben_'+x.id+'" type="checkbox" '+(q.delivery_enabled!==false?'checked':'')+'> توصيل</label><input class="mini-input" id="bs_'+x.id+'" type="time" value="'+tm(q.delivery_start)+'" placeholder="بداية"><input class="mini-input" id="be_'+x.id+'" type="time" value="'+tm(q.delivery_end)+'" placeholder="نهاية"><input class="mini-input" id="bf_'+x.id+'" type="number" placeholder="رسوم مركزي" value="'+(q.delivery_fee??'')+'"><input class="mini-input" id="bfree_'+x.id+'" type="number" placeholder="مجاني مركزي" value="'+(q.free_delivery_threshold??'')+'"><button class="btn light" onclick="saveBranchSettings(\''+x.id+'\')">حفظ</button></div></div>'}).join('')+'</div></div></div>';
    const logoInput=$('brandLogo'),heroInput=$('brandHero');
    logoInput.onchange=()=>{const f=logoInput.files?.[0];if(f)$('brandLogoPreview').innerHTML='<img src="'+URL.createObjectURL(f)+'" style="width:110px;height:110px;object-fit:contain;border:1px solid #ddd;border-radius:16px;background:#fff;padding:8px">'};
    heroInput.onchange=()=>{const f=heroInput.files?.[0];if(f)$('brandHeroPreview').innerHTML='<img src="'+URL.createObjectURL(f)+'" style="width:100%;max-width:420px;height:150px;object-fit:cover;border:1px solid #ddd;border-radius:16px">'};
    $('saveBranding').onclick=async()=>{
      const btn=$('saveBranding');btn.disabled=true;btn.textContent='جارٍ رفع الصور والحفظ...';
      try{
        let logo=s.customer_logo_url||null,hero=s.customer_home_hero_url||null;
        if(logoInput.files?.[0]) logo=await brandUpload(logoInput.files[0],'logo');
        if(heroInput.files?.[0]) hero=await brandUpload(heroInput.files[0],'hero');
        await api('store_settings?id=eq.true',{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({customer_logo_url:logo,customer_home_hero_url:hero,updated_at:new Date().toISOString()})});
        $('brandMsg').innerHTML='<div class="notice good">تم حفظ لوجو وخلفية برنامج العميل بنجاح ✅</div>';
      }catch(e){$('brandMsg').innerHTML='<div class="notice bad">'+be(e.message||e)+'</div>'}finally{btn.disabled=false;btn.textContent='💾 حفظ هوية برنامج العميل'}
    };
  }catch(e){err(e)}
};
})();