-- Prevent approved schedule exceptions from double-counting the same excess minutes
-- as both regular paid time and approved overtime.
--
-- Rule:
--   regular paid time = scheduled regular minutes
--   approved attendance OT = approved overtime minutes capped by calculated OT
--   total paid time = regular + approved OT + manual approved OT
--
-- calc.early_minutes represents the same excess duration as overtime_minutes
-- in hr_v2_schedule_minutes and must not be added to regular time.

create or replace function public.hr_v2_calc_payroll(p_employee uuid, p_start date, p_end date)
returns jsonb
language plpgsql
security definer
set search_path=public
as $function$
declare
  worked_minutes numeric:=0;
  paid_regular_minutes numeric:=0;
  attendance_overtime_minutes numeric:=0;
  manual_overtime_hours numeric:=0;
  base numeric:=0;
  ot numeric:=0;
  bonuses numeric;
  deductions numeric;
  advances numeric;
  d date;
  t public.hr_v2_employee_terms_history%rowtype;
  a public.hr_v2_attendance%rowtype;
  calc jsonb;
  days_in_month integer;
begin
  if not exists(select 1 from public.hr_v2_employees where id=p_employee) then
    return jsonb_build_object('error','employee_not_found');
  end if;

  for a in select * from public.hr_v2_attendance
    where employee_id=p_employee and work_date between p_start and p_end
  loop
    t:=public.hr_v2_get_employee_terms(p_employee,a.work_date);
    worked_minutes:=worked_minutes+greatest(coalesce(a.work_minutes,0),0);
    calc:=public.hr_v2_schedule_minutes(p_employee,a.work_date,a.check_in,a.check_out);

    paid_regular_minutes:=paid_regular_minutes+
      greatest(0,(calc->>'regular_minutes')::integer);

    if t.pay_type='hourly' then
      base:=base+
        greatest(0,(calc->>'regular_minutes')::integer)/60.0*
        coalesce(t.base_salary,0);
    end if;

    attendance_overtime_minutes:=attendance_overtime_minutes+
      greatest(0,least(
        coalesce(a.approved_overtime_minutes,0),
        coalesce((calc->>'overtime_minutes')::integer,0)
      ));
  end loop;

  select coalesce(sum(greatest(o.hours,0)),0)
    into manual_overtime_hours
  from public.hr_v2_overtime o
  where o.employee_id=p_employee
    and o.work_date between p_start and p_end
    and o.approval_status='approved';

  select coalesce(sum(greatest(o.hours,0)*coalesce(o.hourly_rate,0)),0)
    into ot
  from public.hr_v2_overtime o
  where o.employee_id=p_employee
    and o.work_date between p_start and p_end
    and o.approval_status='approved';

  for a in select * from public.hr_v2_attendance
    where employee_id=p_employee and work_date between p_start and p_end
  loop
    t:=public.hr_v2_get_employee_terms(p_employee,a.work_date);
    ot:=ot+
      greatest(0,least(
        coalesce(a.approved_overtime_minutes,0),
        coalesce((public.hr_v2_schedule_minutes(
          p_employee,a.work_date,a.check_in,a.check_out
        )->>'overtime_minutes')::integer,0)
      ))/60.0*coalesce(t.overtime_rate,0);
  end loop;

  for d in select generate_series(p_start,p_end,'1 day'::interval)::date loop
    t:=public.hr_v2_get_employee_terms(p_employee,d);
    if t.pay_type='monthly' then
      days_in_month:=extract(day from
        (date_trunc('month',d)+interval '1 month - 1 day'))::integer;
      base:=base+coalesce(t.base_salary,0)/nullif(days_in_month,0);
    end if;
  end loop;

  select
    coalesce(sum(case when type='bonus' and approval_status='approved' then amount else 0 end),0),
    coalesce(sum(case when type='deduction' and approval_status='approved' then amount else 0 end),0),
    coalesce(sum(case when type='advance' and approval_status='approved' then amount else 0 end),0)
  into bonuses,deductions,advances
  from public.hr_v2_money_transactions
  where employee_id=p_employee and transaction_date between p_start and p_end;

  return jsonb_build_object(
    'employee_id',p_employee,'period_start',p_start,'period_end',p_end,
    'worked_minutes',worked_minutes,'worked_hours',round(worked_minutes/60.0,2),
    'paid_regular_minutes',paid_regular_minutes,
    'paid_regular_hours',round(paid_regular_minutes/60.0,2),
    'attendance_overtime_minutes',attendance_overtime_minutes,
    'attendance_overtime_hours',round(attendance_overtime_minutes/60.0,2),
    'approved_overtime_minutes',attendance_overtime_minutes,
    'manual_overtime_hours',round(manual_overtime_hours,2),
    'approved_overtime_hours',round(attendance_overtime_minutes/60.0+manual_overtime_hours,2),
    'total_paid_minutes',round(paid_regular_minutes+attendance_overtime_minutes+manual_overtime_hours*60,0),
    'total_paid_hours',round(paid_regular_minutes/60.0+attendance_overtime_minutes/60.0+manual_overtime_hours,2),
    'base_salary',round(base,2),'attendance_deduction',0,'lateness_deduction',0,
    'overtime_total',round(ot,2),'bonuses',round(bonuses,2),'deductions',round(deductions,2),
    'advances',round(advances,2),'net_salary',round(base+bonuses+ot-deductions-advances,2)
  );
end;
$function$;
