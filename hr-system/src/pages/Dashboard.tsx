import {useEffect,useMemo,useState} from 'react';
import {AlertTriangle,ArrowDownRight,ArrowUpRight,Building2,CheckCircle2,Clock3,ClipboardCheck,RefreshCw,Timer,TrendingDown,TrendingUp,Users,WalletCards} from 'lucide-react';
import {supabase} from '../lib/supabase';
import type {Profile} from '../types';

const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Cairo'}).format(new Date());
const money=(v:any)=>Number(v||0).toLocaleString('ar-EG',{maximumFractionDigits:2})+' ج.م';
const num=(v:any)=>Number(v||0).toLocaleString('ar-EG',{maximumFractionDigits:1});
const daysBetween=(a:string,b:string)=>Math.max(1,Math.round((new Date(b).getTime()-new Date(a).getTime())/86400000)+1);
const shiftDate=(date:string,days:number)=>{const d=new Date(date+'T12:00:00');d.setDate(d.getDate()+days);return new Intl.DateTimeFormat('en-CA').format(d)};

type Closeout=any;
type Branch=any;

export default function Dashboard({profile}:{profile:Profile}){
 const[todayDate]=useState(today());
 const[from,setFrom]=useState(todayDate),[to,setTo]=useState(todayDate),[loading,setLoading]=useState(true),[refreshKey,setRefreshKey]=useState(0);
 const[s,setS]=useState<any>({employees:0,active:0,branches:0,attendance:0,missing:0,pendingOT:0,pendingMoney:0,deliveryHours:0,closeouts:0,expected:0,cash:0,diff:0,visa:0,wallet:0,expenses:0,prevCloseouts:0,prevDiff:0,prevExpenses:0,prevCash:0,branchRows:[],deficitRows:[],pendingAttendance:0});

 useEffect(()=>{let alive=true;(async()=>{setLoading(true);if(profile.role==='employee'){const [{data:a},{data:o},{data:m},{data:p}]=await Promise.all([supabase.from('hr_v2_attendance').select('*').eq('employee_id',profile.employee_id).order('work_date',{ascending:false}).limit(1),supabase.from('hr_v2_overtime').select('*').eq('employee_id',profile.employee_id).order('work_date',{ascending:false}).limit(1),supabase.from('hr_v2_money_transactions').select('*').eq('employee_id',profile.employee_id).order('transaction_date',{ascending:false}).limit(1),supabase.from('hr_v2_payroll').select('*').eq('employee_id',profile.employee_id).order('period_start',{ascending:false}).limit(1)]);if(alive){setS({attendance:a?.[0]?.work_date?1:0,overtime:Number(o?.[0]?.amount||0),advances:Number(m?.[0]?.amount||0),payroll:Number(p?.[0]?.net_salary||0)});setLoading(false)}return}
   const rangeDays=daysBetween(from,to);const prevTo=shiftDate(from,-1);const prevFrom=shiftDate(prevTo,-rangeDays+1);
   const [{count:employees},{count:active},{count:branches},{data:a},{data:o},{data:m},{data:del},{data:c},{data:pc},{data:b},{data:pa}]=await Promise.all([
    supabase.from('hr_v2_employees').select('*',{count:'exact',head:true}),
    supabase.from('hr_v2_employees').select('*',{count:'exact',head:true}).eq('status','active'),
    supabase.from('hr_v2_branches').select('*',{count:'exact',head:true}).eq('is_active',true),
    supabase.from('hr_v2_attendance').select('employee_id,check_in,check_out').eq('work_date',todayDate),
    supabase.from('hr_v2_overtime').select('id').eq('approval_status','pending'),
    supabase.from('hr_v2_money_transactions').select('id').eq('approval_status','pending'),
    supabase.from('hr_v2_employees').select('id').eq('is_delivery',true).eq('status','active'),
    supabase.from('hr_v2_shift_closeouts').select('id,branch_id,work_date,expected_cash,actual_cash,visa_amount,wallet_amount,expenses,cashier_name').gte('work_date',from).lte('work_date',to).order('work_date',{ascending:false}),
    supabase.from('hr_v2_shift_closeouts').select('work_date,expected_cash,actual_cash,expenses').gte('work_date',prevFrom).lte('work_date',prevTo),
    supabase.from('hr_v2_branches').select('id,name').eq('is_active',true),
    supabase.from('hr_v2_attendance').select('id').eq('approval_status','pending')
   ]);
   let deliveryHours=0;if(del?.length){const ids=del.map(x=>x.id);const{data:da}=await supabase.from('hr_v2_attendance').select('work_minutes').in('employee_id',ids).eq('work_date',todayDate);deliveryHours=(da||[]).reduce((n,x)=>n+Number(x.work_minutes||0),0)/60}
   const z:Closeout[]=c||[], prev:Closeout[]=pc||[], branchList:Branch[]=b||[];const branchMap=new Map(branchList.map(x=>[x.id,x.name]));
   const totals=(rows:Closeout[])=>({cash:rows.reduce((n,x)=>n+Number(x.actual_cash||0),0),expected:rows.reduce((n,x)=>n+Number(x.expected_cash||0),0),diff:rows.reduce((n,x)=>n+Number(x.actual_cash||0)-Number(x.expected_cash||0),0),expenses:rows.reduce((n,x)=>n+Number(x.expenses||0),0)});
   const t=totals(z),pt=totals(prev);const groups=new Map<string,{name:string,count:number,diff:number,cash:number,expenses:number}>();z.forEach(x=>{const key=x.branch_id||'unknown';const g=groups.get(key)||{name:branchMap.get(key)||'غير محدد',count:0,diff:0,cash:0,expenses:0};g.count++;g.diff+=Number(x.actual_cash||0)-Number(x.expected_cash||0);g.cash+=Number(x.actual_cash||0);g.expenses+=Number(x.expenses||0);groups.set(key,g)});
   const branchRows=[...groups.values()].sort((x,y)=>Math.abs(y.diff)-Math.abs(x.diff)).slice(0,6);const deficitRows=z.filter(x=>Number(x.actual_cash||0)-Number(x.expected_cash||0)<-0.01).map(x=>({...x,diff:Number(x.actual_cash||0)-Number(x.expected_cash||0),branchName:branchMap.get(x.branch_id)||'غير محدد'})).slice(0,6);
   if(alive)setS({employees:employees||0,active:active||0,branches:branches||0,attendance:(a||[]).filter(x=>x.check_in).length,missing:(a||[]).filter(x=>x.check_in&&!x.check_out).length,pendingOT:o?.length||0,pendingMoney:m?.length||0,pendingAttendance:pa?.length||0,deliveryHours,closeouts:z.length,expected:t.expected,cash:t.cash,diff:t.diff,visa:z.reduce((n,x)=>n+Number(x.visa_amount||0),0),wallet:z.reduce((n,x)=>n+Number(x.wallet_amount||0),0),expenses:t.expenses,prevCloseouts:prev.length,prevDiff:pt.diff,prevExpenses:pt.expenses,prevCash:pt.cash,branchRows,deficitRows});
   if(alive)setLoading(false);
  })();return()=>{alive=false}},[profile,from,to,todayDate,refreshKey]);

 const attention=useMemo(()=>[
  {n:s.pendingAttendance,label:'حضور يحتاج اعتماد',tone:'danger',path:'/attendance'},
  {n:s.pendingOT,label:'إضافي يحتاج اعتماد',tone:'warning',path:'/overtime'},
  {n:s.pendingMoney,label:'حركات مالية تحتاج اعتماد',tone:'warning',path:'/money'},
  {n:s.missing,label:'موظفون بدون انصراف اليوم',tone:'danger',path:'/attendance'},
  {n:s.deficitRows?.length||0,label:'تقفيلات بها عجز في الفترة',tone:'danger',path:'/closeouts'},
 ].filter(x=>x.n>0),[s]);
 const change=(current:number,previous:number)=>previous===0?(current===0?0:100):((current-previous)/Math.abs(previous))*100;
 if(profile.role==='employee')return <><div className="page-head"><div><h2>الرئيسية</h2><p>أهلاً {profile.full_name} — حسابك الوظيفي.</p></div></div><div className="stats-grid"><div className="stat-card"><Clock3 size={20}/><span>آخر حضور</span><strong>{s.attendance?'مسجل':'لا يوجد'}</strong></div><div className="stat-card"><Timer size={20}/><span>آخر إضافي</span><strong>{money(s.overtime)}</strong></div><div className="stat-card"><WalletCards size={20}/><span>آخر سلفة/خصم</span><strong>{money(s.advances)}</strong></div><div className="stat-card"><ClipboardCheck size={20}/><span>آخر صافي راتب</span><strong>{money(s.payroll)}</strong></div></div></>;
 const diffChange=change(s.diff,s.prevDiff),expenseChange=change(s.expenses,s.prevExpenses),cashChange=change(s.cash,s.prevCash);const health=s.closeouts===0?'لا توجد بيانات كافية':Math.abs(s.diff)<Math.max(1,s.cash)*0.01?'ممتاز':'يحتاج متابعة';
 return <div dir="rtl">
  <div className="page-head" style={{alignItems:'center'}}><div><h2>لوحة المالك التنفيذية</h2><p>مركز القرار والمتابعة — من البيانات إلى الإجراء.</p></div><button className="secondary" onClick={()=>setRefreshKey(x=>x+1)} disabled={loading}><RefreshCw size={17}/> {loading?'جاري التحديث':'تحديث البيانات'}</button></div>
  <div className="panel" style={{marginBottom:18}}><div style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'end',flexWrap:'wrap'}}><div><h3 style={{margin:'0 0 5px'}}>الفترة محل التحليل</h3><small>قارن أداء الفترة الحالية بالفترة السابقة بنفس عدد الأيام.</small></div><div className="form-grid" style={{minWidth:320}}><label>من<input type="date" value={from} onChange={e=>setFrom(e.target.value)}/></label><label>إلى<input type="date" value={to} onChange={e=>setTo(e.target.value)}/></label></div></div></div>
  <div className="stats-grid">
   <div className="stat-card"><ClipboardCheck size={20}/><span>التقفيلات</span><strong>{num(s.closeouts)}</strong><small>الفترة</small></div>
   <div className="stat-card"><WalletCards size={20}/><span>الكاش الفعلي</span><strong>{money(s.cash)}</strong><small>{cashChange>=0?'↑':'↓'} {Math.abs(cashChange).toFixed(1)}% عن الفترة السابقة</small></div>
   <div className="stat-card"><AlertTriangle size={20}/><span>العجز / الزيادة</span><strong>{money(s.diff)}</strong><small>{diffChange>=0?'↑':'↓'} {Math.abs(diffChange).toFixed(1)}% مقارنة بالسابق</small></div>
   <div className="stat-card"><TrendingDown size={20}/><span>المصروفات</span><strong>{money(s.expenses)}</strong><small>{expenseChange>=0?'↑':'↓'} {Math.abs(expenseChange).toFixed(1)}% عن السابق</small></div>
   <div className="stat-card"><CheckCircle2 size={20}/><span>صحة التقفيلات</span><strong>{health}</strong></div>
   <div className="stat-card"><Building2 size={20}/><span>الفروع النشطة</span><strong>{num(s.branches)}</strong></div>
  </div>

  <div className="report-grid" style={{marginTop:18}}>
   <div className="report-card" style={{gridColumn:'span 2'}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:10}}><div><h3>🚨 مركز المتابعة</h3><p>الأمور التي تحتاج قرار أو تدخل الآن.</p></div><strong>{attention.reduce((n,x)=>n+x.n,0)} حالة</strong></div>{attention.length===0?<div style={{padding:18,textAlign:'center'}}><CheckCircle2 size={30}/><p>ممتاز — لا توجد حالات معلقة تحتاج متابعة.</p></div>:<div style={{display:'grid',gap:8}}>{attention.map((x:any)=><button key={x.label} onClick={()=>window.location.href=x.path} className="secondary" style={{display:'flex',justifyContent:'space-between',alignItems:'center',width:'100%',textAlign:'right'}}><span>{x.label}</span><strong>{x.n}</strong></button>)}</div>}</div>
   <div className="report-card"><h3>👥 الموارد البشرية</h3><p>{s.active} موظف نشط من إجمالي {s.employees}.</p><div style={{marginTop:12,display:'grid',gap:6}}><span>حضور اليوم: <b>{s.attendance}</b></span><span>بدون انصراف: <b>{s.missing}</b></span><span>طلبات إضافي: <b>{s.pendingOT}</b></span></div></div>
   <div className="report-card"><h3>💳 التحصيل</h3><p>متابعة مصادر التحصيل خلال الفترة.</p><div style={{marginTop:12,display:'grid',gap:6}}><span>Visa: <b>{money(s.visa)}</b></span><span>محافظ: <b>{money(s.wallet)}</b></span><span>كاش: <b>{money(s.cash)}</b></span></div></div>
  </div>

  <div className="panel" style={{marginTop:18}}><div className="page-head" style={{marginBottom:12}}><div><h3 style={{margin:0}}>🏢 أداء الفروع</h3><p>أبرز الفروع حسب حجم الانحراف النقدي في الفترة.</p></div></div><div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr><th style={{textAlign:'right',padding:10}}>الفرع</th><th style={{padding:10}}>التقفيلات</th><th style={{padding:10}}>الكاش</th><th style={{padding:10}}>المصروفات</th><th style={{padding:10}}>العجز / الزيادة</th><th style={{padding:10}}>الحالة</th></tr></thead><tbody>{s.branchRows?.length?s.branchRows.map((r:any)=><tr key={r.name}><td style={{padding:10,fontWeight:700}}>{r.name}</td><td style={{padding:10,textAlign:'center'}}>{r.count}</td><td style={{padding:10,textAlign:'center'}}>{money(r.cash)}</td><td style={{padding:10,textAlign:'center'}}>{money(r.expenses)}</td><td style={{padding:10,textAlign:'center',fontWeight:700}}>{money(r.diff)}</td><td style={{padding:10,textAlign:'center'}}>{Math.abs(r.diff)<Math.max(1,r.cash)*0.01?'🟢 جيد':'🟠 يحتاج مراجعة'}</td></tr>):<tr><td colSpan={6} style={{padding:24,textAlign:'center'}}>لا توجد تقفيلات في الفترة.</td></tr>}</tbody></table></div></div>

  <div className="report-grid" style={{marginTop:18}}>
   <div className="report-card"><h3>⚠️ تقفيلات بها عجز</h3>{s.deficitRows?.length?<div style={{display:'grid',gap:8}}>{s.deficitRows.map((r:any)=><div key={r.id} style={{display:'flex',justifyContent:'space-between',gap:10,borderBottom:'1px solid #eee',paddingBottom:8}}><span>{r.branchName}<br/><small>{r.work_date}{r.cashier_name?' • '+r.cashier_name:''}</small></span><strong>{money(r.diff)}</strong></div>)}</div>:<p>لا توجد تقفيلات بعجز في الفترة.</p>}</div>
   <div className="report-card"><h3>📈 قراءة سريعة</h3><p>الفترة الحالية: <b>{s.closeouts}</b> تقفيلة مقابل <b>{s.prevCloseouts}</b> في الفترة السابقة.</p><p>العجز/الزيادة تغيره: <b>{diffChange>=0?'ارتفاع':'انخفاض'} {Math.abs(diffChange).toFixed(1)}%</b>.</p><p>المصروفات: <b>{expenseChange>=0?'ارتفعت':'انخفضت'} {Math.abs(expenseChange).toFixed(1)}%</b>.</p><p>استخدم هذه المؤشرات لتحديد الفرع أو العملية التي تحتاج مراجعة قبل النزول للتفاصيل.</p></div>
   <div className="report-card"><h3>⚡ إجراءات سريعة</h3><div style={{display:'grid',gap:8}}><button className="secondary" onClick={()=>window.location.href='/attendance'}><Clock3 size={17}/> مراجعة الحضور</button><button className="secondary" onClick={()=>window.location.href='/closeouts'}><ClipboardCheck size={17}/> مراجعة التقفيلات</button><button className="secondary" onClick={()=>window.location.href='/overtime'}><Timer size={17}/> اعتماد الإضافي</button><button className="secondary" onClick={()=>window.location.href='/reports'}><TrendingUp size={17}/> فتح التقارير</button></div></div>
  </div>
 </div>;
}
