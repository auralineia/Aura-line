function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "POST, OPTIONS"
  );
}

function bearer(req) {
  const value =
    req.headers?.authorization ||
    req.headers?.Authorization ||
    "";

  return value.startsWith("Bearer ")
    ? value.slice(7).trim()
    : "";
}

function supabaseConfig() {
  const url = process.env.SUPABASE_URL?.replace(/\/+$/, "");
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey =
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!url || !serviceKey || !anonKey) {
    throw new Error("Supabase não configurado.");
  }

  return { url, serviceKey, anonKey };
}

async function getUser(req) {
  const token = bearer(req);

  if (!token) {
    return null;
  }

  const { url, anonKey } = supabaseConfig();

  const response = await fetch(
    `${url}/auth/v1/user`,
    {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${token}`
      }
    }
  );

  if (!response.ok) {
    return null;
  }

  return response.json();
}

async function supabaseRest(path, options = {}) {
  const { url, serviceKey } = supabaseConfig();

  return fetch(`${url}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
}

const PLANS = {
  pro: {
    name: "PRO",
    amount: 11.99,
    dailyCredits: 50
  },

  ultra: {
    name: "ULTRA",
    amount: 29.99,
    dailyCredits: 150
  }
};

async function createMercadoPagoSubscription({
  plan,
  email,
  userId
}) {
  const accessToken =
    process.env.MERCADOPAGO_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error(
      "MERCADOPAGO_ACCESS_TOKEN ainda não foi configurado."
    );
  }

  const appUrl =
    process.env.PUBLIC_APP_URL ||
    "https://aura-line-s.vercel.app";

  const config = PLANS[plan];

  const payload = {
    reason: `Aura ${config.name}`,

    external_reference:
      `aura:${userId}:${plan}:${Date.now()}`,

    payer_email: email,

    auto_recurring: {
      frequency: 1,
      frequency_type: "months",
      transaction_amount: config.amount,
      currency_id: "BRL"
    },

    back_url:
      `${appUrl}/?payment=return&plan=${encodeURIComponent(plan)}`
  };

  const response = await fetch(
    "https://api.mercadopago.com/preapproval",
    {
      method: "POST",

      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },

      body: JSON.stringify(payload)
    }
  );

  const raw = await response.text();

  let data = null;

  try {
    data = JSON.parse(raw);
  } catch {}

  if (!response.ok) {
    console.error(
      "Mercado Pago subscription error:",
      response.status,
      raw
    );

    throw new Error(
      data?.message ||
      "Não foi possível criar o checkout do Mercado Pago."
    );
  }

  return data;
}

export default async function handler(req, res) {
  cors(res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Método não permitido."
    });
  }

  try {
    const user = await getUser(req);

    if (!user?.id || !user?.email) {
      return res.status(401).json({
        error: "Sessão inválida ou expirada."
      });
    }

    const requestedPlan =
      String(req.body?.plan || "").toLowerCase();

    if (!PLANS[requestedPlan]) {
      return res.status(400).json({
        error: "Plano inválido."
      });
    }

    const subscription =
      await createMercadoPagoSubscription({
        plan: requestedPlan,
        email: user.email,
        userId: user.id
      });

    const config = PLANS[requestedPlan];

    const response = await supabaseRest(
      "subscriptions?user_id=eq." +
      encodeURIComponent(user.id),
      {
        method: "PATCH",

        headers: {
          Prefer: "return=minimal"
        },

        body: JSON.stringify({
          plan: requestedPlan,

          status:
            String(
              subscription.status || "pending"
            ),

          mercado_pago_subscription_id:
            String(subscription.id || ""),

          external_reference:
            String(
              subscription.external_reference || ""
            ),

          amount: config.amount,

          daily_credits:
            config.dailyCredits,

          updated_at:
            new Date().toISOString()
        })
      }
    );

    if (!response.ok) {
      console.error(
        "Erro salvando assinatura:",
        await response.text()
      );
    }

    return res.status(200).json({
      ok: true,

      plan: requestedPlan,

      planName: config.name,

      init_point:
        subscription.init_point || null,

      subscription_id:
        subscription.id || null
    });

  } catch (error) {
    console.error(
      "Subscribe:",
      error
    );

    return res.status(500).json({
      error:
        error?.message ||
        "Não foi possível iniciar a assinatura."
    });
  }
}
