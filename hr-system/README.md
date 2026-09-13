# ألبان فلاحي — نظام إدارة الموارد البشرية

نظام جديد ومعزول لإدارة الموارد البشرية، مبني بـ React + Vite + TypeScript وSupabase/PostgreSQL، وواجهة عربية RTL متجاوبة.

## قاعدة البيانات
تم إنشاء مساحة HR v2 مستقلة داخل مشروع Supabase `Alban Falahi HR` باستخدام جداول `hr_v2_*`، مع RLS وسياسات صلاحيات منفصلة. لا تعتمد الواجهة الجديدة على جداول النظام القديم.

## تشغيل المشروع
```bash
npm install
npm run build
```

أنشئ `.env` من `.env.example` وضع:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

لا تضع service-role أو أي مفتاح سري داخل الواجهة.

## Cloudflare Pages
Repository: `01289090534/alban-falahi`
Branch: `hr-system`
Root directory: `hr-system`
Build command: `npm run build`
Build output: `dist`

Cloudflare Pages يدعم النشر التلقائي مع كل commit، مع preview deployments للفروع/طلبات الدمج.

## ملاحظة الدخول
دعم رقم الهاتف يعتمد على تفعيل Phone Auth ومزوّد SMS في إعدادات Supabase. البريد الإلكتروني/حساب الموظف يمكن استخدامه كمعرّف بديل.

## أول مدير
يجب إنشاء أول مستخدم Auth من Supabase ثم ربطه بسجل `hr_v2_accounts` بدور `admin`. لا يتم إنشاء كلمة مرور أو حساب مالك افتراضي داخل الكود حفاظاً على الأمان.
