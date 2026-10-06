-- Keep the production order-status trigger aligned with the actual orders column name.
-- Allows the privileged Admin Dashboard path to move ready -> preparing.
create or replace function public.validate_order_status_transition()
returns trigger
language plpgsql
as $function$
begin
  if old.status = new.status then return new; end if;
  if old.status='pending' and new.status not in ('confirmed','preparing','rejected','cancelled') then raise exception 'Invalid order transition'; end if;
  if old.status='confirmed' and new.status not in ('preparing','cancelled') then raise exception 'Invalid order transition'; end if;
  if old.status='preparing' and new.status not in ('ready','cancelled','pending') then raise exception 'Invalid order transition'; end if;
  if old.status='ready' and new.status='preparing' then
    if current_setting('request.jwt.claim.role', true) <> 'service_role'
       and current_setting('app.admin_order_status_transition', true) <> 'true' then
      raise exception 'Invalid order transition';
    end if;
  elsif old.status='ready' and new.status not in ('assigned','out_for_delivery','cancelled') then raise exception 'Invalid order transition'; end if;
  if old.status='assigned' and new.status not in ('out_for_delivery','cancelled') then raise exception 'Invalid order transition'; end if;
  if old.status='out_for_delivery' and new.status not in ('delivered','cancelled') then raise exception 'Invalid order transition'; end if;
  if old.status in ('delivered','cancelled','rejected') then raise exception 'Invalid order transition'; end if;
  if new.status='preparing' and old.status<>'preparing' then
    new.prep_started_at=coalesce(new.prep_started_at,now());
  end if;
  return new;
end;
$function$;
