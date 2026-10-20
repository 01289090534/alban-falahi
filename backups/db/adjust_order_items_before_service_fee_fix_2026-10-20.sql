-- Backup of public.adjust_order_items before service_fee fix
-- Captured 2026-10-20 UTC. Do not execute unless rollback is explicitly required.

CREATE OR REPLACE FUNCTION public.adjust_order_items(p_order_id uuid, p_changed_by uuid, p_changes jsonb, p_reason text DEFAULT 'المنتج غير متوفر'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
declare
  o public.orders%rowtype;
  it record;
  ch jsonb;
  new_qty numeric;
  old_sub numeric;
  new_sub numeric;
  new_total numeric;
  new_service numeric;
  normalized jsonb := '[]'::jsonb;
  removed numeric;
begin
  select * into o from public.orders where id=p_order_id for update;
  if not found then raise exception 'الطلب غير موجود'; end if;
  if o.status::text in ('delivered','cancelled','rejected') then
    raise exception 'لا يمكن تعديل طلب مكتمل أو ملغي';
  end if;
  if jsonb_typeof(p_changes) <> 'array' or jsonb_array_length(p_changes)=0 then
    raise exception 'لا توجد تعديلات';
  end if;

  old_sub := coalesce(o.subtotal,0);

  for ch in select value from jsonb_array_elements(p_changes)
  loop
    select * into it from public.order_items
    where id=(ch->>'item_id')::uuid and order_id=o.id
    for update;

    if not found then raise exception 'أحد أصناف الطلب غير موجود'; end if;

    new_qty := round(coalesce((ch->>'new_quantity')::numeric, it.quantity), 3);
    if new_qty < 0 or new_qty > it.quantity then
      raise exception 'الكمية الجديدة غير صالحة';
    end if;

    removed := round(greatest(it.quantity-new_qty,0),3);

    if new_qty <> it.quantity then
      normalized := normalized || jsonb_build_array(jsonb_build_object(
        'item_id',it.id,
        'product_id',it.product_id,
        'product_name_ar',it.product_name_ar,
        'product_name_en',it.product_name_en,
        'old_quantity',it.quantity,
        'new_quantity',new_qty,
        'removed_quantity',removed,
        'unit_price',it.unit_price,
        'removed_value',round(removed*it.unit_price,2)
      ));

      if new_qty = 0 then
        delete from public.order_items where id=it.id;
      else
        update public.order_items
        set quantity=new_qty, line_total=round(new_qty*unit_price,2)
        where id=it.id;
      end if;
    end if;
  end loop;

  if jsonb_array_length(normalized)=0 then raise exception 'لم يتم تغيير أي كمية'; end if;

  select coalesce(sum(line_total),0) into new_sub
  from public.order_items where order_id=o.id and quantity>0;

  new_service := round(new_sub*(coalesce((select service_fee_percent from public.store_settings where id=true),0)/100),2);
  new_total := round(greatest(0,new_sub-coalesce(o.discount,0))+new_service+coalesce(o.delivery_fee,0)+coalesce(o.tip_amount,0),2);

  update public.orders
  set subtotal=round(new_sub,2),
      total=new_total,
      updated_at=now()
  where id=o.id;

  insert into public.order_adjustments(order_id,changed_by,reason,changes,old_subtotal,new_subtotal,old_total,new_total)
  values(o.id,p_changed_by,coalesce(nullif(trim(p_reason),''),'المنتج غير متوفر'),normalized,round(old_sub,2),round(new_sub,2),round(o.total,2),new_total);

  return jsonb_build_object(
    'order_id',o.id,
    'order_number',o.order_number,
    'changes',normalized,
    'old_subtotal',round(old_sub,2),
    'new_subtotal',round(new_sub,2),
    'old_total',round(o.total,2),
    'new_total',new_total
  );
end;
$function$
;
