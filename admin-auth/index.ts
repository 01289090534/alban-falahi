import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const url = Deno.env.get('SUPABASE_URL')!;
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const admin = createClient(url, serviceKey);

const headers = {'Content-Type':'application/json','Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'content-type'};
const json=(x:unknown,s=200)=>new Response(JSON.stringify(x),{status:s,headers});

Deno.serve(async(req)=>{
  if(req.method==='OPTIONS') return new Response('ok',{headers});
  try{
    const {email,password}=await req.json();
    if(typeof email!=='string'||typeof password!=='string'||!email||!password) return json({error:'البريد الإلكتروني وكلمة المرور مطلوبان'},400);
    const r=await fetch(`${url}/auth/v1/token?grant_type=password`,{method:'POST',headers:{apikey:serviceKey,'Content-Type':'application/json'},body:JSON.stringify({email,password})});
    const auth=await r.json();
    if(!r.ok||!auth.access_token||!auth.user) return json({error:'البريد الإلكتروني أو كلمة المرور غير صحيحة'},401);
    const {data:role,error:roleError}=await admin.from('user_roles').select('role,branch_id').eq('user_id',auth.user.id).in('role',['admin','branch_manager','branch_employee','driver','support']).limit(1).maybeSingle();
    if(roleError||!role) return json({error:'هذا الحساب ليس لديه صلاحية دخول للوحة الإدارة'},403);
    const {data:profile}=await admin.from('profiles').select('full_name,phone,preferred_language').eq('id',auth.user.id).maybeSingle();
    return json({success:true,session:{access_token:auth.access_token,refresh_token:auth.refresh_token,expires_in:auth.expires_in},user:{id:auth.user.id,email:auth.user.email,role:role.role,branch_id:role.branch_id,profile:profile||null}});
  }catch(e){return json({error:'حدث خطأ غير متوقع'},500)}
});