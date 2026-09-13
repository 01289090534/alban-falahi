import { useEffect, useState } from 'react';
import { Clock3, LogIn, LogOut, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';

const statusAr: Record<string,string> = { present:'حاضر', late:'متأخر', absent:'غائب', leave:'إجازة', rest:'راحة', sick_leave:'إجازة مرضية', missing_checkout:'لم يسجل انصراف' };

export default function Attendance() {
  const [profile, setProfile] = useState<any>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [today, setToday] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function load() {
    if (!supabase) return;
    setLoading(true); setError('');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: account, error: accountError } = await supabase.from('hr_v2_accounts').select('id,full_name,role,employee_id,is_active').eq('id', user.id).maybeSingle();
    if (accountError || !account) { setError('تعذر تحميل حساب المستخدم'); setLoading(false); return; }
    setProfile(account);
    const cairoDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo' }).format(new Date());
    if (account.role === 'employee') {
      const { data } = await supabase.from('hr_v2_attendance').select('*').eq('employee_id', account.employee_id).eq('work_date', cairoDate).maybeSingle();
      setToday(data || null);
    } else {
      const { data } = await supabase.from('hr_v2_attendance').select('*').eq('work_date', cairoDate).order('check_in', { ascending: false });
      setRows(data || []);
      const { data: emps } = await supabase.from('hr_v2_employees').select('id,employee_no,full_name_ar,branch_id').order('full_name_ar');
      setEmployees(emps || []);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function checkIn() {
    if (!supabase || !profile?.employee_id) return;
    setBusy(true); setMessage(''); setError('');
    const cairoDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo' }).format(new Date());
    const { error: e } = await supabase.from('hr_v2_attendance').insert({ employee_id: profile.employee_id, work_date: cairoDate, check_in: new Date().toISOString(), check_out: null, late_minutes: 0, work_minutes: 0, overtime_minutes: 0, status: 'present' });
    if (e) setError(e.code === '23505' ? 'تم تسجيل الحضور بالفعل اليوم' : e.message);
    else { setMessage('تم تسجيل الحضور بنجاح'); await load(); }
    setBusy(false);
  }

  async function checkOut() {
    if (!supabase || !today) return;
    setBusy(true); setMessage(''); setError('');
    const { error: e } = await supabase.from('hr_v2_attendance').update({ check_out: new Date().toISOString() }).eq('id', today.id);
    if (e) setError(e.message); else { setMessage('تم تسجيل الانصراف بنجاح'); await load(); }
    setBusy(false);
  }

  if (loading) return <div className="panel"><div className="empty">جاري تحميل الحضور...</div></div>;
  if (profile?.role === 'employee') return <>
    <div className="page-head"><div><h2>الحضور والانصراف</h2><p>سجل حضورك وانصرافك لليوم.</p></div><button className="secondary" onClick={load}><RefreshCw size={17}/>تحديث</button></div>
    <div className="panel attendance-card"><div className="attendance-icon"><Clock3 size={32}/></div><h3>{profile.full_name}</h3><p className="muted">{today ? `تاريخ اليوم: ${today.work_date}` : 'لم يتم تسجيل حضور اليوم'}</p>
      <div className="attendance-times"><div><span>الحضور</span><b>{today?.check_in ? new Date(today.check_in).toLocaleTimeString('ar-EG',{hour:'2-digit',minute:'2-digit'}) : '—'}</b></div><div><span>الانصراف</span><b>{today?.check_out ? new Date(today.check_out).toLocaleTimeString('ar-EG',{hour:'2-digit',minute:'2-digit'}) : '—'}</b></div><div><span>الحالة</span><b>{today ? (statusAr[today.status] || today.status) : '—'}</b></div></div>
      {!today && <button className="primary big-action" disabled={busy} onClick={checkIn}><LogIn size={19}/>{busy?'جاري التسجيل...':'تسجيل الحضور'}</button>}
      {today && !today.check_out && <button className="primary big-action" disabled={busy} onClick={checkOut}><LogOut size={19}/>{busy?'جاري التسجيل...':'تسجيل الانصراف'}</button>}
      {today?.check_out && <div className="success">تم تسجيل حضور وانصراف اليوم.</div>}{message && <div className="success">{message}</div>}{error && <div className="error">{error}</div>}
    </div>
  </>;

  return <><div className="page-head"><div><h2>الحضور والانصراف</h2><p>متابعة حضور الموظفين اليوم.</p></div><button className="secondary" onClick={load}><RefreshCw size={17}/>تحديث</button></div>
    <div className="stats-grid"><div className="stat-card"><span>سجلات اليوم</span><strong>{rows.length}</strong></div><div className="stat-card"><span>حاضر</span><strong>{rows.filter(r=>r.status==='present').length}</strong></div><div className="stat-card"><span>متأخر</span><strong>{rows.filter(r=>r.status==='late').length}</strong></div><div className="stat-card"><span>بدون انصراف</span><strong>{rows.filter(r=>!r.check_out).length}</strong></div></div>
    <div className="panel table-wrap"><table><thead><tr><th>الموظف</th><th>التاريخ</th><th>الحضور</th><th>الانصراف</th><th>التأخير</th><th>الدقائق</th><th>الإضافي</th><th>الحالة</th></tr></thead><tbody>{rows.map(r=>{const e=employees.find(x=>x.id===r.employee_id);return <tr key={r.id}><td>{e?.full_name_ar || r.employee_id}</td><td>{r.work_date}</td><td>{r.check_in?new Date(r.check_in).toLocaleTimeString('ar-EG',{hour:'2-digit',minute:'2-digit'}):'—'}</td><td>{r.check_out?new Date(r.check_out).toLocaleTimeString('ar-EG',{hour:'2-digit',minute:'2-digit'}):'—'}</td><td>{r.late_minutes||0}</td><td>{r.work_minutes||0}</td><td>{r.overtime_minutes||0}</td><td>{statusAr[r.status]||r.status}</td></tr>})}</tbody></table>{!rows.length&&<div className="empty">لا توجد سجلات حضور اليوم.</div>}</div>
  </>;
}
