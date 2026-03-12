# Uberi Fullstack Deploy

В этом репозитории:
- `frontend` — React приложение
- `backend` — Spring Boot API + Telegram отправка

## Прод URL

- Frontend: `https://uberi-vyvoz.fly.dev`
- Backend API: `https://uberi-api-vyvoz.fly.dev`

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

## Fly.io деплой (без простоя и холодного старта)

```bash
cd backend
flyctl deploy --remote-only

cd ../frontend
flyctl deploy --remote-only
```

Конфигурация в `frontend/fly.toml` и `backend/fly.toml` настроена на постоянный ран (`min_machines_running = 1`), чтобы убрать долгий первый запрос после простоя.

## Обновление

```bash
git pull
docker compose up -d --build
```
