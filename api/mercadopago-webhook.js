const crypto = require("crypto");

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, x-signature, x-request-id"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "POST, OPTIONS"
  );
}

function supabaseConfig() {
  const url = process.env.SUPABASE_URL?.replace(/\/+$/, "");
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Supabase não configurado."
    );
  }

  return {
    url,
    serviceKey
  };
}

async function supabaseRest(path, options = {}) {
  const {
    url,
    serviceKey
  } = supabaseConfig();

  return fetch(
    `${url}/rest/v1/${path}`,
    {
      ...options,

      headers: {
        apikey: serviceKey,

        Authorization:
          `Bearer ${serviceKey}`,

        "Content-Type":
          "application/json",

        ...(options.headers || {})
      }
    }
  );
}

function getSignatureParts(value) {
  const result = {};

  if (!value) {
    return result;
  }

  for (const part of value.split(",")) {
    const [key, ...rest] =
      part.split("=");

    if (!key || !rest.length) {
      continue;
    }

    result[key.trim()] =
      rest.join("=").trim();
  }

  return result;
}

function verifyMercadoPagoSignature(req) {
  const secret =
    process.env.MERCADOPAGO_WEBHOOK_SECRET;

  /*
   * Em desenvolvimento/teste, se o segredo ainda
   * não estiver configurado, não bloqueamos o webhook.
   *
   * Antes do lançamento público, configure
   * MERCADOPAGO_WEBHOOK_SECRET no Vercel.
   */

  if (!secret) {
    console.warn(
      "MERCADOPAGO_WEBHOOK_SECRET não configurado."
    );

    return true;
  }

  const xSignature =
    req.headers?.["x-signature"] ||
    req.headers?.["X-Signature"] ||
    "";

  const xRequestId =
    req.headers?.["x-request-id"] ||
    req.headers?.["X-Request-Id"] ||
    "";

  if (!xSignature) {
    return false;
  }

  const parts =
    getSignatureParts(xSignature);

  const timestamp = parts.ts;
  const receivedHash = parts.v1;

  if (!timestamp || !receivedHash) {
    return false;
  }

  const body = req.body || {};

  const dataId =
    body?.data?.id ||
    body?.id ||
    "";

  if (!dataId) {
    return false;
  }

  const manifest =
    `id:${dataId};` +
    `request-id:${xRequestId};` +
    `ts:${timestamp};`;

  const expectedHash =
    crypto
      .createHmac(
        "sha256",
        secret
      )
      .update(manifest)
      .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(
        expectedHash,
        "utf8"
      ),
      Buffer.from(
        receivedHash,
        "utf8"
      )
    );
  } catch {
    return false;
  }
}

async function getMercadoPagoSubscription(
  subscriptionId
) {
  const accessToken =
    process.env.MERCADOPAGO_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error(
      "MERCADOPAGO_ACCESS_TOKEN não configurado."
    );
  }

  const response =
    await fetch(
      `https://api.mercadopago.com/preapproval/${encodeURIComponent(
        subscriptionId
      )}`,
      {
        headers: {
          Authorization:
            `Bearer ${accessToken}`
        }
      }
    );

  const raw =
    await response.text();

  let data = null;

  try {
    data = JSON.parse(raw);
  } catch {}

  if (!response.ok) {
    throw new Error(
      data?.message ||
      `Mercado Pago retornou ${response.status}.`
    );
  }

  return data;
}

function extractPlan(subscription) {
  const reference =
    String(
      subscription?.external_reference ||
      ""
    );

  const referenceParts =
    reference.split(":");

  if (
    referenceParts.length >= 3 &&
    referenceParts[0] === "aura"
  ) {
    const plan =
      referenceParts[2]
        ?.toLowerCase();

    if (
      plan === "pro" ||
      plan === "ultra"
    ) {
      return plan;
    }
  }

  const reason =
    String(
      subscription?.reason ||
      ""
    ).toLowerCase();

  if (reason.includes("ultra")) {
    return "ultra";
  }

  if (reason.includes("pro")) {
    return "pro";
  }

  return null;
}

function extractUserId(subscription) {
  const reference =
    String(
      subscription?.external_reference ||
      ""
    );

  const parts =
    reference.split(":");

  if (
    parts.length >= 3 &&
    parts[0] === "aura"
  ) {
    return parts[1] || null;
  }

  return null;
}

