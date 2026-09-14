import { useEffect, useState } from 'react';
import { ExternalLink, Save, X, Camera, WalletCards, ReceiptText, Calculator, Filter, Pencil, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types';

const cairo = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo' }).format(new Date());
const num = (v: unknown) => Number(v || 0);
const money = (v: unknown) => `${Number(v || 0).toLocaleString('ar-EG', { maximumFractionDigits: 2 })} ج.م`;
const emptyCustody = { previous_cash: '', expense_1: '', expense_2: '', expense_3: '', expense_4: '', expense_1_note: '', expense_2_note: '', expense_3_note: '', expense_4_note: '', cash_addition_1: '', cash_addition_2: '', cash_addition_3: '', cash_addition_4: '', cash_addition_1_note: '', cash_addition_2_note: '', cash_addition_3_note: '', cash_addition_4_note: '' };

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
    setEditing(null); setDate(cairo()); setBranch(''); setCashier(''); setShift(''); setExpected(''); setActual(''); setVisa(''); setWallet(''); setExpenses(''); setNotes(''); setFile(null); setFile2(null); setCustodyFile(null); setCustodyFile2(null); setCustody({ ...emptyCustody });
  }
  function startEdit(r: any) {
    if (!isOwner) return setErr('التعديل متاح للمالك فقط');
    const c = r.custody?.[0] || {};
    setErr(''); setMsg(''); setEditing(r); setDate(r.work_date || cairo()); setBranch(r.branch_id || ''); setCashier(r.cashier_employee_id || ''); setShift(r.shift_label || ''); setExpected(String(r.expected_cash ?? '')); setActual(String(r.actual_cash ?? '')); setVisa(String(r.visa_amount ?? '')); setWallet(String(r.wallet_amount ?? '')); setExpenses(String(r.expenses ?? '')); setNotes(r.notes || ''); setFile(null); setFile2(null); setCustodyFile(null); setCustodyFile2(null); setCustody({ ...emptyCustody, ...Object.fromEntries(Object.keys(emptyCustody).map(k => [k, c[k] ?? ''])) }); window.scrollTo({ top: 0, behavior: 'smooth' });
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
    for (const f of [file, file2, custodyFile, custodyFile2]) { if (f && !['image/jpeg', 'image/png', 'image/webp'].includes(f.type)) return setErr('ارفع صورة JPG أو PNG أو WebP'); if (f && f.size > 5 * 1024 * 1024) return setErr('حجم كل صورة يجب ألا يتجاوز 5 ميجا'); }
    setBusy(true); const paths: string[] = [];
    try {
      const u = (await supabase!.auth.getUser()).data.user?.id; if (!u) throw new Error('انتهت الجلسة');
      let paper1 = editing?.paper_image_path || null, paper2 = editing?.paper_image_path_2 || null, custody1 = editing?.custody?.[0]?.custody_image_path || null, custody2 = editing?.custody?.[0]?.custody_image_path_2 || null;
      if (file) { paper1 = await uploadFile(file, date); if (paper1) paths.push(paper1); }
      if (file2) { paper2 = await uploadFile(file2, date); if (paper2) paths.push(paper2); }
      if (custodyFile) { custody1 = await uploadFile(custodyFile, date); if (custody1) paths.push(custody1); }
      if (custodyFile2) { custody2 = await uploadFile(custodyFile2, date); if (custody2) paths.push(custody2); }
      const payload = { work_date: date, branch_id: branch || null, cashier_employee_id: cashier || null, shift_label: shift.trim() || null, paper_image_path: paper1, paper_image_path_2: paper2, expected_cash: num(expected), actual_cash: num(actual), visa_amount: num(visa), wallet_amount: num(wallet), expenses: num(expenses), notes: notes.trim() || null };
      let closeoutId = editing?.id;
      if (editing) { const { error } = await supabase!.from('hr_v2_shift_closeouts').update(payload).eq('id', editing.id); if (error) throw error; }
      else { const { data, error } = await supabase!.from('hr_v2_shift_closeouts').insert({ ...payload, closed_by: u }).select('id').single(); if (error) throw error; closeoutId = data.id; }
      const cp: any = { closeout_id: closeoutId, previous_cash: num(custody.previous_cash), expense_1: num(custody.expense_1), expense_2: num(custody.expense_2), expense_3: num(custody.expense_3), expense_4: num(custody.expense_4), expense_1_note: custody.expense_1_note.trim() || null, expense_2_note: custody.expense_2_note.trim() || null, expense_3_note: custody.expense_3_note.trim() || null, expense_4_note: custody.expense_4_note.trim() || null, cash_addition_1: num(custody.cash_addition_1), cash_addition_2: num(custody.cash_addition_2), cash_addition_3: num(custody.cash_addition_3), cash_addition_4: num(custody.cash_addition_4), cash_addition_1_note: custody.cash_addition_1_note.trim() || null, cash_addition_2_note: custody.cash_addition_2_note.trim() || null, cash_addition_3_note: custody.cash_addition_3_note.trim() || null, cash_addition_4_note: custody.cash_addition_4_note.trim() || null, custody_image_path: custody1, custody_image_path_2: custody2, created_by: u };
      const { error: ce } = await supabase!.from('hr_v2_shift_custody').upsert(cp, { onConflict: 'closeout_id' }); if (ce) throw ce;
      const old = editing ? [editing.paper_image_path, editing.paper_image_path_2, editing.custody?.[0]?.custody_image_path, editing.custody?.[0]?.custody_image_path_2] : [];
      if (editing) { const replaced = [file && old[0], file2 && old[1], custodyFile && old[2], custodyFile2 && old[3]].filter(Boolean) as string[]; if (replaced.length) await supabase!.storage.from('hr-v2-closeouts').remove(replaced); }
      setMsg(editing ? 'تم تعديل التقفيلة والعهدة بنجاح' : 'تم تقفيل الوردية وحفظ العهدة بنجاح'); resetForm(); await load();
    } catch (e: any) { if (paths.length) await supabase!.storage.from('hr-v2-closeouts').remove(paths); setErr(e.message || 'تعذر حفظ التقفيلة'); } finally { setBusy(false); }
  }
  async function removeCloseout(r: any) {
    if (!isOwner) return setErr('الحذف متاح للمالك فقط'); if (busy) return;
    if (!confirm(`حذف تقفيلة ${r.work_date} الخاصة بـ ${r.cashier?.full_name_ar || 'الموظف'}؟`)) return;
    setErr(''); setMsg(''); setBusy(true);
    try { const { error } = await supabase!.from('hr_v2_shift_closeouts').delete().eq('id', r.id); if (error) throw error; const paths = [r.paper_image_path, r.paper_image_path_2, r.custody?.[0]?.custody_image_path, r.custody?.[0]?.custody_image_path_2].filter(Boolean); if (paths.length) await supabase!.storage.from('hr-v2-closeouts').remove(paths); setMsg('تم حذف التقفيلة والعهدة بنجاح'); await load(); } catch (e: any) { setErr(e.message || 'تعذر حذف التقفيلة'); } finally { setBusy(false); }
  }
  async function openImage(path: string) { const { data, error } = await supabase!.storage.from('hr-v2-closeouts').createSignedUrl(path, 600); if (!error && data?.signedUrl) window.open(data.signedUrl, '_blank'); }

  const filtered = rows.filter(r => r.work_date >= from && r.work_date <= to);
  const totalExpected = filtered.reduce((n, r) => n + num(r.expected_cash), 0), totalActual = filtered.reduce((n, r) => n + num(r.actual_cash), 0), totalVisa = filtered.reduce((n, r) => n + num(r.visa_amount), 0), totalWallet = filtered.reduce((n, r) => n + num(r.wallet_amount), 0), totalExpenses = filtered.reduce((n, r) => n + num(r.expenses), 0), diff = totalActual - totalExpected;
  const input = (label: string, value: string, onChange: (v: string) => void, type = 'text') => <label className="co-field"><span>{label}</span><input type={type} value={value} onChange={e => onChange(e.target.value)} /></label>;
  const fileInput = (label: string, value: File | null, onChange: (f: File | null) => void, optional = false) => <label className="co-upload"><span><Camera size={16} />{label} {optional && <small>(اختياري)</small>}</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => onChange(e.target.files?.[0] || null)} /><b>{value ? value.name : 'اختيار صورة'}</b></label>;
  const expenseRow = (i: number) => <div className="co-line" key={`e${i}`}><div className="co-index">مصروف {i}</div><input aria-label={`مصروف ${i}`} type="number" min="0" placeholder="المبلغ" value={custody[`expense_${i}`]} onChange={e => setC(`expense_${i}`, e.target.value)} /><input aria-label={`بيان مصروف ${i}`} placeholder="بيان المصروف (اختياري)" value={custody[`expense_${i}_note`]} onChange={e => setC(`expense_${i}_note`, e.target.value)} /></div>;
  const additionRow = (i: number) => <div className="co-line" key={`a${i}`}><div className="co-index">إضافة {i}</div><input aria-label={`إضافة كاش ${i}`} type="number" min="0" placeholder="المبلغ" value={custody[`cash_addition_${i}`]} onChange={e => setC(`cash_addition_${i}`, e.target.value)} /><input aria-label={`بيان إضافة ${i}`} placeholder="بيان الإضافة (اختياري)" value={custody[`cash_addition_${i}_note`]} onChange={e => setC(`cash_addition_${i}_note`, e.target.value)} /></div>;

  return <div dir="rtl" className="closeouts-page">
    <style>{`
      .closeouts-page{--ink:#172033;--muted:#718096;--line:#e8edf4;--soft:#f7f9fc;--accent:#0f766e;--accent2:#0b5f59;max-width:1400px;margin:0 auto;padding:8px 4px 40px;color:var(--ink)}
      .co-hero{display:flex;justify-content:space-between;align-items:center;gap:16px;background:linear-gradient(135deg,#fff 0%,#f3fbfa 100%);border:1px solid var(--line);border-radius:22px;padding:22px 24px;margin-bottom:18px;box-shadow:0 8px 28px rgba(20,35,55,.05)}
      .co-hero h2{margin:0 0 6px;font-size:25px}.co-hero p{margin:0;color:var(--muted);font-size:13px}.co-badge{display:flex;align-items:center;gap:8px;background:#e7f6f3;color:var(--accent2);padding:10px 14px;border-radius:12px;font-weight:700;font-size:13px}
      .co-alert{border-radius:12px;padding:11px 14px;margin:0 0 14px;font-size:14px}.co-error{background:#fff1f2;color:#be123c;border:1px solid #fecdd3}.co-success{background:#ecfdf5;color:#047857;border:1px solid #a7f3d0}
      .co-card{background:#fff;border:1px solid var(--line);border-radius:20px;margin-bottom:18px;box-shadow:0 7px 24px rgba(20,35,55,.045);overflow:hidden}.co-card-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:17px 20px;border-bottom:1px solid var(--line);background:#fcfdff}.co-title{display:flex;align-items:center;gap:10px;font-weight:800;font-size:16px}.co-title svg{color:var(--accent)}.co-sub{font-size:12px;color:var(--muted);margin-top:3px}.co-card-body{padding:20px}
      .co-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}.co-field{display:flex;flex-direction:column;gap:7px;font-size:12px;font-weight:700;color:#475569}.co-field input,.co-field select,.co-line input,.co-notes{width:100%;box-sizing:border-box;border:1px solid #dbe2ea;border-radius:11px;background:#fff;padding:11px 12px;font:inherit;color:var(--ink);outline:none}.co-field input:focus,.co-field select:focus,.co-line input:focus,.co-notes:focus{border-color:#7abbb4;box-shadow:0 0 0 3px rgba(15,118,110,.08)}
      .co-money-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px}.co-money{border:1px solid var(--line);border-radius:15px;padding:14px;background:var(--soft)}.co-money label{display:block;font-size:12px;color:var(--muted);margin-bottom:7px;font-weight:700}.co-money input{width:100%;box-sizing:border-box;border:1px solid #dbe2ea;border-radius:10px;padding:10px;background:#fff;font-size:16px;font-weight:800}
      .co-section-note{font-size:12px;color:var(--muted);margin:0 0 14px}.co-custody-top{display:grid;grid-template-columns:1.2fr 1fr 1fr;gap:12px;margin-bottom:16px}.co-stat{border-radius:15px;padding:15px;background:var(--soft);border:1px solid var(--line)}.co-stat span{display:block;color:var(--muted);font-size:12px;margin-bottom:5px}.co-stat strong{font-size:20px}.co-stat.main{background:#effaf8;border-color:#ccece7}.co-stat.main strong{color:var(--accent2)}
      .co-columns{display:grid;grid-template-columns:1fr 1fr;gap:18px}.co-box{border:1px solid var(--line);border-radius:16px;padding:14px;background:#fff}.co-box h4{margin:0 0 12px;font-size:14px}.co-line{display:grid;grid-template-columns:80px 1fr 1.6fr;gap:8px;margin-bottom:8px}.co-line input{padding:9px 10px;font-size:13px}.co-index{display:flex;align-items:center;background:var(--soft);border-radius:10px;padding:0 10px;font-size:12px;font-weight:800;color:#475569}
      .co-uploads{display:grid;grid-template-columns:1fr 1fr;gap:12px}.co-upload{border:1px dashed #cbd5e1;border-radius:14px;padding:13px;background:#fbfcfe;cursor:pointer}.co-upload span{display:flex;align-items:center;gap:7px;font-size:12px;font-weight:800;margin-bottom:9px}.co-upload span svg{color:var(--accent)}.co-upload small{color:var(--muted);font-weight:500}.co-upload input{display:none}.co-upload b{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--muted);font-size:11px;font-weight:500}
      .co-actions{display:flex;justify-content:flex-end;gap:9px;margin-top:18px}.co-btn{border:0;border-radius:11px;padding:11px 17px;font-weight:800;display:inline-flex;align-items:center;justify-content:center;gap:7px;cursor:pointer}.co-primary{background:var(--accent);color:#fff}.co-primary:hover{background:var(--accent2)}.co-secondary{background:#eef2f7;color:#334155}.co-danger{background:#fff1f2;color:#be123c}.co-btn:disabled{opacity:.55;cursor:not-allowed}
      .co-filter{display:flex;align-items:end;gap:12px;flex-wrap:wrap}.co-filter .co-field{min-width:180px}.co-count{margin-right:auto;color:var(--muted);font-size:12px;font-weight:700}
      .co-kpis{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:10px;margin-bottom:18px}.co-kpi{background:#fff;border:1px solid var(--line);border-radius:15px;padding:13px}.co-kpi span{display:block;color:var(--muted);font-size:11px;margin-bottom:5px}.co-kpi strong{font-size:16px}
      .co-table-wrap{overflow:auto}.co-table{width:100%;border-collapse:separate;border-spacing:0;min-width:1000px}.co-table th,.co-table td{padding:12px 11px;border-bottom:1px solid var(--line);text-align:right;white-space:nowrap;font-size:12px}.co-table th{background:#f8fafc;color:#64748b;font-weight:800;position:sticky;top:0}.co-table tr:last-child td{border-bottom:0}.co-table td strong{font-size:13px}.co-pill{display:inline-flex;padding:5px 9px;border-radius:999px;background:#eef6f5;color:#0f766e;font-weight:800;font-size:11px}.co-mini-actions{display:flex;gap:6px}.co-mini{border:1px solid var(--line);background:#fff;border-radius:8px;padding:7px;cursor:pointer;display:inline-flex;align-items:center}.co-mini:hover{background:#f8fafc}.co-empty{text-align:center;padding:36px;color:var(--muted)}
      @media(max-width:1050px){.co-grid{grid-template-columns:repeat(2,1fr)}.co-money-grid{grid-template-columns:repeat(3,1fr)}.co-kpis{grid-template-columns:repeat(3,1fr)}}
      @media(max-width:700px){.closeouts-page{padding:4px 0 28px}.co-hero{border-radius:16px;padding:17px;align-items:flex-start}.co-hero h2{font-size:21px}.co-badge{display:none}.co-card{border-radius:16px}.co-card-head,.co-card-body{padding:14px}.co-grid,.co-money-grid,.co-custody-top,.co-columns,.co-uploads{grid-template-columns:1fr}.co-kpis{grid-template-columns:repeat(2,1fr)}.co-line{grid-template-columns:65px 1fr}.co-line input:last-child{grid-column:1/-1}.co-actions{flex-direction:column}.co-btn{width:100%}.co-filter{display:grid;grid-template-columns:1fr 1fr}.co-filter .co-field{min-width:0}.co-count{margin:0;grid-column:1/-1}}
    `}</style>

    <div className="co-hero"><div><h2>تقفيل الورديات</h2><p>إدارة تقفيلة كل وردية والعُهدة المرتبطة بها في شاشة واحدة مرتبة وواضحة.</p></div><div className="co-badge"><Calculator size={17} /> {editing ? 'وضع تعديل التقفيلة' : 'تقفيل وردية جديدة'}</div></div>

    {err && <div className="co-alert co-error">{err}</div>}{msg && <div className="co-alert co-success">{msg}</div>}

    <div className="co-card">
      <div className="co-card-head"><div><div className="co-title"><ReceiptText size={19} /> بيانات الوردية</div><div className="co-sub">حدد الوردية أولًا ثم أدخل أرقام التقفيلة.</div></div>{editing && <button className="co-btn co-secondary" onClick={resetForm}><X size={16}/> إلغاء التعديل</button>}</div>
      <div className="co-card-body">
        <div className="co-grid">
          {input('التاريخ', date, setDate, 'date')}
          <label className="co-field"><span>الفرع</span><select value={branch} onChange={e => setBranch(e.target.value)}><option value="">اختر الفرع</option>{branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></label>
          <label className="co-field"><span>موظف الكاشير</span><select value={cashier} onChange={e => setCashier(e.target.value)}><option value="">اختر الموظف</option>{employees.map(e => <option key={e.id} value={e.id}>{e.full_name_ar}</option>)}</select></label>
          <label className="co-field"><span>الوردية <small>(اختياري)</small></span><select value={shift} onChange={e => setShift(e.target.value)}><option value="">بدون تحديد</option><option value="صباحي">صباحي</option><option value="مغرب">مغرب</option><option value="الفجر">الفجر</option></select></label>
        </div>
      </div>
    </div>

    <div className="co-card">
      <div className="co-card-head"><div><div className="co-title"><WalletCards size={19}/> الحساب المالي</div><div className="co-sub">الأرقام الأساسية للتقفيلة في مكان واحد.</div></div></div>
      <div className="co-card-body"><div className="co-money-grid">
        <div className="co-money"><label>كاش سيستم</label><input type="number" min="0" value={expected} onChange={e => setExpected(e.target.value)} placeholder="0"/></div>
        <div className="co-money"><label>الكاش الفعلي</label><input type="number" min="0" value={actual} onChange={e => setActual(e.target.value)} placeholder="0"/></div>
        <div className="co-money"><label>الفيزا</label><input type="number" min="0" value={visa} onChange={e => setVisa(e.target.value)} placeholder="0"/></div>
        <div className="co-money"><label>تحويلات المحافظ</label><input type="number" min="0" value={wallet} onChange={e => setWallet(e.target.value)} placeholder="0"/></div>
        <div className="co-money"><label>مصروفات التقفيلة</label><input type="number" min="0" value={expenses} onChange={e => setExpenses(e.target.value)} placeholder="0"/></div>
      </div></div>
    </div>

    <div className="co-card">
      <div className="co-card-head"><div><div className="co-title"><WalletCards size={19}/> العُهدة</div><div className="co-sub">عهدة مستقلة لكل وردية. الخانات الإضافية اختيارية.</div></div></div>
      <div className="co-card-body">
        <div className="co-custody-top"><div className="co-stat"><span>كاش متبقي من الوردية السابقة</span><input className="co-notes" type="number" min="0" value={custody.previous_cash} onChange={e => setC('previous_cash', e.target.value)} placeholder="0"/></div><div className="co-stat"><span>إجمالي إضافات الكاش</span><strong>{money(custodyAdditions)}</strong></div><div className="co-stat"><span>إجمالي مصروفات العهدة</span><strong>{money(custodyExpenses)}</strong></div></div>
        <div className="co-stat main" style={{marginBottom:16}}><span>الكاش المتبقي بعد العهدة</span><strong>{money(remaining)}</strong></div>
        <div className="co-columns"><div className="co-box"><h4>المصروفات — حتى 4 إدخالات</h4>{[1,2,3,4].map(expenseRow)}</div><div className="co-box"><h4>إضافات الكاش — حتى 4 إدخالات</h4>{[1,2,3,4].map(additionRow)}</div></div>
      </div>
    </div>

    <div className="co-card">
      <div className="co-card-head"><div><div className="co-title"><Camera size={19}/> المستندات والصور</div><div className="co-sub">صورتان لورقة التقفيلة وصورتان للعهدة، بدون زحمة داخل النموذج.</div></div></div>
      <div className="co-card-body">
        <div className="co-uploads">{fileInput('صورة ورقة التقفيلة 1', file, setFile, !!editing)}{fileInput('صورة ورقة التقفيلة 2', file2, setFile2, true)}{fileInput('صورة العهدة 1', custodyFile, setCustodyFile, true)}{fileInput('صورة العهدة 2', custodyFile2, setCustodyFile2, true)}</div>
        <label className="co-field" style={{marginTop:14}}><span>ملاحظات</span><textarea className="co-notes" rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="أي ملاحظات تخص الوردية أو التقفيلة..."/></label>
        <div className="co-actions"><button className="co-btn co-primary" disabled={busy} onClick={save}><Save size={17}/>{busy ? 'جاري الحفظ...' : editing ? 'حفظ التعديل' : 'حفظ التقفيلة'}</button>{editing && <button className="co-btn co-secondary" onClick={resetForm}><X size={17}/> إلغاء</button>}</div>
      </div>
    </div>

    <div className="co-card">
      <div className="co-card-head"><div><div className="co-title"><Filter size={19}/> تقرير التقفيلات</div><div className="co-sub">فلترة ومراجعة التقفيلات المحفوظة.</div></div><span className="co-count">{filtered.length} تقفيلة</span></div>
      <div className="co-card-body">
        <div className="co-filter"><label className="co-field"><span>من تاريخ</span><input type="date" value={from} onChange={e => setFrom(e.target.value)}/></label><label className="co-field"><span>إلى تاريخ</span><input type="date" value={to} onChange={e => setTo(e.target.value)}/></label></div>
      </div>
    </div>

    <div className="co-kpis"><div className="co-kpi"><span>إجمالي كاش سيستم</span><strong>{money(totalExpected)}</strong></div><div className="co-kpi"><span>إجمالي الكاش الفعلي</span><strong>{money(totalActual)}</strong></div><div className="co-kpi"><span>إجمالي الفيزا</span><strong>{money(totalVisa)}</strong></div><div className="co-kpi"><span>إجمالي المحافظ</span><strong>{money(totalWallet)}</strong></div><div className="co-kpi"><span>إجمالي المصروفات</span><strong>{money(totalExpenses)}</strong></div><div className="co-kpi"><span>الفرق</span><strong>{money(diff)}</strong></div></div>

    <div className="co-card"><div className="co-card-body" style={{padding:0}}><div className="co-table-wrap"><table className="co-table"><thead><tr><th>التاريخ</th><th>الفرع</th><th>الكاشير</th><th>الوردية</th><th>المفروض</th><th>الفعلي</th><th>العهدة السابقة</th><th>المتبقي</th><th>المستندات</th>{isOwner && <th>الإجراءات</th>}</tr></thead><tbody>{filtered.length === 0 ? <tr><td colSpan={isOwner ? 10 : 9} className="co-empty">لا توجد تقفيلات في الفترة المحددة.</td></tr> : filtered.map(r => { const c = r.custody?.[0]; return <tr key={r.id}><td>{r.work_date}</td><td>{r.branch?.name || '—'}</td><td><strong>{r.cashier?.full_name_ar || '—'}</strong></td><td><span className="co-pill">{r.shift_label || '—'}</span></td><td>{money(r.expected_cash)}</td><td>{money(r.actual_cash)}</td><td>{money(c?.previous_cash)}</td><td>{money(c?.remaining_cash)}</td><td><div className="co-mini-actions">{r.paper_image_path && <button className="co-mini" title="ورقة التقفيلة 1" onClick={() => openImage(r.paper_image_path)}><ExternalLink size={14}/></button>}{r.paper_image_path_2 && <button className="co-mini" title="ورقة التقفيلة 2" onClick={() => openImage(r.paper_image_path_2)}><ExternalLink size={14}/></button>}{c?.custody_image_path && <button className="co-mini" title="صورة العهدة 1" onClick={() => openImage(c.custody_image_path)}><Camera size={14}/></button>}{c?.custody_image_path_2 && <button className="co-mini" title="صورة العهدة 2" onClick={() => openImage(c.custody_image_path_2)}><Camera size={14}/></button>}</div></td>{isOwner && <td><div className="co-mini-actions"><button className="co-mini" title="تعديل" onClick={() => startEdit(r)}><Pencil size={14}/></button><button className="co-mini co-danger" title="حذف" onClick={() => removeCloseout(r)}><Trash2 size={14}/></button></div></td>}</tr>; })}</tbody></table></div></div></div>
  </div>;
}
