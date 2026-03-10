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
  "phone": "+7 (933) 711-33-06"
}
```

## Telegram

По умолчанию используется:
- bot token из переменной окружения `TELEGRAM_BOT_TOKEN`
- chat-id: `1664044922` (личный чат администратора, который написал `/start` боту)

Если нужно, переопределите через переменные окружения:

```bash
export TELEGRAM_BOT_TOKEN='YOUR_TOKEN'
export TELEGRAM_CHAT_ID='1664044922'
```

Важно: бот должен быть добавлен в канал и иметь право писать сообщения.
Для приватного канала вместо username обычно нужен chat id вида `-100...`.
Инвайт-ссылка вида `https://t.me/+...` не используется как `chat_id` в Telegram Bot API.
