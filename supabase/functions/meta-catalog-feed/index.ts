import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const db = createClient(supabaseUrl, serviceKey);

const headers = {
  "Content-Type": "text/csv; charset=utf-8",
  "Cache-Control": "public, max-age=300",
  "Access-Control-Allow-Origin": "*",
};

const money = (n: unknown) => Math.round((Number(n) || 0) * 100) / 100;
const csv = (v: unknown) => {
  const s = String(v ?? "");
  return /[",\n\r]/.test(s) ? '"' + s.replaceAll('"', '""') + '"' : s;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("", { status: 204, headers: { ...headers, "Access-Control-Allow-Headers": "content-type" } });
  }
  if (req.method !== "GET") return new Response("Method Not Allowed", { status: 405, headers });

  try {
    const [{ data: products, error: pe }, { data: categories, error: ce }, { data: branches, error: be }] =
      await Promise.all([
        db.from("products").select("id,category_id,name_ar,name_en,description_ar,description_en,image_url,base_price,is_active").eq("is_active", true),
        db.from("categories").select("id,name_ar,name_en").eq("is_active", true),
        db.from("branch_products").select("product_id,is_available,branch_id").eq("is_available", true),
      ]);

    if (pe || ce || be) throw new Error(pe?.message || ce?.message || be?.message || "catalog query failed");

    const categoryMap = new Map((categories || []).map((c: any) => [String(c.id), c]));
    const available = new Set((branches || []).map((b: any) => String(b.product_id)));

    // Current approved marketing rule for this test: 25% automatic product discount.
    // The catalog therefore exposes the real/base price plus the actual selling price.
    const discountPercent = 25;

    const rows = [
      ["id","title","description","availability","condition","price","sale_price","link","image_link","brand","currency","product_type"].join(","),
      ...(products || [])
        .filter((p: any) => available.has(String(p.id)) && Number(p.base_price) >= 0 && p.image_url)
        .map((p: any) => {
          const c: any = categoryMap.get(String(p.category_id));
          const price = money(p.base_price);
          const sale = money(price * (1 - discountPercent / 100));
          const title = p.name_ar || p.name_en || "منتج ألبان فلاحي";
          const description = p.description_ar || p.description_en || title;
          const link = "https://alban-falahi.pages.dev/menu.html?product=" + encodeURIComponent(String(p.id));
          return [
            String(p.id),
            title,
            description,
            "in stock",
            "new",
            price.toFixed(2) + " EGP",
            sale.toFixed(2) + " EGP",
            link,
            p.image_url,
            "ألبان فلاحي",
            "EGP",
            c?.name_ar || c?.name_en || "",
          ].map(csv).join(",");
        }),
    ];

    return new Response(rows.join("\n") + "\n", { headers });
  } catch (e) {
    return new Response("Feed error: " + String(e), { status: 500, headers });
  }
});
