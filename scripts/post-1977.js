const fs = require('fs');

async function main() {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const getEnv = (key) => {
    const match = envContent.match(new RegExp(`^${key}="?([^"\\r\\n]+)"?`, 'm'));
    return match ? match[1] : process.env[key];
  };

  const botToken = getEnv('TELEGRAM_BOT_TOKEN');
  const channelId = getEnv('TELEGRAM_CHANNEL_ID');
  const vkToken = getEnv('VK_ACCESS_TOKEN');
  const vkOwnerId = getEnv('VK_OWNER_ID');

  console.log('TG bot configured:', Boolean(botToken && channelId));
  console.log('VK configured:', Boolean(vkToken && vkOwnerId));

  // --- 1. ПУБЛИКАЦИЯ В TELEGRAM ---
  if (botToken && channelId) {
    const tgText = [
      '🔥 <b>ХИТ! Скидка в Важная Рыба (СПб)</b>\n',
      '<b>Скидка 15% на каждый заказ от 3 999 ₽</b>\n',
      '🎟 Промокод: <code>SPTB1068</code> <i>(нажми, чтобы скопировать)</i>',
      '✨ <i>Для всех клиентов (повторные заказы тоже)</i>',
      '📍 <i>Санкт-Петербург и ЛО</i>',
      '⏰ Действует до 31 августа',
      '',
      '🍣 <i>Премиальная доставка суши, роллов и морепродуктов. Быстрая доставка от 30 минут и гарантия свежести!</i>',
      '',
      '👉 <a href="https://promofact.ru/store/vazhnaya-ryba/SPTB1068">Открыть купон на promofact.ru</a>\n',
      '<i>Реклама. ООО «КЕЙТЕРИНГ-РЕНТ», ИНН 7804597213. erid: 2Ranyo7Lmrb</i>'
    ].join('\n');

    const tgKeyboard = {
      inline_keyboard: [
        [
          { text: '🍣 Заказать со скидкой 15%', url: 'https://vipfish1.prfl.me/smart_zakupka/157okq?source=js-widget&source_id=8842' }
        ],
        [
          { text: '🎟 Все промокоды Важная Рыба', url: 'https://promofact.ru/store/vazhnaya-ryba' }
        ]
      ]
    };

    const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: channelId,
        text: tgText,
        parse_mode: 'HTML',
        reply_markup: tgKeyboard,
        disable_web_page_preview: false
      })
    });
    const tgData = await tgRes.json();
    console.log('Telegram Result:', JSON.stringify(tgData));
  }

  // --- 2. ПУБЛИКАЦИЯ В ВК ---
  if (vkToken && vkOwnerId) {
    let ownerId = vkOwnerId;
    if (!ownerId.startsWith('-') && !ownerId.startsWith('id')) {
      ownerId = `-${ownerId}`;
    }

    const vkText = [
      '🔥 Свежий промокод: Важная Рыба (Санкт-Петербург)!',
      '',
      '🎁 Скидка 15% при каждом заказе от 3 999 ₽',
      '📌 Действует на повторные заказы тоже. Быстрая доставка от 30 минут по Санкт-Петербургу и ЛО.',
      '',
      '🎟 Промокод: SPTB1068',
      '',
      '👉 Скопировать и применить: https://promofact.ru/store/vazhnaya-ryba/SPTB1068',
      '',
      '#скидки #доставка_еды #промокод #важная_рыба #промофакт'
    ].join('\n');

    const params = new URLSearchParams({
      v: '5.199',
      access_token: vkToken,
      owner_id: ownerId,
      from_group: '1',
      message: vkText,
    });

    const vkRes = await fetch('https://api.vk.com/method/wall.post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
    const vkData = await vkRes.json();
    console.log('VK Result:', JSON.stringify(vkData));
  }
}

main().catch(console.error);
