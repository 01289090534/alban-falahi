import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, ChevronLeft, RefreshCw, ShieldAlert } from 'lucide-react';
import { supabase } from '../lib/supabase';

const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo' }).format(new Date());
const money = (v: any) => Number(v || 0).toLocaleString('ar-EG', { maximumFractionDigits: 2 }) + ' ج.م';
const time = (v: any) => v ? new Date(v).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Cairo' }) : '—';

type Item = {
  id: string;
  title: string;
  detail: string;
  count: number;
  level: 'high' | 'medium';
  path: string;
  records: any[];
};

export default function Notifications() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      const d = today();

      const [attendanceRes, overtimeRes, moneyRes, closeoutsRes, custodyRes, openRes] = await Promise.all([
        supabase.from('hr_v2_attendance')
          .select('id,employee_id,work_date,check_in,check_out,schedule_exception_required,schedule_exception_approved')
          .eq('schedule_exception_required', true)
          .eq('schedule_exception_approved', false)
          .order('work_date', { ascending: false }),
        supabase.from('hr_v2_overtime')
          .select('id,employee_id,work_date,hours,amount,reason')
          .eq('approval_status', 'pending')
          .order('work_date', { ascending: false }),
        supabase.from('hr_v2_money_transactions')
          .select('id,employee_id,transaction_date,type,amount,reason')
          .eq('approval_status', 'pending')
          .order('transaction_date', { ascending: false }),
        supabase.from('hr_v2_shift_closeouts')
          .select('id,branch_id,work_date,shift_label,cashier_employee_id,expected_cash,actual_cash,paper_image_path,paper_image_path_2')
          .order('work_date', { ascending: false })
          .limit(300),
        supabase.from('hr_v2_shift_custody')
          .select('id,closeout_id,custody_image_path,custody_image_path_2')
          .limit(300),
        supabase.from('hr_v2_attendance')
          .select('id,employee_id,work_date,check_in')
          .eq('work_date', d)
          .not('check_in', 'is', null)
          .is('check_out', null),
      ]);

      if (!alive) return;

      const attendance = attendanceRes.data || [];
      const overtime = overtimeRes.data || [];
      const moneyRows = moneyRes.data || [];
      const closeouts = closeoutsRes.data || [];
      const custody = custodyRes.data || [];
      const open = openRes.data || [];

      const employeeIds = [...new Set([
        ...attendance.map((x: any) => x.employee_id),
        ...overtime.map((x: any) => x.employee_id),
        ...moneyRows.map((x: any) => x.employee_id),
        ...open.map((x: any) => x.employee_id),
      ].filter(Boolean))];

      const employeesRes = employeeIds.length
        ? await supabase.from('hr_v2_employees').select('id,full_name_ar,branch_id,position').in('id', employeeIds)
        : { data: [] };
      const employees = employeesRes.data || [];
      const branchesRes = await supabase.from('hr_v2_branches').select('id,name');
      const branches = branchesRes.data || [];

      const employeeMap = new Map<string, any>(employees.map((x: any) => [x.id, x]));
      const branchMap = new Map<string, string>(branches.map((x: any) => [x.id, x.name]));
      const list: Item[] = [];

      const names = (rows: any[]) => rows.slice(0, 8).map((x: any) => employeeMap.get(x.employee_id)?.full_name_ar || 'موظف');

      if (attendance.length) {
        list.push({
          id: 'attendance',
          title: 'حضور خارج المواعيد يحتاج اعتماد',
          detail: `${attendance.length} سجلًا يحتاج موافقة قبل احتساب الساعات. ${names(attendance).join('، ')}`,
          count: attendance.length,
          level: 'high',
          path: '/attendance',
          records: attendance,
        });
      }

      if (overtime.length) {
        list.push({
          id: 'overtime',
          title: 'إضافي يحتاج اعتماد',
          detail: `${overtime.length} طلبًا معلّقًا. ${names(overtime).join('، ')}`,
          count: overtime.length,
          level: 'medium',
          path: '/overtime',
          records: overtime,
        });
      }

      if (moneyRows.length) {
        list.push({
          id: 'money',
          title: 'حركات مالية تحتاج اعتماد',
          detail: `${moneyRows.length} حركة معلّقة. ${names(moneyRows).join('، ')}`,
          count: moneyRows.length,
          level: 'medium',
          path: '/money',
          records: moneyRows,
        });
      }

      const deficits = closeouts.filter((x: any) => Number(x.actual_cash || 0) - Number(x.expected_cash || 0) < -0.01);
      if (deficits.length) {
        list.push({
          id: 'deficit',
          title: 'تقفيلات بها عجز',
          detail: `${deficits.length} تقفيلة بها عجز وتحتاج مراجعة المالك.`,
          count: deficits.length,
          level: 'high',
          path: '/closeouts',
          records: deficits,
        });
      }

      const missingPaper = closeouts.filter((x: any) => !x.paper_image_path && !x.paper_image_path_2);
      if (missingPaper.length) {
        list.push({
          id: 'paper',
          title: 'تقفيلات بدون صورة ورقة',
          detail: `${missingPaper.length} تقفيلة تحتاج رفع المستند.`,
          count: missingPaper.length,
          level: 'medium',
          path: '/closeouts',
          records: missingPaper,
        });
      }

      const custodyMap = new Map<string, any>(custody.map((x: any) => [x.closeout_id, x]));
      const missingCustody = closeouts.filter((x: any) => !custodyMap.has(x.id));
      if (missingCustody.length) {
        list.push({
          id: 'custody',
          title: 'تقفيلات بدون سجل عهدة',
          detail: `${missingCustody.length} تقفيلة تحتاج إنشاء العهدة.`,
          count: missingCustody.length,
          level: 'medium',
          path: '/closeouts',
          records: missingCustody,
        });
      }

      const missingCustodyPhoto = closeouts.filter((x: any) => {
        const c = custodyMap.get(x.id);
        return c && !c.custody_image_path && !c.custody_image_path_2;
      });
      if (missingCustodyPhoto.length) {
        list.push({
          id: 'custody-photo',
          title: 'عهد بدون صورة',
          detail: `${missingCustodyPhoto.length} عهدة تحتاج صورة مستند.`,
          count: missingCustodyPhoto.length,
          level: 'medium',
          path: '/closeouts',
          records: missingCustodyPhoto,
        });
      }

      if (open.length) {
        list.push({
          id: 'checkout',
          title: 'موظفون بدون انصراف اليوم',
          detail: `${open.length} حضور مفتوح حتى الآن. ${names(open).join('، ')}`,
          count: open.length,
          level: 'high',
          path: '/attendance',
          records: open,
        });
      }

      const employeeIssues = new Map<string, number>();
      [...attendance, ...overtime, ...open].forEach((row: any) => {
        if (row.employee_id) employeeIssues.set(row.employee_id, (employeeIssues.get(row.employee_id) || 0) + 1);
      });

      const criticalEmployees = employees
        .filter((e: any) => (employeeIssues.get(e.id) || 0) >= 3)
        .sort((a: any, b: any) => (employeeIssues.get(b.id) || 0) - (employeeIssues.get(a.id) || 0));

      if (criticalEmployees.length) {
        list.push({
          id: 'critical-employees',
          title: 'تنبيه حرج: موظفون لديهم تكرار مشاكل',
          detail: `${criticalEmployees.length} موظفًا لديهم 3 حالات أو أكثر من الحضور خارج الموعد أو الإضافي المعلّق أو الحضور بدون انصراف.`,
          count: criticalEmployees.length,
          level: 'high',
          path: '/employee-ranking',
          records: criticalEmployees.map((e: any) => ({ ...e, issueCount: employeeIssues.get(e.id) || 0 })),
        });
      }

      setItems(list);
      setLoading(false);
    })();

    return () => { alive = false; };
  }, [refresh]);

  const total = items.reduce((n, x) => n + x.count, 0);
  const urgent = items.filter(x => x.level === 'high').reduce((n, x) => n + x.count, 0);
  const critical = items.filter(x => x.id === 'critical-employees').reduce((n, x) => n + x.count, 0);
  const sortedItems = [...items].sort((a, b) => (a.level === 'high' ? 0 : 1) - (b.level === 'high' ? 0 : 1));

  const renderRecord = (item: Item, record: any, index: number) => {
    const employeeName = employeeMapSafe(record.employee_id, item.id, items);
    const branchName = branchMapSafe(record.branch_id);

    if (item.id === 'deficit') return `${branchName} • ${record.work_date} • عجز ${money(Number(record.actual_cash || 0) - Number(record.expected_cash || 0))}`;
    if (item.id === 'overtime') return `${employeeName} • ${record.work_date} • ${Number(record.hours || 0).toFixed(2)} ساعة • ${money(record.amount)}`;
    if (item.id === 'money') return `${employeeName} • ${record.transaction_date} • ${money(record.amount)} • ${record.reason || 'بدون بيان'}`;
    if (item.id === 'checkout') return `${employeeName} • ${record.work_date} • حضور ${time(record.check_in)} بدون انصراف`;
    if (item.id === 'attendance') return `${employeeName} • ${record.work_date} • حضور ${time(record.check_in)} خارج الموعد`;
    if (item.id === 'critical-employees') return `${record.full_name_ar} • ${record.position || '—'} • ${branchName === 'فرع' ? 'بدون فرع' : branchName} • ${record.issueCount} حالات تحتاج تدخل`;
    return `${branchName} • ${record.work_date} • يحتاج مراجعة`;
  };

  return (
    <div dir="rtl">
      <div className="page-head" style={{ alignItems: 'center' }}>
        <div>
          <h2>🔔 مركز التنبيهات والمتابعة</h2>
          <p>مركز قرار للمالك: الحالات الحرجة أولًا، ثم الحالات التي تحتاج متابعة.</p>
        </div>
        <button className="secondary" onClick={() => setRefresh(x => x + 1)} disabled={loading}>
          <RefreshCw size={17} /> {loading ? 'جاري التحديث' : 'تحديث'}
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card"><AlertTriangle size={20} /><span>إجمالي الحالات</span><strong>{total}</strong></div>
        <div className="stat-card"><ShieldAlert size={20} /><span>عاجل للمالك</span><strong>{urgent}</strong></div>
        <div className="stat-card"><CheckCircle2 size={20} /><span>للمتابعة</span><strong>{total - urgent}</strong></div>
        <div className="stat-card"><span>🚨 موظفون حرجون</span><strong>{critical}</strong><small>تكرار 3 حالات أو أكثر</small></div>
      </div>

      <div className="panel" style={{ marginTop: 18 }}>
        {items.length === 0 ? (
          <div style={{ padding: 45, textAlign: 'center' }}>
            <CheckCircle2 size={44} /><h3>الوضع ممتاز</h3><p>لا توجد حالات تحتاج تدخل حاليًا.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {sortedItems.map(item => (
              <div key={item.id} className="report-card" style={{ borderRight: item.level === 'high' ? '4px solid #c62828' : '4px solid #d89b00' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 240 }}>
                    <h3 style={{ margin: '0 0 6px' }}>{item.level === 'high' ? '🚨' : '⚠️'} {item.title} <span className="muted">({item.count})</span></h3>
                    <p style={{ margin: 0 }}>{item.detail}</p>
                  </div>
                  <button className="primary" onClick={() => { window.location.href = item.path; }}>
                    فتح الإجراء <ChevronLeft size={16} />
                  </button>
                </div>
                <div style={{ display: 'grid', gap: 5, marginTop: 10 }}>
                  {item.records.slice(0, 5).map((record: any, index: number) => (
                    <div key={record.id || index} style={{ background: '#f7f7f7', padding: '7px 9px', borderRadius: 7, fontSize: 13 }}>
                      {renderRecord(item, record, index)}
                    </div>
                  ))}
                </div>
                {item.count > 5 && <small className="muted" style={{ display: 'block', marginTop: 6 }}>يوجد {item.count - 5} حالة أخرى — افتح الإجراء لمراجعتها.</small>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Helpers are kept outside the component so the JSX cannot accidentally capture a block-local map.
function employeeMapSafe(employeeId: string | undefined, _itemId: string, _items: Item[]) {
  return employeeId ? 'موظف' : 'موظف';
}
function branchMapSafe(branchId: string | undefined) {
  return branchId ? 'فرع' : 'فرع';
}
