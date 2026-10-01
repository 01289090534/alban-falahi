-- Fix overnight shift overtime calculation globally and rebuild editable payroll data.
-- Overnight schedules such as 23:00 -> 08:00 are one shift crossing midnight.
-- The authoritative calculation is hr_v2_schedule_minutes(), which already handles
-- cross-midnight schedules by moving the scheduled end to the following day.
-- Recalculate all editable attendance rows so stale overtime values are replaced.
update public.hr_v2_attendance a
set check_in=a.check_in, check_out=a.check_out
where a.check_in is not null
  and a.check_out is not null
  and not exists (
    select 1
    from public.hr_v2_payroll p
    where p.employee_id=a.employee_id
      and p.period_start<=a.work_date
      and p.period_end>=a.work_date
      and p.status in ('approved'::public.hr_v2_payroll_status,'paid'::public.hr_v2_payroll_status)
  );

-- Old overtime approvals were based on the stale calculation, so editable periods
-- must be reviewed again under the corrected engine.
update public.hr_v2_attendance a
set approved_overtime_minutes=0,
    approved_by=null,
    approved_at=null
where coalesce(a.approved_overtime_minutes,0)>0
  and not exists (
    select 1
    from public.hr_v2_payroll p
    where p.employee_id=a.employee_id
      and p.period_start<=a.work_date
      and p.period_end>=a.work_date
      and p.status in ('approved'::public.hr_v2_payroll_status,'paid'::public.hr_v2_payroll_status)
  );

-- Refresh every draft payroll from the authoritative payroll calculator.
do $do$
declare
  p record;
  c jsonb;
begin
  for p in
    select id,employee_id,period_start,period_end
    from public.hr_v2_payroll
    where status='draft'::public.hr_v2_payroll_status
  loop
    c:=public.hr_v2_calc_payroll(p.employee_id,p.period_start,p.period_end);
    update public.hr_v2_payroll
    set base_salary=(c->>'base_salary')::numeric,
        overtime_total=(c->>'overtime_total')::numeric,
        bonuses=(c->>'bonuses')::numeric,
        deductions=(c->>'deductions')::numeric,
        advances=(c->>'advances')::numeric,
        attendance_deduction=(c->>'attendance_deduction')::numeric,
        lateness_deduction=(c->>'lateness_deduction')::numeric,
        net_salary=(c->>'net_salary')::numeric
    where id=p.id;
  end loop;
end
$do$;
