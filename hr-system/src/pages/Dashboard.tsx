import {useEffect,useState} from 'react';
import {AlertTriangle,Building2,CheckCircle2,ClipboardCheck,Clock3,RefreshCw,TrendingDown,Users,WalletCards} from 'lucide-react';
import {supabase} from '../lib/supabase';
import type {Profile} from '../types';

const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Cairo'}).format(new Date());
const money=(v:any)=>Number(v||0).toLocaleString('ar-EG',{maximumFractionDigits:2})+' ج.م';
const days=(a:string,b:string)=>Math.max(1,Math.round((new Date(b).getTime()-new Date(a).getTime())/86400000)+1);
const shift=(date:string,n:number)=>{const d=new Date(date+'T12:00:00');d.setDate(d.getDate()+n);return new Intl.DateTimeFormat('en-CA').format(d)};

export default function Dashboard({profile}:{profile:Profile}){
 const[todayDate]=useState(today()),[from,setFrom]=useState(todayDate),[to,setTo]=useState(todayDate),[loading,setLoading]=useState(true),[refresh,setRefresh]=useState(0);
 const[s,setS]=useState<any>({employees:0,active:0,branches:0,attendance:0,missing:0,pendingAttendance:0,pendingOT:0,pendingMoney:0,closeouts:0,cash:0,expected:0,diff:0,visa:0,wallet:0,expenses:0,prevCash:0,prevDiff:0,prevExpenses:0,branchRows:[],deficits:0});
 useEffect(()=>{let alive=true;(async()=>{setLoading(true);
  if(profile.role==='employee'){
   const [{data:a},{data:o},{data:m},{data:p}]=await Promise.all([
    supabase.from('hr_v2_attendance').select('*').eq('employee_id',profile.employee_id).order('work_date',{ascending:false}).limit(1),
    supabase.from('hr_v2_overtime').select('*').eq('employee_id',profile.employee_id).order('work_date',{ascending:false}).limit(1),
    supabase.from('hr_v2_money_transactions').select('*').eq('employee_id',profile.employee_id).order('transaction_date',{ascending:false}).limit(1),
    supabase.from('hr_v2_payroll').select('*').eq('employee_id',profile.employee_id).order('period_start',{ascending:false}).limit(1)
   ]);
   if(alive){setS({attendance:a?.[0]?.work_date?1:0,overtime:Number(o?.[0]?.amount||0),advances:Number(m?.[0]?.amount||0),payroll:Number(p?.[0]?.net_salary||0)});setLoading(false)}return;
  }
  const prevTo=shift(from,-1),prevFrom=shift(prevTo,-days(from,to)+1);
  const [emp,act,br,att,ot,mt,co,pc,branches]=await Promise.all([
   supabase.from('hr_v2_employees').select('*',{count:'exact',head:true}),
   supabase.from('hr_v2_employees').select('*',{count:'exact',head:true}).eq('status','active'),
   supabase.from('hr_v2_branches').select('*',{count:'exact',head:true}).eq('is_active',true),
   supabase.from('hr_v2_attendance').select('employee_id,check_in,check_out,schedule_exception_required,schedule_exception_approved').eq('work_date',todayDate),
   supabase.from('hr_v2_overtime').select('id').eq('approval_status','pending'),
   supabase.from('hr_v2_money_transactions').select('id').eq('approval_status','pending'),
   supabase.from('hr_v2_shift_closeouts').select('id,branch_id,work_date,expected_cash,actual_cash,visa_amount,wallet_amount,expenses').gte('work_date',from).lte('work_date',to),
   supabase.from('hr_v2_shift_closeouts').select('expected_cash,actual_cash,expenses').gte('work_date',prevFrom).lte('work_date',prevTo),
   supabase.from('hr_v2_branches').select('id,name').eq('is_active',true)
  ]);
  const z=co.data||[],prev=pc.data||[], bm=new Map((branches.data||[]).map((x:any)=>[x.id,x.name]));
  const sum=(rows:any[])=>rows.reduce((r,x)=>({cash:r.cash+Number(x.actual_cash||0),expected:r.expected+Number(x.expected_cash||0),diff:r.diff+Number(x.actual_cash||0)-Number(x.expected_cash||0),expenses:r.expenses+Number(x.expenses||0)}),{cash:0,expected:0,diff:0,expenses:0});
  const t=sum(z),pt=sum(prev),groups=new Map<string,any>();
  z.forEach((x:any)=>{const k=x.branch_id||'unknown';const r=groups.get(k)||{name:bm.get(k)||'غير محدد',count:0,cash:0,expenses:0,diff:0};r.count++;r.cash+=Number(x.actual_cash||0);r.expenses+=Number(x.expenses||0);r.diff+=Number(x.actual_cash||0)-Number(x.expected_cash||0);groups.set(k,r)});
  const branchRows=[...groups.values()].sort((a,b)=>Math.abs(b.diff)-Math.abs(a.diff)).slice(0,8);
  if(alive)setS({employees:emp.count||0,active:act.count||0,branches:br.count||0,attendance:att.data?.filter((x:any)=>x.check_in).length||0,missing:att.data?.filter((x:any)=>x.check_in&&!x.check_out).length||0,pendingAttendance:att.data?.filter((x:any)=>x.schedule_exception_required&&!x.schedule_exception_approved).length||0,pendingOT:ot.data?.length||0,pendingMoney:mt.data?.length||0,closeouts:z.length,cash:t.cash,expected:t.expected,diff:t.diff,visa:z.reduce((n,x)=>n+Number(x.visa_amount||0),0),wallet:z.reduce((n,x)=>n+Number(x.wallet_amount||0),0),expenses:t.expenses,prevCash:pt.cash,prevDiff:pt.diff,prevExpenses:pt.expenses,branchRows,deficits:z.filter(x=>Number(x.actual_cash||0)-Number(x.expected_cash||0)<-0.01).length});
  if(alive)setLoading(false);
 })();return()=>{alive=false}},[profile,from,to,todayDate,refresh]);
 if(profile.role==='employee')return <div dir="rtl"><div className="page-head"><div><h2>الرئيسية</h2><p>أهلاً {profile.full_name} — حسابك الوظيفي.</p></div></div><div className="stats-grid"><div className="stat-card"><Clock3 size={20}/><span>آخر حضور</span><strong>{s.attendance?'مسجل':'لا يوجد'}</strong></div><div className="stat-card"><WalletCards size={20}/><span>آخر إضافي</span><strong>{money(s.overtime)}</strong></div><div className="stat-card"><WalletCards size={20}/><span>آخر سلفة/خصم</span><strong>{money(s.advances)}</strong></div><div className="stat-card"><ClipboardCheck size={20}/><span>آخر صافي راتب</span><strong>{money(s.payroll)}</strong></div></div></div>;
 const change=(v:number,p:number)=>p===0?(v===0?0:100):((v-p)/Math.abs(p))*100;
 const cashChange=change(s.cash,s.prevCash),expChange=change(s.expenses,s.prevExpenses),diffChange=change(s.diff,s.prevDiff);
 const attention=[{n:s.pendingAttendance,label:'حضور خارج المواعيد يحتاج اعتماد',path:'/attendance'},{n:s.pendingOT,label:'إضافي يحتاج اعتماد',path:'/overtime'},{n:s.pendingMoney,label:'حركات مالية تحتاج اعتماد',path:'/money'},{n:s.missing,label:'موظفون بدون انصراف اليوم',path:'/attendance'},{n:s.deficits,label:'تقفيلات بها عجز',path:'/closeouts'}].filter(x=>x.n>0);
 return <div dir="rtl">
  <div className="page-head" style={{alignItems:'center'}}><div><h2>لوحة المالك التنفيذية</h2><p>مركز القرار والمتابعة — من البيانات إلى الإجراء.</p></div><button className="secondary" onClick={()=>setRefresh(x=>x+1)} disabled={loading}><RefreshCw size={17}/> {loading?'جاري التحديث':'تحديث البيانات'}</button></div>
  <div className="panel" style={{marginBottom:18}}><div style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'end',flexWrap:'wrap'}}><div><h3 style={{margin:'0 0 5px'}}>الفترة محل التحليل</h3><small>قارن الفترة الحالية بالفترة السابقة بنفس عدد الأيام.</small></div><div className="form-grid" style={{minWidth:320}}><label>من<input type="date" value={from} onChange={e=>setFrom(e.target.value)}/></label><label>إلى<input type="date" value={to} onChange={e=>setTo(e.target.value)}/></label></div></div></div>
  <div className="stats-grid"><div className="stat-card"><ClipboardCheck size={20}/><span>التقفيلات</span><strong>{s.closeouts}</strong></div><div className="stat-card"><WalletCards size={20}/><span>الكاش الفعلي</span><strong>{money(s.cash)}</strong><small>{cashChange>=0?'↑':'↓'} {Math.abs(cashChange).toFixed(1)}% عن السابق</small></div><div className="stat-card"><AlertTriangle size={20}/><span>العجز / الزيادة</span><strong>{money(s.diff)}</strong><small>{diffChange>=0?'↑':'↓'} {Math.abs(diffChange).toFixed(1)}% عن السابق</small></div><div className="stat-card"><TrendingDown size={20}/><span>مصروفات التقفيلات</span><strong>{money(s.expenses)}</strong><small>{expChange>=0?'↑':'↓'} {Math.abs(expChange).toFixed(1)}% عن السابق</small></div><div className="stat-card"><CheckCircle2 size={20}/><span>الموظفون النشطون</span><strong>{s.active}</strong><small>من إجمالي {s.employees}</small></div><div className="stat-card"><Building2 size={20}/><span>الفروع النشطة</span><strong>{s.branches}</strong></div></div>
  <div className="report-grid" style={{marginTop:18}}><div className="report-card" style={{gridColumn:'span 2'}}><div style={{display:'flex',justifyContent:'space-between'}}><div><h3>🚨 مركز المتابعة</h3><p>الحالات التي تحتاج قرار أو تدخل.</p></div><strong>{attention.reduce((n,x)=>n+x.n,0)} حالة</strong></div>{attention.length?<div style={{display:'grid',gap:8}}>{attention.map(x=><button key={x.label} className="secondary" onClick={()=>window.location.href=x.path} style={{display:'flex',justifyContent:'space-between',width:'100%'}}><span>{x.label}</span><strong>{x.n}</strong></button>)}</div>:<div style={{padding:18,textAlign:'center'}}><CheckCircle2 size={30}/><p>ممتاز — لا توجد حالات معلقة.</p></div>}</div><div className="report-card"><h3><Users size={18}/> الموارد البشرية</h3><p>{s.active} موظف نشط.</p><div style={{display:'grid',gap:6,marginTop:10}}><span>حضور اليوم: <b>{s.attendance}</b></span><span>بدون انصراف: <b>{s.missing}</b></span><span>اعتماد حضور: <b>{s.pendingAttendance}</b></span></div></div><div className="report-card"><h3>💳 التحصيل</h3><div style={{display:'grid',gap:6,marginTop:10}}><span>كاش: <b>{money(s.cash)}</b></span><span>Visa: <b>{money(s.visa)}</b></span><span>محافظ: <b>{money(s.wallet)}</b></span></div></div></div>
  <div className="panel" style={{marginTop:18}}><div className="page-head" style={{marginBottom:12}}><div><h3 style={{margin:0}}>🏢 أداء الفروع</h3><p>الفروع مرتبة حسب حجم الانحراف النقدي.</p></div></div><div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr><th style={{textAlign:'right',padding:10}}>الفرع</th><th style={{padding:10}}>التقفيلات</th><th style={{padding:10}}>الكاش</th><th style={{padding:10}}>المصروفات</th><th style={{padding:10}}>العجز / الزيادة</th><th style={{padding:10}}>الحالة</th></tr></thead><tbody>{s.branchRows.length?s.branchRows.map((r:any)=><tr key={r.name}><td style={{padding:10,fontWeight:700}}>{r.name}</td><td style={{padding:10,textAlign:'center'}}>{r.count}</td><td style={{padding:10,textAlign:'center'}}>{money(r.cash)}</td><td style={{padding:10,textAlign:'center'}}>{money(r.expenses)}</td><td style={{padding:10,textAlign:'center',fontWeight:700}}>{money(r.diff)}</td><td style={{padding:10,textAlign:'center'}}>{Math.abs(r.diff)<Math.max(1,r.cash)*.01?'جيد':'يحتاج متابعة'}</td></tr>):<tr><td colSpan={6} style={{padding:20,textAlign:'center'}}>لا توجد تقفيلات في الفترة.</td></tr>}</tbody></table></div></div>
 </div>;
}