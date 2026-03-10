# Uberi Fullstack Deploy

В этом репозитории:
- `frontend` — React приложение
- `backend` — Spring Boot API + Telegram отправка

## Быстрый деплой на удалённый сервер (Ubuntu + Docker)

1. Установите Docker и Docker Compose plugin.
2. Скопируйте `.env.example` в `.env`:

```bash
cp .env.example .env
```

3. Укажите в `.env` реальный `TELEGRAM_BOT_TOKEN`.
4. Запустите:

```bash
docker compose up -d --build
```

Приложение будет доступно на `http://SERVER_IP`.

## Обновление

```bash
git pull
docker compose up -d --build
```