function planConfig(plan) {
  if (plan === "ultra") {
    return {
      amount: 29.99,
      dailyCredits: 150
    };
  }

  if (plan === "pro") {
    return {
      amount: 11.99,
      dailyCredits: 50
    };
  }

  return {
    amount: 0,
    dailyCredits: 20
  };
}

function normalizeStatus(status) {
  const value =
    String(status || "")
      .toLowerCase();

  if (
    [
      "authorized",
      "active",
      "approved"
    ].includes(value)
  ) {
    return "active";
  }

  if (
    [
      "cancelled",
      "canceled"
    ].includes(value)
  ) {
    return "cancelled";
  }

  if (
    [
      "paused",
      "pending",
      "rejected"
    ].includes(value)
  ) {
    return value;
  }

  return value || "pending";
}

async function updateSubscription({
  userId,
  plan,
  status,
  mercadoPagoId,
  externalReference,
  currentPeriodEnd
}) {
  const config =
    planConfig(plan);

  const response =
    await supabaseRest(
      `subscriptions?user_id=eq.${encodeURIComponent(
        userId
      )}`,
      {
        method: "PATCH",

        headers: {
          Prefer:
            "return=minimal"
        },

        body: JSON.stringify({
          plan:
            plan || "free",

          status,

          amount:
            config.amount,

          daily_credits:
            config.dailyCredits,

          mercado_pago_subscription_id:
            mercadoPagoId || null,

          external_reference:
            externalReference || null,

          current_period_end:
            currentPeriodEnd || null,

          updated_at:
            new Date().toISOString()
        })
      }
    );

  if (!response.ok) {
    const error =
      await response.text();

    throw new Error(
      `Erro ao atualizar assinatura: ${error}`
    );
  }
}

export default async function handler(
  req,
  res
) {
  cors(res);

  if (req.method === "OPTIONS") {
    return res
      .status(204)
      .end();
  }

  if (req.method !== "POST") {
    return res
      .status(405)
      .json({
        error:
          "Método não permitido."
      });
  }

  try {
    /*
     * Validação da assinatura enviada
     * pelo Mercado Pago.
     */

    if (
      !verifyMercadoPagoSignature(req)
    ) {
      return res
        .status(401)
        .json({
          error:
            "Webhook não autorizado."
        });
    }

    const body =
      req.body || {};

    const subscriptionId =
      body?.data?.id ||
      body?.id ||
      null;

    /*
     * Algumas notificações podem chegar
     * sem o ID esperado. Nesse caso,
     * respondemos 200 para evitar
     * reenvios desnecessários.
     */

    if (!subscriptionId) {
      return res
        .status(200)
        .json({
          ok: true,
          ignored: true
        });
    }

    /*
     * Busca diretamente no Mercado Pago
     * para não confiar somente no payload
     * recebido pelo webhook.
     */

    const subscription =
      await getMercadoPagoSubscription(
        subscriptionId
      );

    const userId =
      extractUserId(
        subscription
      );

    const plan =
      extractPlan(
        subscription
      );

    if (!userId || !plan) {
      console.warn(
        "Webhook recebido sem userId/plan válidos.",
        {
          subscriptionId,
          external_reference:
            subscription?.external_reference
        }
      );

      return res
        .status(200)
        .json({
          ok: true,
          ignored: true
        });
    }

    const status =
      normalizeStatus(
        subscription?.status
      );

    const currentPeriodEnd =
      subscription?.next_payment_date ||
      subscription?.date_created ||
      null;

    await updateSubscription({
      userId,

      plan,

      status,

      mercadoPagoId:
        String(
          subscription?.id ||
          subscriptionId
        ),

      externalReference:
        String(
          subscription?.external_reference ||
          ""
        ),

      currentPeriodEnd
    });

    /*
     * IMPORTANTE:
     *
     * Não alteramos diretamente a tabela
     * de créditos aqui.
     *
     * O RPC consume_credits_for_user
     * controla o saldo diário conforme
     * o plano:
     *
     * FREE  = 20
     * PRO   = 50
     * ULTRA = 150
     *
     * Isso evita créditos duplicados.
     */

    return res
      .status(200)
      .json({
        ok: true,
        processed: true,

        subscription_id:
          subscriptionId,

        plan,

        status
      });

  } catch (error) {
    console.error(
      "Mercado Pago webhook error:",
      error
    );

    /*
     * Retornar 500 permite que o Mercado Pago
     * tente novamente quando houver falha
     * real no processamento.
     */

    return res
      .status(500)
      .json({
        error:
          error?.message ||
          "Erro ao processar webhook."
      });
  }
}
