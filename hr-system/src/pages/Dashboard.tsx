import {useEffect,useState} from 'react';
import {Clock3,WalletCards,ReceiptText,Timer} from 'lucide-react';
import {supabase} from '../lib/supabase';
import type {Profile} from '../types';

export default function Dashboard({profile}:{profile:Profile}){
  const [s,setS]=useState({employees:0,active:0,branches:0,attendance:0,overtime:0,advances:0,payroll:0});
  useEffect(()=>{(async()=>{if(!supabase)return;
    if(profile.role==='employee'){
      const [{data:a},{data:o},{data:m},{data:p}]=await Promise.all([
        supabase.from('hr_v2_attendance').select('*').eq('employee_id',profile.employee_id).order('work_date',{ascending:false}).limit(1),
        supabase.from('hr_v2_overtime').select('*').eq('employee_id',profile.employee_id).order('work_date',{ascending:false}).limit(1),
        supabase.from('hr_v2_money_transactions').select('*').eq('employee_id',profile.employee_id).order('transaction_date',{ascending:false}).limit(1),
        supabase.from('hr_v2_payroll').select('*').eq('employee_id',profile.employee_id).order('period_start',{ascending:false}).limit(1)
      ]);
      setS(x=>({...x,attendance:a?.[0]?.work_date?1:0,overtime:Number(o?.[0]?.amount||0),advances:Number(m?.[0]?.amount||0),payroll:Number(p?.[0]?.net_salary||0)}));
      return;
    }
    const[{count:employees},{count:active},{count:branches}]=await Promise.all([
      supabase.from('hr_v2_employees').select('*',{count:'exact',head:true}),
      supabase.from('hr_v2_employees').select('*',{count:'exact',head:true}).eq('status','active'),
      supabase.from('hr_v2_branches').select('*',{count:'exact',head:true}).eq('is_active',true)
    ]);
    setS(x=>({...x,employees:employees||0,active:active||0,branches:branches||0}));
  })()},[profile]);

  if(profile.role==='employee') return <><div className="page-head"><div><h2>الرئيسية</h2><p>أهلاً {profile.full_name} — حسابك الوظيفي.</p></div></div><div className="stats-grid"><div className="stat-card"><Clock3 size={20}/><span>آخر حضور</span><strong>{s.attendance?'مسجل':'لا يوجد'}</strong></div><div className="stat-card"><Timer size={20}/><span>آخر إضافي</span><strong>{s.overtime.toLocaleString('ar-EG')} ج.م</strong></div><div className="stat-card"><WalletCards size={20}/><span>آخر سلفة/خصم</span><strong>{s.advances.toLocaleString('ar-EG')} ج.م</strong></div><div className="stat-card"><ReceiptText size={20}/><span>آخر صافي راتب</span><strong>{s.payroll.toLocaleString('ar-EG')} ج.م</strong></div></div></>;

  return <><div className="page-head"><div><h2>الرئيسية</h2><p>أهلاً {profile.full_name} — نظرة سريعة على الموارد البشرية.</p></div></div><div className="stats-grid"><div className="stat"><span>عدد الموظفين</span><strong>{s.employees}</strong></div><div className="stat"><span>الموظفون النشطون</span><strong>{s.active}</strong></div><div className="stat"><span>الفروع</span><strong>{s.branches}</strong></div></div></>;
}
