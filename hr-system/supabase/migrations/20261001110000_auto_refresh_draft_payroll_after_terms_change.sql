-- Keep unapproved payroll drafts synchronized with effective employee terms.
-- Safe to run more than once.

create or replace function public.hr_v2_refresh_draft_payroll_for_terms()
returns trigger
language plpgsql
security definer
set search_path=public
as $function$
declare
  p record;
  c jsonb;
begin
  for p in
    select *
    from public.hr_v2_payroll
    where employee_id=new.employee_id
      and status='draft'::public.hr_v2_payroll_status
      and period_end >= new.effective_from
  loop
    c := public.hr_v2_calc_payroll(p.employee_id,p.period_start,p.period_end);
    update public.hr_v2_payroll
    set base_salary=coalesce((c->>'base_salary')::numeric,0),
        overtime_total=coalesce((c->>'overtime_total')::numeric,0),
        bonuses=coalesce((c->>'bonuses')::numeric,0),
        deductions=coalesce((c->>'deductions')::numeric,0),
        advances=coalesce((c->>'advances')::numeric,0),
        attendance_deduction=coalesce((c->>'attendance_deduction')::numeric,0),
        lateness_deduction=coalesce((c->>'lateness_deduction')::numeric,0),
        net_salary=coalesce((c->>'net_salary')::numeric,0)
    where id=p.id;
  end loop;
  return new;
end;
$function$;

drop trigger if exists trg_hr_v2_refresh_draft_payroll_terms on public.hr_v2_employee_terms_history;
create trigger trg_hr_v2_refresh_draft_payroll_terms
after insert or update on public.hr_v2_employee_terms_history
for each row execute function public.hr_v2_refresh_draft_payroll_for_terms();

-- One-time synchronization of existing draft payrolls.
do $$
declare p record; c jsonb;
begin
  for p in select * from public.hr_v2_payroll where status='draft'::public.hr_v2_payroll_status loop
    c:=public.hr_v2_calc_payroll(p.employee_id,p.period_start,p.period_end);
    update public.hr_v2_payroll set
      base_salary=coalesce((c->>'base_salary')::numeric,0),
      overtime_total=coalesce((c->>'overtime_total')::numeric,0),
      bonuses=coalesce((c->>'bonuses')::numeric,0),
      deductions=coalesce((c->>'deductions')::numeric,0),
      advances=coalesce((c->>'advances')::numeric,0),
      attendance_deduction=coalesce((c->>'attendance_deduction')::numeric,0),
      lateness_deduction=coalesce((c->>'lateness_deduction')::numeric,0),
      net_salary=coalesce((c->>'net_salary')::numeric,0)
    where id=p.id;
  end loop;
end $$;
