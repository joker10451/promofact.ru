/**
 * scripts/cleanup-expired-posts.mjs
 * Автоудаление протухших постов из Telegram-канала по наступлению дедлайна.
 * 
 * Читает историю data/posted_promos.json.
 * Если у промокода наступил expires — вызывает deleteMessage в Telegram API.
 */

import fs from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), "data");
const HISTORY_FILE = path.join(DATA_DIR, "posted_promos.json");

// Читаем .env.local
const envContent = fs.existsSync(".env.local") ? fs.readFileSync(".env.local", "utf8") : "";
const env = {};
for (const line of envContent.split("\n")) {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let val = match[2] || "";
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[match[1]] = val;
  }
}

const token = env.TELEGRAM_BOT_TOKEN;
const chatId = env.TELEGRAM_CHANNEL_ID || "@smart_zakupka";

async function deleteTelegramMessage(messageId) {
  const url = `https://api.telegram.org/bot${token}/deleteMessage`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: messageId
    })
  });
  const data = await res.json();
  return data;
}

async function main() {
  if (!fs.existsSync(HISTORY_FILE)) {
    console.log("[Cleanup] Файл истории posted_promos.json не найден.");
    return;
  }

  const raw = fs.readFileSync(HISTORY_FILE, "utf8");
  const data = JSON.parse(raw);
  const history = Array.isArray(data.history) ? data.history : [];

  console.log(`[Cleanup] Всего постов в истории: ${history.length}`);
  const now = Date.now();
  let updated = false;

  for (const item of history) {
    if (item.deleted || !item.messageId) continue;

    // Если указана дата окончания оффера
    if (item.expires) {
      const expTime = new Date(`${item.expires}T23:59:59`).getTime();
      if (now > expTime) {
        console.log(`[Cleanup] Срок действия оффера "${item.store}" (${item.code}) истек ${item.expires}. Удаление сообщения #${item.messageId}...`);
        
        try {
          const res = await deleteTelegramMessage(item.messageId);
          if (res.ok) {
            console.log(`[Cleanup] ✓ Сообщение #${item.messageId} удалено из ${chatId}`);
            item.deleted = true;
            item.deletedAt = new Date().toISOString();
            updated = true;
          } else {
            console.warn(`[Cleanup] ⚠ Не удалось удалить сообщение #${item.messageId}:`, res.description);
          }
        } catch (err) {
          console.error(`[Cleanup] Ошибка удаления #${item.messageId}:`, err.message);
        }
      }
    }
  }

  if (updated) {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(data, null, 2), "utf8");
    console.log("[Cleanup] История обновлена.");
  } else {
    console.log("[Cleanup] Нет просроченных постов для удаления.");
  }
}

main().catch(err => {
  console.error("[Cleanup] Фатальная ошибка:", err);
  process.exit(1);
});
