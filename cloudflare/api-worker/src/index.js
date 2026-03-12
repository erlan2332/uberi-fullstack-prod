const PHONE_PATTERN = /^[0-9+()\-\s]{6,30}$/;
const DATE_PATTERN = /^(\d{4}-\d{2}-\d{2}|\d{2}\.\d{2}\.\d{4})$/;
const CHAT_CACHE_TTL_MS = 10 * 60 * 1000;

let recipientCache = {
  chatIds: [],
  expiresAt: 0,
};

let recipientRefreshPromise = null;

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "*";
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(origin),
      });
    }

    if (url.pathname === "/api/health") {
      return jsonResponse({ status: "ok" }, 200, origin);
    }

    if (url.pathname !== "/api/leads") {
      return jsonResponse({ status: "error", message: "Not Found" }, 404, origin);
    }

    if (request.method !== "POST") {
      return jsonResponse({ status: "error", message: "Method Not Allowed" }, 405, origin);
    }

    let payload;
    try {
      payload = await request.json();
    } catch {
      return jsonResponse({ status: "error", message: "Некорректный JSON" }, 400, origin);
    }

    const validationError = validateLead(payload);
    if (validationError) {
      return jsonResponse({ status: "error", message: validationError }, 400, origin);
    }

    try {
      await sendLead(payload, env);
      return jsonResponse({ status: "ok", message: "Заявка отправлена" }, 200, origin);
    } catch (error) {
      console.error("Failed to send lead:", error);
      return jsonResponse(
        { status: "error", message: "Не удалось отправить заявку в Telegram" },
        502,
        origin
      );
    }
  },
};

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
    "Content-Type": "application/json; charset=utf-8",
  };
}

function jsonResponse(payload, status, origin) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: corsHeaders(origin),
  });
}

function validateLead(payload) {
  if (!payload || typeof payload !== "object") {
    return "Пустой запрос";
  }

  const name = asTrimmedString(payload.name);
  const phone = asTrimmedString(payload.phone);
  const executionDate = asTrimmedString(payload.executionDate);
  const address = asTrimmedString(payload.address);
  const pickupItems = asTrimmedString(payload.pickupItems);

  if (!name) return "Имя обязательно";
  if (name.length > 80) return "Имя слишком длинное";

  if (!phone) return "Телефон обязателен";
  if (phone.length > 30) return "Телефон слишком длинный";
  if (!PHONE_PATTERN.test(phone)) return "Некорректный формат телефона";

  if (!executionDate) return "Дата выполнения обязательна";
  if (executionDate.length > 20) return "Дата выполнения слишком длинная";
  if (!DATE_PATTERN.test(executionDate)) return "Дата: используйте формат ГГГГ-ММ-ДД или ДД.ММ.ГГГГ";

  if (!address) return "Адрес обязателен";
  if (address.length > 220) return "Адрес слишком длинный";

  if (!pickupItems) return "Укажите, что нужно забрать";
  if (pickupItems.length > 600) return "Описание слишком длинное";

  if (
    Object.prototype.hasOwnProperty.call(payload, "elevatorAvailable")
      && typeof payload.elevatorAvailable !== "boolean"
  ) {
    return "Поле лифта должно быть boolean";
  }

  return null;
}

function asTrimmedString(value) {
  if (typeof value !== "string") return "";
  return value.trim();
}

async function sendLead(payload, env) {
  const botToken = getBotTokenOrThrow(env);
  const message = buildMessage(payload);
  const shareUrl = buildShareUrl(payload);
  const recipients = await resolveRecipients(botToken, env);

  if (recipients.length === 0) {
    throw new Error("No recipients configured");
  }

  const sendResults = await Promise.all(
    recipients.map((chatId) => sendToChat(botToken, chatId, message, shareUrl))
  );

  if (!sendResults.some(Boolean)) {
    throw new Error("Telegram rejected message for all recipients");
  }
}

function getBotTokenOrThrow(env) {
  const token = (env.TELEGRAM_BOT_TOKEN || "").trim();
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is empty");
  return token;
}

