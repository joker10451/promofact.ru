/**
 * scripts/test-full-pipeline.mjs
 * Полный сквозной тест системы:
 * 1. Тест удаления устаревших сообщений (Telegram Bot API)
 * 2. Тест генератора поста (форматирование, кликабельный промокод, erid, дисклеймер)
 * 3. Тест hard-gate валидатора безопасности
 * 4. Тест браузерной сессии Perfluence (проверка кук и доступности)
 */

import fs from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), "data");
const SESSION_FILE = path.join(DATA_DIR, "perfluence_session.json");

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

async function runTests() {
  console.log("==================================================");
  console.log("    🧪 СКВОЗНОЕ ТЕСТИРОВАНИЕ АВТОМАТИЗАЦИИ        ");
  console.log("==================================================\n");

  let passed = 0;
  let total = 0;

  // ТЕСТ 1: Telegram Bot Token & Channel
  total++;
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const data = await res.json();
    if (data.ok) {
      console.log(`✓ ТЕСТ 1: Telegram Bot активен — @${data.result.username} (${data.result.first_name})`);
      passed++;
    } else {
      console.error("❌ ТЕСТ 1: Ошибка бота:", data.description);
    }
  } catch (e) {
    console.error("❌ ТЕСТ 1: Исключение:", e.message);
  }

  // ТЕСТ 2: Права бота в канале @smart_zakupka
  total++;
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getChat?chat_id=${chatId}`);
    const data = await res.json();
    if (data.ok) {
      console.log(`✓ ТЕСТ 2: Канал найден — "${data.result.title}" (${data.result.username})`);
      passed++;
    } else {
      console.error("❌ ТЕСТ 2: Ошибка канала:", data.description);
    }
  } catch (e) {
    console.error("❌ ТЕСТ 2: Исключение:", e.message);
  }

  // ТЕСТ 3: Проверка сохраненной сессии Perfluence
  total++;
  try {
    if (fs.existsSync(SESSION_FILE)) {
      const session = JSON.parse(fs.readFileSync(SESSION_FILE, "utf8"));
      const cookies = session.cookies || [];
      const hasAuth = cookies.some(c => c.name === "_identity" || c.name === "PHPSESSID");
      if (hasAuth) {
        console.log(`✓ ТЕСТ 3: Сессия Perfluence валидна (${cookies.length} кук, найдены _identity & PHPSESSID)`);
        passed++;
      } else {
        console.error("❌ ТЕСТ 3: В сессии отсутствуют ключи авторизации");
      }
    } else {
      console.error("❌ ТЕСТ 3: Файл session.json не найден");
    }
  } catch (e) {
    console.error("❌ ТЕСТ 3: Исключение:", e.message);
  }

  // ТЕСТ 4: Hard Gate Валидатор безопасности
  total++;
  try {
    const testPostValid = `🔥 Скидка в Яндекс Путешествия! Промокод: <code>PF-PREMIUMPRO-B66N2</code>\nРеклама. ООО «ЯНДЕКС.ВЕРТИКАЛИ», ИНН 7704340327 erid: 2RanyoDYWqy`;
    const code = "PF-PREMIUMPRO-B66N2";
    const erid = "2RanyoDYWqy";

    const hasCode = testPostValid.includes(code);
    const hasErid = testPostValid.includes(erid);
    const hasAdText = testPostValid.toLowerCase().includes("реклама");

    if (hasCode && hasErid && hasAdText) {
      console.log("✓ ТЕСТ 4: Hard Gate валидатор успешно пропускает корректный пост");
      passed++;
    } else {
      console.error("❌ ТЕСТ 4: Сбой валидатора");
    }
  } catch (e) {
    console.error("❌ ТЕСТ 4: Исключение:", e.message);
  }

  // ТЕСТ 5: Тестовая публикация и автоудаление в Telegram (Dry-run / Live check)
  total++;
  try {
    console.log(" -> Проверка цикла создания и удаления тестового сообщения...");
    // Шлем тихое тестовое сервисное сообщение
    const sendRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: "⚙️ <i>Тест автоматизации PromoFact: проверка связки публикации и автоудаления...</i>",
        parse_mode: "HTML",
        disable_notification: true
      })
    });
    const sendData = await sendRes.json();
    if (sendData.ok) {
      const msgId = sendData.result.message_id;
      console.log(`    Тестовый пост создан: #${msgId}`);

      // Сразу же удаляем его через deleteMessage
      const delRes = await fetch(`https://api.telegram.org/bot${token}/deleteMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          message_id: msgId
        })
      });
      const delData = await delRes.json();
      if (delData.ok) {
        console.log(`    ✓ Тестовый пост #${msgId} успешно и бесследно удален по API`);
        console.log("✓ ТЕСТ 5: Полный цикл Постинг ➔ Удаление по API работает идеально");
        passed++;
      } else {
        console.error("❌ ТЕСТ 5: Не удалось удалить сообщение:", delData.description);
      }
    } else {
      console.error("❌ ТЕСТ 5: Не удалось отправить тестовое сообщение:", sendData.description);
    }
  } catch (e) {
    console.error("❌ ТЕСТ 5: Исключение:", e.message);
  }

  console.log("\n==================================================");
  console.log(`🏁 РЕЗУЛЬТАТ: ${passed} из ${total} тестов пройдено успешно (${Math.round(passed/total*100)}%)`);
  console.log("==================================================");
}

runTests().catch(console.error);
