import { createClient } from '@supabase/supabase-js';
import { buildPushHTTPRequest } from '@pushforge/builder';
const SUPABASE_URL = 'https://roycuuyceopmlmkjllrt.supabase.co';
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
export async function onRequestPost({ request, env }: any) {
  try {
    if (!env.SUPABASE_SERVICE_ROLE_KEY || !env.VAPID_PRIVATE_JWK) return json({ error: 'إعدادات الإشعارات غير مكتملة' }, 503);
    const internalSecret = request.headers.get('X-Closeout-Push-Secret');
    const token = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
    const trustedInternal = !!internalSecret && !!env.CLOSEOUT_PUSH_SECRET && internalSecret === env.CLOSEOUT_PUSH_SECRET;
    if (!trustedInternal && !token) return json({ error: 'غير مصرح' }, 401);
    const admin = createClient(SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
    let actorId: string | null = null;
    if (token) { const { data: authData, error: authError } = await admin.auth.getUser(token); if (authError || !authData.user) return json({ error: 'جلسة غير صالحة' }, 401); actorId = authData.user.id; }
    const { closeoutId } = await request.json();
    if (!closeoutId) return json({ error: 'رقم التقفيلة مطلوب' }, 400);
    const { data: closeout, error: closeoutError } = await admin.from('hr_v2_shift_closeouts').select('id,work_date,shift_label,actual_cash,expected_cash,closed_by,cashier:hr_v2_employees!cashier_employee_id(full_name_ar),branch:hr_v2_branches!branch_id(name)').eq('id', closeoutId).single();
    if (closeoutError || !closeout) return json({ error: 'التقفيلة غير موجودة' }, 404);
    const { data: actor } = closeout.closed_by ? await admin.from('hr_v2_accounts').select('full_name,role,is_active').eq('id', closeout.closed_by).maybeSingle() : { data: null };
    if (!trustedInternal && (!actorId || closeout.closed_by !== actorId)) return json({ error: 'التقفيلة غير مملوكة للمستخدم الحالي' }, 403);
    if (!actor?.is_active || actor.role !== 'accountant') return json({ error: 'التقفيلة ليست مضافة بواسطة محاسب نشط' }, 403);
    const { data: recipients } = await admin.from('hr_v2_accounts').select('id').in('role', ['owner', 'admin']).eq('is_active', true);
    const ids = (recipients || []).map((r: any) => r.id);
    if (!ids.length) return json({ ok: true, sent: 0 });
    const { data: subscriptions } = await admin.from('hr_v2_push_subscriptions').select('id,user_id,endpoint,p256dh,auth').in('user_id', ids);
    const bodyText = `المحاسب ${actor.full_name || 'غير محدد'} أضاف تقفيلة ${closeout.shift_label || 'بدون تحديد'} بتاريخ ${closeout.work_date}${closeout.branch?.name ? ` - ${closeout.branch.name}` : ''}`;
    const payload = { title: '💰 تقفيلة جديدة', body: bodyText, icon: '/pwa-icon.svg', badge: '/pwa-icon.svg', image: '/pwa-icon.svg', dir: 'rtl', lang: 'ar', tag: `closeout-${closeout.id}`, renotify: true, requireInteraction: true, silent: false, vibrate: [250, 100, 250, 100, 400], timestamp: Date.now(), data: { url: '/closeouts', closeoutId: closeout.id } };
    const privateJWK = JSON.parse(env.VAPID_PRIVATE_JWK);
    let sent = 0;
    await Promise.all((subscriptions || []).map(async (row: any) => { try { const { endpoint, headers, body } = await buildPushHTTPRequest({ privateJWK, subscription: { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } }, message: { payload, adminContact: 'mailto:noreply@alban-falahi.pages.dev', options: { urgency: 'high', ttl: 86400, topic: 'shift-closeout' } } }); const response = await fetch(endpoint, { method: 'POST', headers, body }); if (response.status === 404 || response.status === 410) await admin.from('hr_v2_push_subscriptions').delete().eq('id', row.id); else if (response.ok || response.status === 201) sent++; } catch {} }));
    return json({ ok: true, sent });
  } catch (error: any) { return json({ error: error?.message || 'تعذر إرسال إشعار التقفيلة' }, 500); }
}
