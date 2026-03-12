import { sendLeadToTelegram, validateLead } from "../_shared/telegram.js";

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
    "Content-Type": "application/json; charset=utf-8",
  };
}

function json(payload, status, origin) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: corsHeaders(origin),
  });
}

export async function onRequestOptions(context) {
  const origin = context.request.headers.get("Origin") || "*";
  return new Response(null, {
    status: 204,
    headers: corsHeaders(origin),
  });
}

export async function onRequestPost(context) {
  const origin = context.request.headers.get("Origin") || "*";

  let payload;
  try {
    payload = await context.request.json();
  } catch {
    return json({ status: "error", message: "Некорректный JSON" }, 400, origin);
  }

  const validationError = validateLead(payload);
  if (validationError) {
    return json({ status: "error", message: validationError }, 400, origin);
  }

  try {
    await sendLeadToTelegram(payload, context.env);
    return json({ status: "ok", message: "Заявка отправлена" }, 200, origin);
  } catch (error) {
    console.error("Failed to send lead to Telegram:", error);
    return json(
      { status: "error", message: "Не удалось отправить заявку в Telegram" },
      502,
      origin
    );
  }
}
