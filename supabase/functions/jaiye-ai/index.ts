// Jaiye AI: reads what you tell Jaiye and splits it into filed items; turns voice into text.
// The Groq key lives only here, as the GROQ_API_KEY secret. Signed-in users only (JWT checked by Supabase).
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// trim spaces, line breaks and quotes that often come along when a key is pasted
const KEY = (Deno.env.get("GROQ_API_KEY") ?? "").trim().replace(/^["']|["']$/g, "").trim();
const KEY_SHAPE = `gsk_prefix=${KEY.startsWith("gsk_")} length=${KEY.length}`;   // safe to log, never the key itself
// Groq retires models often (llama-3.3-70b-versatile went in Aug 2026), so try a short list in order
// and remember the first one that answers. GROQ_MODEL / GROQ_STT_MODEL, if set, go first.
const uniq = (a: (string | undefined)[]) => [...new Set(a.filter((x): x is string => !!x))];
const MODELS = uniq([Deno.env.get("GROQ_MODEL"), "openai/gpt-oss-120b", "openai/gpt-oss-20b", "llama-3.3-70b-versatile"]);
const STT_MODELS = uniq([Deno.env.get("GROQ_STT_MODEL"), "whisper-large-v3-turbo", "whisper-large-v3"]);
let MODEL = MODELS[0];
let STT_MODEL = STT_MODELS[0];
const gone = (status: number, body: string) => status === 404 || body.includes("model_not_found") || body.includes("decommissioned");
const GROQ = "https://api.groq.com/openai/v1";

const ORIGINS = ["https://jaiye-eta.vercel.app", "https://jaiye-me-e0de.vercel.app", "http://localhost:5173", "http://localhost:4173"];
const KINDS = ["money", "meeting", "call", "meal", "task", "sleep", "reminder", "note", "habit"];
const CATS = ["Food", "Transport", "Bills", "Data & airtime", "Shopping", "Fun", "Salary", "Other"];

function cors(req: Request) {
  const o = req.headers.get("origin") ?? "";
  const ok = ORIGINS.includes(o) || /^https:\/\/jaiye-[a-z0-9-]+-me-e0de\.vercel\.app$/.test(o);
  return {
    "Access-Control-Allow-Origin": ok ? o : ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}
const json = (req: Request, body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors(req), "Content-Type": "application/json" } });

const SYSTEM = `You file short notes for Jaiye, a personal life app used mostly in Nigeria.
Split the user's message into the separate things it mentions and return JSON only:
{"items":[{"kind":"...","title":"...","amount":null,"direction":null,"category":null,"when":null}]}
- kind: one of money, meeting, call, meal, task, sleep, reminder, note, habit.
  money = something paid, spent, bought, received or earned. meeting = meet, review, standup, lunch/dinner WITH someone.
  call = phone someone. meal = what they ate or will cook. task = something to do. reminder = "remind me".
- title: short, in the user's own words, without the amount or the time ("Electricity", "Call Ada", "Lunch with Tolu"). Max 60 characters. Capitalise the first letter.
- amount: a number in whole currency units, or null. "15k" = 15000, "3.2k" = 3200, "1.5m" = 1500000, "N2,500" = 2500.
- direction: "spent" or "income" for money, else null. Salary, got paid, received, refund = income.
- category (money only): one of ${CATS.join(", ")}. Bolt, Uber, fuel, bus = Transport. Light, rent, electricity, NEPA = Bills. MTN, Airtel, Glo, data = Data & airtime.
- when: local date-time "YYYY-MM-DDTHH:MM" if a day or time is said or clearly meant, else null. Use the current local time given.
  "at 5" with no am/pm = 17:00. "tomorrow 1pm" = next day 13:00. A weekday = the next one coming. "tonight" = 20:00 today.
  For money with no time said, use null.
Never invent things that were not said. One item per thing.`;

async function parse(req: Request, body: Record<string, unknown>) {
  const text = String(body.text ?? "").trim().slice(0, 600);
  if (!text) return json(req, { items: [] });
  const local = String(body.local ?? "").slice(0, 16);
  const weekday = String(body.weekday ?? "").slice(0, 12);
  const currency = String(body.currency ?? "NGN").slice(0, 3);
  const ask = (model: string, plain = false) => fetch(`${GROQ}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      temperature: 0,
      max_tokens: 1500,
      ...(plain ? {} : { response_format: { type: "json_object" } }),
      ...(!plain && model.startsWith("openai/gpt-oss") ? { reasoning_effort: "low" } : {}),
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: `Current local time: ${local} (${weekday}). Currency: ${currency}.\nMessage: ${text}` },
      ],
    }),
  });
  let r = await ask(MODEL);
  if (r.status === 400) {   // a model that doesn't take JSON mode or reasoning_effort: ask again plainly
    const t = await r.text();
    console.warn("groq parse 400, retrying plain", MODEL, t.slice(0, 160));
    r = await ask(MODEL, true);
  }
  if (!r.ok) {
    const first = await r.text();
    if (gone(r.status, first)) {
      for (const m of MODELS.filter(x => x !== MODEL)) {
        r = await ask(m);
        if (r.ok) { console.log("groq parse: switched model to", m); MODEL = m; break; }
        const t = await r.text();
        if (!gone(r.status, t)) { console.error("groq parse", r.status, KEY_SHAPE, m, t.slice(0, 200)); return json(req, { error: "ai_failed", status: r.status }, 502); }
      }
    }
    if (!r.ok) { console.error("groq parse", r.status, KEY_SHAPE, MODEL, first.slice(0, 200)); return json(req, { error: "ai_failed", status: r.status }, 502); }
  }
  const data = await r.json();
  let out: { items?: unknown[] } = {};
  const content = String(data.choices?.[0]?.message?.content ?? "{}");
  const raw = content.slice(content.indexOf("{"), content.lastIndexOf("}") + 1) || "{}";   // tolerate ```json fences
  try { out = JSON.parse(raw); } catch { console.error("groq parse: not JSON", MODEL, content.slice(0, 160)); return json(req, { error: "bad_ai_reply" }, 502); }
  const items = (Array.isArray(out.items) ? out.items : []).slice(0, 8).flatMap((raw) => {
    const it = raw as Record<string, unknown>;
    const kind = KINDS.includes(String(it.kind)) ? String(it.kind) : "note";
    const title = String(it.title ?? "").trim().slice(0, 120);
    if (!title) return [];
    const amount = typeof it.amount === "number" && isFinite(it.amount) && it.amount > 0 ? Math.round(it.amount) : null;
    const when = typeof it.when === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(it.when) ? it.when : null;
    return [{
      kind,
      title,
      amount: kind === "money" ? amount : null,
      direction: kind === "money" ? (it.direction === "income" ? "income" : "spent") : null,
      category: kind === "money" && CATS.includes(String(it.category)) ? String(it.category) : null,
      when,
    }];
  });
  return json(req, { items });
}

async function transcribe(req: Request) {
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return json(req, { error: "no_audio" }, 400);
  if (file.size > 10 * 1024 * 1024) return json(req, { error: "too_long" }, 413);
  const send = (model: string) => {
    const fd = new FormData();
    fd.append("file", file, file.name || "voice.webm");
    fd.append("model", model);
    fd.append("response_format", "json");
    fd.append("temperature", "0");
    return fetch(`${GROQ}/audio/transcriptions`, { method: "POST", headers: { Authorization: `Bearer ${KEY}` }, body: fd });
  };
  let r = await send(STT_MODEL);
  if (!r.ok) {
    const first = await r.text();
    if (gone(r.status, first)) {
      for (const m of STT_MODELS.filter(x => x !== STT_MODEL)) {
        r = await send(m);
        if (r.ok) { console.log("groq stt: switched model to", m); STT_MODEL = m; break; }
        await r.text();
      }
    }
    if (!r.ok) { console.error("groq stt", r.status, KEY_SHAPE, STT_MODEL, first.slice(0, 200)); return json(req, { error: "stt_failed", status: r.status }, 502); }
  }
  const data = await r.json();
  return json(req, { text: String(data.text ?? "").trim().slice(0, 600) });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(req) });
  if (req.method !== "POST") return json(req, { error: "method" }, 405);
  if (!KEY) return json(req, { error: "no_key" }, 503);
  try {
    if ((req.headers.get("content-type") ?? "").includes("multipart/form-data")) return await transcribe(req);
    const body = await req.json().catch(() => ({}));
    if (body.action === "parse") return await parse(req, body);
    if (body.action === "ping") return json(req, { ok: true, model: MODEL });
    return json(req, { error: "unknown_action" }, 400);
  } catch (e) {
    console.error("jaiye-ai", e);
    return json(req, { error: "server" }, 500);
  }
});
