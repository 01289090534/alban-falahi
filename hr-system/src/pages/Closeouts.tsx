import { useEffect, useState } from 'react';
import { ExternalLink, Save, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types';

const cairo = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo' }).format(new Date());
const num = (v: unknown) => Number(v || 0);
const money = (v: unknown) => `${Number(v || 0).toLocaleString('ar-EG', { maximumFractionDigits: 2 })} ج.م`;
const emptyCustody = {
  previous_cash: '', expense_1: '', expense_2: '', expense_3: '', expense_4: '',
  expense_1_note: '', expense_2_note: '', expense_3_note: '', expense_4_note: '',
  cash_addition_1: '', cash_addition_2: '', cash_addition_3: '', cash_addition_4: '',
  cash_addition_1_note: '', cash_addition_2_note: '', cash_addition_3_note: '', cash_addition_4_note: '',
};

export default function Closeouts({ profile }: { profile: Profile }) {
  const [rows, setRows] = useState<any[]>([]), [employees, setEmployees] = useState<any[]>([]), [branches, setBranches] = useState<any[]>([]);
  const [date, setDate] = useState(cairo()), [branch, setBranch] = useState(''), [cashier, setCashier] = useState(''), [shift, setShift] = useState('');
  const [expected, setExpected] = useState(''), [actual, setActual] = useState(''), [visa, setVisa] = useState(''), [wallet, setWallet] = useState(''), [expenses, setExpenses] = useState(''), [notes, setNotes] = useState('');
  const [file, setFile] = useState<File | null>(null), [file2, setFile2] = useState<File | null>(null), [custodyFile, setCustodyFile] = useState<File | null>(null), [custodyFile2, setCustodyFile2] = useState<File | null>(null);
  const [busy, setBusy] = useState(false), [msg, setMsg] = useState(''), [err, setErr] = useState('');
  const [from, setFrom] = useState(cairo()), [to, setTo] = useState(cairo()), [editing, setEditing] = useState<any>(null);
  const [custody, setCustody] = useState<any>({ ...emptyCustody });
  const isOwner = profile.role === 'owner';

  async function load() {
    const [{ data: r }, { data: e }, { data: b }] = await Promise.all([
      supabase!.from('hr_v2_shift_closeouts').select('*,cashier:hr_v2_employees!cashier_employee_id(full_name_ar),branch:hr_v2_branches!branch_id(name),custody:hr_v2_shift_custody(*)').order('work_date', { ascending: false }).limit(300),
      supabase!.from('hr_v2_employees').select('id,full_name_ar').eq('status', 'active').order('full_name_ar'),
      supabase!.from('hr_v2_branches').select('id,name').eq('is_active', true).order('name'),
    ]);
    setRows(r || []); setEmployees(e || []); setBranches(b || []);
  }
  useEffect(() => { if (['admin', 'owner', 'accountant'].includes(profile.role)) load(); }, [profile.role]);

  function resetForm() {
    setEditing(null); setDate(cairo()); setBranch(''); setCashier(''); setShift(''); setExpected(''); setActual(''); setVisa(''); setWallet(''); setExpenses(''); setNotes('');
    setFile(null); setFile2(null); setCustodyFile(null); setCustodyFile2(null); setCustody({ ...emptyCustody });
  }
  function startEdit(r: any) {
    setErr(''); setMsg('');
    if (!isOwner) { setErr('التعديل متاح للمالك فقط'); return; }
    const c = r.custody?.[0] || {};
    setEditing(r); setDate(r.work_date || cairo()); setBranch(r.branch_id || ''); setCashier(r.cashier_employee_id || ''); setShift(r.shift_label || '');
    setExpected(String(r.expected_cash ?? '')); setActual(String(r.actual_cash ?? '')); setVisa(String(r.visa_amount ?? '')); setWallet(String(r.wallet_amount ?? '')); setExpenses(String(r.expenses ?? '')); setNotes(r.notes || '');
    setFile(null); setFile2(null); setCustodyFile(null); setCustodyFile2(null);
    setCustody({ ...emptyCustody, ...Object.fromEntries(Object.keys(emptyCustody).map(k => [k, c[k] ?? ''])) });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  const setC = (k: string, v: string) => setCustody((x: any) => ({ ...x, [k]: v }));
  const custodyExpenses = [1, 2, 3, 4].reduce((s, i) => s + num(custody[`expense_${i}`]), 0);
  const custodyAdditions = [1, 2, 3, 4].reduce((s, i) => s + num(custody[`cash_addition_${i}`]), 0);
  const remaining = num(custody.previous_cash) + custodyAdditions - custodyExpenses;

  async function uploadFile(f: File | null, baseDate: string) {
    if (!f) return null;
    const ext = f.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `${baseDate}/${crypto.randomUUID()}.${ext}`;
    const up = await supabase!.storage.from('hr-v2-closeouts').upload(path, f, { contentType: f.type, upsert: false });
    if (up.error) throw up.error;
    return path;
  }

  async function save() {
    setErr(''); setMsg('');
    if (editing && !isOwner) return setErr('التعديل متاح للمالك فقط');
    if (!file && !editing) return setErr('ارفع صورة ورقة التقفيلة');
    for (const f of [file, file2, custodyFile, custodyFile2]) {
      if (f && !['image/jpeg', 'image/png', 'image/webp'].includes(f.type)) return setErr('ارفع صورة JPG أو PNG أو WebP');
      if (f && f.size > 5 * 1024 * 1024) return setErr('حجم كل صورة يجب ألا يتجاوز 5 ميجا');
    }
    setBusy(true); const paths: string[] = [];
    try {
      const u = (await supabase!.auth.getUser()).data.user?.id;
      if (!u) throw new Error('انتهت الجلسة');
      let paper1 = editing?.paper_image_path || null, paper2 = editing?.paper_image_path_2 || null;
      let custody1 = editing?.custody?.[0]?.custody_image_path || null, custody2 = editing?.custody?.[0]?.custody_image_path_2 || null;
      if (file) { paper1 = await uploadFile(file, date); if (paper1) paths.push(paper1); }
      if (file2) { paper2 = await uploadFile(file2, date); if (paper2) paths.push(paper2); }
      if (custodyFile) { custody1 = await uploadFile(custodyFile, date); if (custody1) paths.push(custody1); }
      if (custodyFile2) { custody2 = await uploadFile(custodyFile2, date); if (custody2) paths.push(custody2); }
      const payload = { work_date: date, branch_id: branch || null, cashier_employee_id: cashier || null, shift_label: shift.trim() || null, paper_image_path: paper1, paper_image_path_2: paper2, expected_cash: num(expected), actual_cash: num(actual), visa_amount: num(visa), wallet_amount: num(wallet), expenses: num(expenses), notes: notes.trim() || null };
      let closeoutId = editing?.id;
      if (editing) {
        const { error } = await supabase!.from('hr_v2_shift_closeouts').update(payload).eq('id', editing.id); if (error) throw error;
      } else {
        const { data, error } = await supabase!.from('hr_v2_shift_closeouts').insert({ ...payload, closed_by: u }).select('id').single(); if (error) throw error; closeoutId = data.id;
      }
      const cp: any = { closeout_id: closeoutId, previous_cash: num(custody.previous_cash), expense_1: num(custody.expense_1), expense_2: num(custody.expense_2), expense_3: num(custody.expense_3), expense_4: num(custody.expense_4), expense_1_note: custody.expense_1_note.trim() || null, expense_2_note: custody.expense_2_note.trim() || null, expense_3_note: custody.expense_3_note.trim() || null, expense_4_note: custody.expense_4_note.trim() || null, cash_addition_1: num(custody.cash_addition_1), cash_addition_2: num(custody.cash_addition_2), cash_addition_3: num(custody.cash_addition_3), cash_addition_4: num(custody.cash_addition_4), cash_addition_1_note: custody.cash_addition_1_note.trim() || null, cash_addition_2_note: custody.cash_addition_2_note.trim() || null, cash_addition_3_note: custody.cash_addition_3_note.trim() || null, cash_addition_4_note: custody.cash_addition_4_note.trim() || null, custody_image_path: custody1, custody_image_path_2: custody2, created_by: u };
      const { error: ce } = await supabase!.from('hr_v2_shift_custody').upsert(cp, { onConflict: 'closeout_id' }); if (ce) throw ce;
      if (editing && file && editing.paper_image_path) await supabase!.storage.from('hr-v2-closeouts').remove([editing.paper_image_path]);
      if (editing && file2 && editing.paper_image_path_2) await supabase!.storage.from('hr-v2-closeouts').remove([editing.paper_image_path_2]);
      if (editing && custodyFile && editing.custody?.[0]?.custody_image_path) await supabase!.storage.from('hr-v2-closeouts').remove([editing.custody[0].custody_image_path]);
      if (editing && custodyFile2 && editing.custody?.[0]?.custody_image_path_2) await supabase!.storage.from('hr-v2-closeouts').remove([editing.custody[0].custody_image_path_2]);
      setMsg(editing ? 'تم تعديل التقفيلة والعهدة بنجاح' : 'تم تقفيل الوردية وحفظ العهدة بنجاح'); resetForm(); await load();
    } catch (e: any) { if (paths.length) await supabase!.storage.from('hr-v2-closeouts').remove(paths); setErr(e.message || 'تعذر حفظ التقفيلة'); }
    finally { setBusy(false); }
  }

  async function removeCloseout(r: any) {
    setErr(''); setMsg(''); if (!isOwner) return setErr('الحذف متاح للمالك فقط'); if (busy) return;
    if (!confirm(`حذف تقفيلة ${r.work_date} الخاصة بـ ${r.cashier?.full_name_ar || 'الموظف'}؟`)) return;
    setBusy(true);
    try {
      const { error } = await supabase!.from('hr_v2_shift_closeouts').delete().eq('id', r.id); if (error) throw error;
      const paths = [r.paper_image_path, r.paper_image_path_2, r.custody?.[0]?.custody_image_path, r.custody?.[0]?.custody_image_path_2].filter(Boolean);
      if (paths.length) await supabase!.storage.from('hr-v2-closeouts').remove(paths);
      setMsg('تم حذف التقفيلة والعهدة بنجاح'); await load();
    } catch (e: any) { setErr(e.message || 'تعذر حذف التقفيلة'); } finally { setBusy(false); }
  }
  async function openImage(path: string) {
    const { data, error } = await supabase!.storage.from('hr-v2-closeouts').createSignedUrl(path, 600);
    if (!error && data?.signedUrl) window.open(data.signedUrl, '_blank');
  }

  const filtered = rows.filter(r => r.work_date >= from && r.work_date <= to);
  const totalExpected = filtered.reduce((n, r) => n + num(r.expected_cash), 0), totalActual = filtered.reduce((n, r) => n + num(r.actual_cash), 0), totalVisa = filtered.reduce((n, r) => n + num(r.visa_amount), 0), totalWallet = filtered.reduce((n, r) => n + num(r.wallet_amount), 0), totalExpenses = filtered.reduce((n, r) => n + num(r.expenses), 0), diff = totalActual - totalExpected;
  const input = (label: string, value: string, onChange: (v: string) => void, type = 'text') => <label>{label}<input type={type} value={value} onChange={e => onChange(e.target.value)} /></label>;

  return <>
    <div className="page-head"><div><h2>تقفيل الورديات</h2><p>كل وردية لها تقفيلة وعهدة مستقلة، مع مقارنة المفروض بالفعلي وتحليل وسائل الدفع.</p></div></div>
    <div className="panel">
      <h3>{editing ? 'تعديل تقفيلة الوردية' : 'تقفيل وردية جديدة'}</h3>
      <div className="form-grid">
        {input('التاريخ', date, setDate, 'date')}
        <label>الفرع<select value={branch} onChange={e => setBranch(e.target.value)}><option value="">اختر الفرع</option>{branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></label>
        <label>موظف الكاشير<select value={cashier} onChange={e => setCashier(e.target.value)}><option value="">اختر الموظف</option>{employees.map(e => <option key={e.id} value={e.id}>{e.full_name_ar}</option>)}</select></label>
        <label>اسم الوردية <span className="hint">(اختياري)</span><select value={shift} onChange={e => setShift(e.target.value)}><option value="">بدون تحديد</option><option value="صباحي">صباحي</option><option value="مغرب">مغرب</option><option value="الفجر">الفجر</option></select></label>
        {input('كاش سيتيم', expected, setExpected, 'number')}{input('الكاش الفعلي', actual, setActual, 'number')}{input('الفيزا', visa, setVisa, 'number')}{input('تحويلات المحافظ', wallet, setWallet, 'number')}{input('المصروفات', expenses, setExpenses, 'number')}
        <label>صورة ورقة التقفيلة 1 {editing && <span className="hint">(اختياري عند التعديل)</span>}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => setFile(e.target.files?.[0] || null)} /></label>
        <label>صورة ورقة التقفيلة 2 <span className="hint">(اختياري)</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => setFile2(e.target.files?.[0] || null)} /></label>
      </div>
      <label>ملاحظات<textarea value={notes} onChange={e => setNotes(e.target.value)} /></label>

      <div className="panel" style={{ marginTop: 16 }}>
        <h3>💰 العهدة — تقفل مع كل وردية</h3>
        <p className="hint">الإدخالات كلها اختيارية. الباقي = كاش باقي من السابق + إضافة الكاش − إجمالي المصاريف.</p>
        <div className="form-grid">
          {input('كاش باقي من السابق', custody.previous_cash, v => setC('previous_cash', v), 'number')}
          <label>إجمالي المصاريف<strong style={{ display: 'block', padding: 10 }}>{money(custodyExpenses)}</strong></label>
          <label>إجمالي إضافة الكاش<strong style={{ display: 'block', padding: 10 }}>{money(custodyAdditions)}</strong></label>
          <label>كاش باقي / العهدة الحالية<strong style={{ display: 'block', padding: 10 }}>{money(remaining)}</strong></label>
        </div>
        <h4>المصاريف — حتى 4 إدخالات</h4>
        <div className="form-grid">{[1,2,3,4].map(i => <div key={`e${i}`}><label>مصروف {i} <span className="hint">(اختياري)</span><input type="number" min="0" step="0.01" value={custody[`expense_${i}`]} onChange={e => setC(`expense_${i}`, e.target.value)} /></label><label>بيان مصروف {i}<input value={custody[`expense_${i}_note`]} onChange={e => setC(`expense_${i}_note`, e.target.value)} /></label></div>)}</div>
        <h4>إضافة كاش — حتى 4 إدخالات</h4>
        <div className="form-grid">{[1,2,3,4].map(i => <div key={`a${i}`}><label>إضافة كاش {i} <span className="hint">(اختياري)</span><input type="number" min="0" step="0.01" value={custody[`cash_addition_${i}`]} onChange={e => setC(`cash_addition_${i}`, e.target.value)} /></label><label>بيان إضافة {i}<input value={custody[`cash_addition_${i}_note`]} onChange={e => setC(`cash_addition_${i}_note`, e.target.value)} /></label></div>)}</div>
        <div className="form-grid">
          <label>📷 صورة العهدة 1 <span className="hint">(اختياري)</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => setCustodyFile(e.target.files?.[0] || null)} /></label>
          <label>📷 صورة العهدة 2 <span className="hint">(اختياري)</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => setCustodyFile2(e.target.files?.[0] || null)} /></label>
        </div>
      </div>
      {err && <div className="error">{err}</div>}{msg && <div className="success">{msg}</div>}
      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}><button className="primary" onClick={save} disabled={busy}><Save size={17} /> {busy ? 'جاري الحفظ...' : editing ? 'حفظ التعديل' : 'حفظ التقفيلة'}</button>{editing && <button onClick={resetForm}><X size={17} /> إلغاء</button>}</div>
    </div>

    <div className="panel">
      <h3>تقرير التقفيلات</h3>
      <div className="form-grid">{input('من', from, setFrom, 'date')}{input('إلى', to, setTo, 'date')}</div>
      <div className="stats-grid"><div>المفروض<strong>{money(totalExpected)}</strong></div><div>الفعلي<strong>{money(totalActual)}</strong></div><div>الفيزا<strong>{money(totalVisa)}</strong></div><div>المحافظ<strong>{money(totalWallet)}</strong></div><div>المصروفات<strong>{money(totalExpenses)}</strong></div><div>الفرق<strong>{money(diff)}</strong></div></div>
      <div style={{ overflowX: 'auto' }}><table><thead><tr><th>التاريخ</th><th>الفرع</th><th>الكاشير</th><th>الوردية</th><th>المفروض</th><th>الفعلي</th><th>العهدة</th><th>الصور</th><th>إجراءات</th></tr></thead><tbody>
        {filtered.map(r => { const c = r.custody?.[0]; const paper = [r.paper_image_path, r.paper_image_path_2].filter(Boolean).length; const custodyImages = [c?.custody_image_path, c?.custody_image_path_2].filter(Boolean); return <tr key={r.id}><td>{r.work_date}</td><td>{r.branch?.name || '-'}</td><td>{r.cashier?.full_name_ar || '-'}</td><td>{r.shift_label || '-'}</td><td>{money(r.expected_cash)}</td><td>{money(r.actual_cash)}</td><td>{c ? `${money(c.previous_cash)} ← ${money(c.remaining_cash)}` : '-'}</td><td><div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{paper > 0 && <button onClick={() => openImage(r.paper_image_path)}><ExternalLink size={15} /> ورقة 1</button>}{r.paper_image_path_2 && <button onClick={() => openImage(r.paper_image_path_2)}><ExternalLink size={15} /> ورقة 2</button>}{custodyImages.map((p: string, i: number) => <button key={p} onClick={() => openImage(p)}><ExternalLink size={15} /> عهدة {i + 1}</button>)}</div></td><td><div style={{ display: 'flex', gap: 6 }}>{isOwner && <><button onClick={() => startEdit(r)}>تعديل</button><button className="danger" onClick={() => removeCloseout(r)}>حذف</button></>}</div></td></tr>; })}
        {!filtered.length && <tr><td colSpan={9}>لا توجد تقفيلات في الفترة المحددة.</td></tr>}
      </tbody></table></div>
    </div>
  </>;
}
