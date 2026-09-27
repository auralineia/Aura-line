const PLAN_CONFIG = {
  pro: { price: 11.99, name: "PRO" },
  ultra: { price: 29.99, name: "ULTRA" }
};

function json(res, status, body) {
  res.status(status).json(body);
}

function bearer(req) {
  const value = req.headers?.authorization || req.headers?.Authorization || "";
  return value.startsWith("Bearer ") ? value.slice(7).trim() : "";
}

function supabaseConfig() {
  const url = process.env.SUPABASE_URL?.replace(/\/+$/, "");
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !serviceKey || !anonKey) throw new Error("Supabase não configurado.");
  return { url, serviceKey, anonKey };
}

async function getUser(req) {
  const token = bearer(req);
  if (!token) return null;
  const { url, anonKey } = supabaseConfig();
  const response = await fetch(url + "/auth/v1/user", {
    headers: { apikey: anonKey, Authorization: "Bearer " + token }
  });
  if (!response.ok) return null;
  const user = await response.json();
  return user?.id ? user : null;
}

async function supabaseRest(path, options = {}) {
  const { url, serviceKey } = supabaseConfig();
  return fetch(url + "/rest/v1/" + path, {
    ...options,
    headers: {
      apikey: serviceKey,
      Authorization: "Bearer " + serviceKey,
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { error: "Método não permitido." });

  try {
    const user = await getUser(req);
    if (!user) return json(res, 401, { error: "Sessão inválida." });

    const plan = String(req.body?.plan || "").toLowerCase();
    const config = PLAN_CONFIG[plan];
    if (!config) return json(res, 400, { error: "Plano inválido." });

    const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!token) return json(res, 500, { error: "Mercado Pago não configurado no servidor." });

    const externalReference = user.id + ":" + plan;
    const baseUrl = process.env.AURA_PUBLIC_URL || "https://aura-line-s.vercel.app";

    const mpResponse = await fetch("https://api.mercadopago.com/preapproval", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        reason: "AURA " + config.name,
        external_reference: externalReference,
        payer_email: user.email,
        auto_recurring: {
          frequency: 1,
          frequency_type: "months",
          transaction_amount: config.price,
          currency_id: "BRL"
        },
        back_url: baseUrl + "?checkout=return",
        status: "pending"
      })
    });

    const mpData = await mpResponse.json().catch(() => ({}));
    if (!mpResponse.ok) {
      console.error("Mercado Pago checkout:", mpResponse.status, mpData);
      return json(res, 502, {
        error: mpData?.message || "Não foi possível criar o checkout."
      });
    }

    await supabaseRest("subscriptions?on_conflict=user_id", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({
        user_id: user.id,
        plan,
        status: "pending",
        mercado_pago_subscription_id: mpData.id || null,
        current_period_end: null,
        updated_at: new Date().toISOString()
      })
    }).catch(error => console.error("Subscription pending:", error));

    return json(res, 200, {
      ok: true,
      plan,
      checkout_url: mpData.init_point || mpData.sandbox_init_point || null
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return json(res, 500, { error: "Erro ao iniciar checkout." });
  }
}
