# uberi-spring-backend

Spring Boot API для приёма заявок с фронта и отправки в Telegram канал.

## Запуск

```bash
cd /Users/mak/Desktop/uberi-spring-backend
mvn spring-boot:run
```

API будет доступен на `http://localhost:8082`.

## Endpoint

`POST /api/leads`

```json
{
  "name": "Руслан",
  "phone": "+7 967 257-64-36",
  "executionDate": "2026-03-11",
  "executionTime": "15:00 - 21:00",
  "address": "область, город, улица, дом",
  "pickupItems": "диван, холодильник",
  "clientPayment": "5000 ₽"
}
```

## Telegram

По умолчанию используется:
- bot token из переменной окружения `TELEGRAM_BOT_TOKEN`
- chat-id: `1664044922` как резервный получатель (`TELEGRAM_CHAT_ID`)

Также backend автоматически отправляет заявки в личные чаты всех пользователей,
которые написали `/start` боту (получатели берутся из Telegram `getUpdates`).

Если нужно, переопределите через переменные окружения:

```bash
export TELEGRAM_BOT_TOKEN='YOUR_TOKEN'
export TELEGRAM_CHAT_ID='1664044922'
```

Важно: бот должен быть добавлен в канал и иметь право писать сообщения.
Для приватного канала вместо username обычно нужен chat id вида `-100...`.
Инвайт-ссылка вида `https://t.me/+...` не используется как `chat_id` в Telegram Bot API.
