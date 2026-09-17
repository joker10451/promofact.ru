/**
 * scripts/perfluence-earnings-monitor.mjs
 * 
 * Модуль автоматического мониторинга заказов, конверсий и заработка:
 * 1. Опрашивает официальный API результатов Perfluence (PERFLUENCE_RESULTS_URL).
 * 2. Мгновенно выявляет новые заказы подписчиков по вашим промокодам.
 * 3. Отправляет пуш-уведомление администратору в Telegram (ADMIN_CHAT_ID) о каждом начислении.
 * 4. Формирует финансовую сводку (за сегодня, за неделю, итого).
 */

import fs from "node:fs";
import path from "node:path";

const NOTIFIED_FILE = path.join(process.cwd(), "data", "notified_orders.json");

function getEnvConfig() {
  let resultsUrl = process.env.PERFLUENCE_RESULTS_URL;
  let botToken = process.env.TELEGRAM_BOT_TOKEN;
  let adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;

  if (fs.existsSync(".env.local")) {
    const content = fs.readFileSync(".env.local", "utf8");
    const mUrl = content.match(/PERFLUENCE_RESULTS_URL\s*=\s*["']?([^"'\r\n]+)/);
    const mBot = content.match(/TELEGRAM_BOT_TOKEN\s*=\s*["']?([^"'\r\n]+)/);
    const mAdm = content.match(/TELEGRAM_ADMIN_CHAT_ID\s*=\s*["']?([^"'\r\n]+)/);
    if (mUrl && !resultsUrl) resultsUrl = mUrl[1].trim();
    if (mBot && !botToken) botToken = mBot[1].trim();
    if (mAdm && !adminChatId) adminChatId = mAdm[1].trim();
  }

  return { resultsUrl, botToken, adminChatId: adminChatId || "6141363106" };
}

function loadNotifiedOrders() {
  if (!fs.existsSync(NOTIFIED_FILE)) {
    return new Set();
  }
  try {
    const list = JSON.parse(fs.readFileSync(NOTIFIED_FILE, "utf8"));
    return new Set(Array.isArray(list) ? list : []);
  } catch {
    return new Set();
  }
}

function saveNotifiedOrders(orderIdsSet) {
  const dataDir = path.dirname(NOTIFIED_FILE);
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(NOTIFIED_FILE, JSON.stringify([...orderIdsSet], null, 2), "utf8");
}

/**
 * Проверяет новые заказы и присылает уведомления админу в Telegram
 */
export async function checkNewEarnings(options = { notify: true }) {
  const { resultsUrl, botToken, adminChatId } = getEnvConfig();
  if (!resultsUrl) {
    console.warn("[Earnings] PERFLUENCE_RESULTS_URL не настроен.");
    return { newOrders: [], totalRub: 0 };
  }

  try {
    const res = await fetch(resultsUrl);
    if (!res.ok) {
      console.warn(`[Earnings] HTTP ${res.status} при запросе результатов.`);
      return { newOrders: [], totalRub: 0 };
    }

    const json = await res.json();
    const items = Array.isArray(json.data) ? json.data : [];

    const notifiedSet = loadNotifiedOrders();
    const isFirstRun = notifiedSet.size === 0;
    const newOrders = [];

    let totalRub = 0;
    const projectStats = {};

    for (const item of items) {
      const feeMatch = (item.fee || "").match(/[\d\s]+(?:,\d+)?/);
      const rub = feeMatch ? parseFloat(feeMatch[0].replace(/\s/g, "").replace(",", ".")) : 0;
      totalRub += rub;

      const projName = item.project?.name || "Магазин";
      projectStats[projName] = (projectStats[projName] || 0) + rub;

      const orderKey = `${item.datetime}_${item.promocode}_${item.fee}_${item.project?.id || ""}`;

      if (!notifiedSet.has(orderKey)) {
        newOrders.push({ ...item, rub, orderKey });
        notifiedSet.add(orderKey);
      }
    }

    // Сохраняем обновленный реестр
    saveNotifiedOrders(notifiedSet);

    // Если это первый запуск — просто сохраняем историю без спама 21 старым заказом
    if (isFirstRun) {
      console.log(`[Earnings] Инициализация: загружено ${items.length} существующих заказов (всего ${totalRub.toLocaleString("ru-RU")} ₽).`);
      return { newOrders: [], totalRub, totalOrders: items.length, projectStats };
    }

    // Если появились новые заказы — отправляем уведомление админу
    if (options.notify && newOrders.length > 0 && botToken && adminChatId) {
      console.log(`[Earnings] 🎉 Обнаружено ${newOrders.length} новых заказов! Отправка уведомлений...`);
      for (const order of newOrders) {
        const msg = [
          `💰 <b>НОВЫЙ ЗАКАЗ ПО ПРОМОКОДУ!</b>\n`,
          `🏬 Магазин: <b>${order.project?.name || "Партнер"}</b>`,
          `🎟 Промокод: <code>${order.promocode}</code>`,
          `💵 Начислено: <b>${order.fee}</b>`,
          order.comment ? `📝 Акция: ${order.comment}` : "",
          `📅 Дата: ${order.datetime}`
        ].filter(Boolean).join("\n");

        try {
          await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: adminChatId,
              text: msg,
              parse_mode: "HTML"
            })
          });
        } catch (e) {
          console.warn("[Earnings] Ошибка отправки пуша в Telegram:", e.message);
        }
      }
    }

    return {
      newOrders,
      totalRub,
      totalOrders: items.length,
      projectStats
    };
  } catch (err) {
    console.warn("[Earnings] Исключение при проверке заработка:", err.message);
    return { newOrders: [], totalRub: 0 };
  }
}

// Тестовый запуск
if (process.argv[1]?.includes("perfluence-earnings-monitor.mjs")) {
  checkNewEarnings({ notify: true }).then(res => {
    console.log("\nРезультаты мониторинга доходов:");
    console.log(`  Всего начислений: ${res.totalRub?.toLocaleString("ru-RU")} ₽ (${res.totalOrders} заказов)`);
    console.log("  Новых заказов в этом прогоне:", res.newOrders.length);
    console.log("  Доход по магазинам:", res.projectStats);
  });
}