function buildMessage(payload) {
  const now = new Date().toLocaleString("ru-RU", { timeZone: "Asia/Bishkek", hour12: false });

  return [
    "<b>Новая заявка</b>",
    `Имя: <b>${escapeHtml(payload.name)}</b>`,
    `Телефон: <b>${escapeHtml(payload.phone)}</b>`,
    `Дата выполнения: <b>${escapeHtml(formatExecutionDate(payload.executionDate))}</b>`,
    `Адрес: <b>${escapeHtml(payload.address)}</b>`,
    `Лифт: <b>${escapeHtml(formatElevator(payload.elevatorAvailable))}</b>`,
    `Что нужно забрать: <b>${escapeHtml(payload.pickupItems)}</b>`,
    `Заявка принята: ${escapeHtml(now)}`,
  ].join("\n");
}

function buildShareUrl(payload) {
  const lines = [
    "Новый заказ Uberi",
    `Имя: ${payload.name}`,
    `Телефон: ${payload.phone}`,
    `Дата выполнения: ${formatExecutionDate(payload.executionDate)}`,
    `Адрес: ${payload.address}`,
    `Лифт: ${formatElevator(payload.elevatorAvailable)}`,
    `Что нужно забрать: ${payload.pickupItems}`,
  ];

  const text = encodeURIComponent(lines.join("\n"));
  const link = encodeURIComponent("https://t.me/uberi_ru_bot");
  return `https://t.me/share/url?url=${link}&text=${text}`;
}

function formatExecutionDate(value) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-");
    return `${day}.${month}.${year}`;
  }
  return value;
}

function formatElevator(value) {
  if (value === true) return "Есть";
  if (value === false) return "Нет";
  return "Не указано";
}

async function resolveRecipients(botToken, env) {
  const fallback = parseCsv((env.TELEGRAM_CHAT_ID || "").trim());
  const now = Date.now();

  let dynamic = recipientCache.chatIds;

  if (recipientCache.expiresAt <= now) {
    if (!recipientRefreshPromise) {
      recipientRefreshPromise = loadActivatedChatIds(botToken)
        .then((chatIds) => {
          recipientCache = {
            chatIds,
            expiresAt: Date.now() + CHAT_CACHE_TTL_MS,
          };
          return chatIds;
        })
        .catch((error) => {
          console.warn("Failed to refresh chat ids from Telegram:", error);
          return recipientCache.chatIds;
        })
        .finally(() => {
          recipientRefreshPromise = null;
        });
    }
    dynamic = await recipientRefreshPromise;
  }

  return Array.from(new Set([...fallback, ...dynamic]));
}

async function loadActivatedChatIds(botToken) {
  const response = await fetch(
    `https://api.telegram.org/bot${botToken}/getUpdates?limit=100`,
    { method: "GET" }
  );

  if (!response.ok) {
    throw new Error(`Telegram getUpdates failed: ${response.status}`);
  }

  const body = await response.json();
  if (!body || body.ok !== true || !Array.isArray(body.result)) {
    return [];
  }

  const chatIds = [];
  for (const update of body.result) {
    const message = update?.message;
    const chatId = message?.chat?.id;
    const type = message?.chat?.type;
    const text = (message?.text || "").trim();

    if (!chatId || type !== "private") continue;
    if (!text.startsWith("/start")) continue;
    chatIds.push(String(chatId));
  }

  return Array.from(new Set(chatIds));
}

function parseCsv(value) {
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

async function sendToChat(botToken, chatId, message, shareUrl) {
  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [{ text: "Поделиться заказом", url: shareUrl }],
          ],
        },
      }),
    });

    if (!response.ok) {
      console.warn(`Telegram HTTP ${response.status} for chat ${chatId}`);
      return false;
    }

    const body = await response.json();
    if (!body || body.ok !== true) {
      console.warn(`Telegram rejected message for chat ${chatId}:`, body?.description || "unknown");
      return false;
    }

    return true;
  } catch (error) {
    console.warn(`Failed to send Telegram message to chat ${chatId}:`, error);
    return false;
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
