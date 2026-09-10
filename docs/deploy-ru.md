# Развёртывание на российском хостинге

## Зачем

IP-адреса Vercel (`76.76.21.21` и диапазоны `cname.vercel-dns.com`) недоступны
из России на уровне провайдеров — TCP до них не устанавливается, ICMP не проходит.
Сайт открывается только через VPN. Домен `promofact.ru` при этом чист: DNS
резолвится корректно, в реестр блокировок домен не попал.

Проверить состояние можно так (без VPN):

```
Test-NetConnection 76.76.21.21 -Port 443
```

`TcpTestSucceeded: False` — блокировка по IP, лечится только сменой хостинга.

## Что потребовалось изменить в коде

Практически ничего. Из двух генераторов OG-картинок убран `export const runtime = "edge"`.
Edge Runtime в Next 16 предназначен для `proxy.ts` и **не поддерживает ISR**,
на котором построен сайт (`revalidate = 1800`). На одном сервере он даёт только
ограничения, поэтому используется штатный Node.js-рантайм.

Остальное по документации Next 16 работает при `next start` без конфигурации:

- оптимизация `next/image` — zero config (`sharp` идёт в составе Next);
- `src/proxy.ts` — zero config;
- ISR и кэш — автоматически, при условии **постоянного диска** у сервера.

Важно: ISR хранит кэш на локальном диске экземпляра. Поэтому нужен один
процесс `next start` с обычным диском, а не эфемерная serverless-среда.

## Требования сервера

- Node.js 20+
- 2 ГБ RAM минимум (сборка тянет большой фид Admitad)
- постоянный диск
- nginx как reverse-proxy (рекомендация документации Next)

## Установка

```
git clone <репозиторий> /var/www/promofact
cd /var/www/promofact
npm ci
npm run build
```

## Переменные окружения

Задать в `.env.production` на сервере (значения — из панели Vercel, в репозиторий не коммитить):

```
ADMITAD_FEED_URL
PERFLUENCE_WIDGET_URL
PERFLUENCE_RESULTS_URL
SALEADS_FEED_URL
TELEGRAM_BOT_TOKEN
TELEGRAM_CHANNEL_ID
TELEGRAM_POSTING_SECRET
CRON_SECRET
```

Права на файл: `chmod 600 .env.production`.

## systemd-юнит

`/etc/systemd/system/promofact.service`:

```
[Unit]
Description=promofact.ru (Next.js)
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/promofact
EnvironmentFile=/var/www/promofact/.env.production
ExecStart=/usr/bin/npm run start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```
systemctl enable --now promofact
```

## nginx

```
server {
    listen 443 ssl http2;
    server_name promofact.ru www.promofact.ru;

    # ssl_certificate / ssl_certificate_key — выдаёт certbot

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Сертификат: `certbot --nginx -d promofact.ru -d www.promofact.ru`.

## Переключение DNS

Выполнять **после** того, как сервер отвечает по своему IP.

- `promofact.ru` — запись `A` на IP сервера (вместо `76.76.21.21`)
- `www.promofact.ru` — запись `A` на тот же IP (вместо CNAME на Vercel)

TTL заранее снизить до 300 секунд, чтобы переключение прошло быстро.

## Автозадачи

Расписания живут в `.github/workflows/` и обращаются к сайту по домену.
Так как домен не меняется, после переключения DNS они продолжат работать.
Секреты GitHub Actions менять не требуется.

## Проверка после переезда

```
curl -sI https://promofact.ru/ | head -5
curl -s https://promofact.ru/sitemap.xml | head -5
```

Ожидается `200 OK` и отсутствие заголовка `Server: Vercel`.
