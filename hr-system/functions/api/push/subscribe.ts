import { createClient } from '@supabase/supabase-js';
const SUPABASE_URL = 'https://roycuuyceopmlmkjllrt.supabase.co';
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
export async function onRequestPost({ request, env }: any) {
  try {
    const token = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
    if (!token || !env.SUPABASE_SERVICE_ROLE_KEY) return json({ error: 'غير مصرح' }, 401);
    const admin = createClient(SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
    const { data: authData, error: authError } = await admin.auth.getUser(token);
    if (authError || !authData.user) return json({ error: 'جلسة غير صالحة' }, 401);
    const { data: account, error: accountError } = await admin.from('hr_v2_accounts').select('role,is_active').eq('id', authData.user.id).maybeSingle();
    if (accountError || !account?.is_active || !['owner', 'admin'].includes(account.role)) return json({ error: 'تفعيل الإشعارات متاح للمالك ومدير النظام فقط' }, 403);
    const body = await request.json();
    const subscription = body?.subscription;
    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) return json({ error: 'بيانات الاشتراك غير مكتملة' }, 400);
    const { error } = await admin.from('hr_v2_push_subscriptions').upsert({ user_id: authData.user.id, endpoint: subscription.endpoint, p256dh: subscription.keys.p256dh, auth: subscription.keys.auth, user_agent: String(body?.userAgent || '').slice(0, 500), updated_at: new Date().toISOString() }, { onConflict: 'endpoint' });
    if (error) return json({ error: error.message }, 500);
    return json({ ok: true });
  } catch (error: any) {
    return json({ error: error?.message || 'تعذر حفظ اشتراك الإشعارات' }, 500);
  }
}
