create or replace function public.hr_v2_update_employee_terms(
  p_employee uuid,
  p_effective_from date,
  p_terms jsonb
)
returns public.hr_v2_employee_terms_history
language plpgsql
security definer
set search_path = public
as $$
declare
  today date := (now() at time zone 'Africa/Cairo')::date;
  h public.hr_v2_employee_terms_history%rowtype;
  result_row public.hr_v2_employee_terms_history%rowtype;
begin
  if p_effective_from < today then
    raise exception 'effective_from cannot be before today';
  end if;

  if not exists (select 1 from public.hr_v2_employees where id = p_employee) then
    raise exception 'employee not found';
  end if;

  delete from public.hr_v2_employee_terms_history
  where employee_id = p_employee
    and effective_from > p_effective_from;

  select * into h
  from public.hr_v2_employee_terms_history
  where employee_id = p_employee
    and effective_from <= p_effective_from
    and (effective_to is null or effective_to >= p_effective_from)
  order by effective_from desc, created_at desc
  limit 1
  for update;

  if found and h.effective_from < p_effective_from then
    update public.hr_v2_employee_terms_history
    set effective_to = p_effective_from - 1
    where id = h.id;
  end if;

  insert into public.hr_v2_employee_terms_history(
    employee_id,effective_from,effective_to,base_salary,pay_type,overtime_rate,
    daily_work_hours,work_schedule,is_delivery,max_daily_paid_hours,payroll_cycle
  )
  values(
    p_employee,p_effective_from,null,
    coalesce((p_terms->>'base_salary')::numeric,0),
    coalesce(p_terms->>'pay_type','monthly'),
    coalesce((p_terms->>'overtime_rate')::numeric,0),
    coalesce((p_terms->>'daily_work_hours')::numeric,8),
    p_terms->'work_schedule',
    coalesce((p_terms->>'is_delivery')::boolean,false),
    coalesce((p_terms->>'max_daily_paid_hours')::numeric,8),
    coalesce(p_terms->>'payroll_cycle','monthly')
  )
  returning * into result_row;

  if p_effective_from = today then
    update public.hr_v2_employees
    set base_salary = result_row.base_salary,
        pay_type = result_row.pay_type,
        overtime_rate = result_row.overtime_rate,
        daily_work_hours = result_row.daily_work_hours,
        work_schedule = result_row.work_schedule,
        is_delivery = result_row.is_delivery,
        max_daily_paid_hours = result_row.max_daily_paid_hours,
        payroll_cycle = result_row.payroll_cycle
    where id = p_employee;
  end if;

  return result_row;
end;
$$;

grant execute on function public.hr_v2_update_employee_terms(uuid,date,jsonb) to authenticated;
