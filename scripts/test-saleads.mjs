const TOKEN = "MWGsbY61i1pGZQQgSku1HPe58RTdg1wZyUBCV4Mo58kY7PGextvwiXWIWpPO0FdW";
const STAND_UUID = "0f94a390-98cd-11f1-8ca9-2f558d76c573";

async function fetchWithRetry(url, options = {}, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(25000),
      });
      return res;
    } catch (e) {
      console.log(`Попытка ${i + 1} (${e.message}), повторяем...`);
      if (i === retries - 1) throw e;
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
}

async function main() {
  console.log("Получение списка офферов...");
  const resShop = await fetchWithRetry("https://saleads.pro/api/v1/offer?limit=30&offer_category_id=4", {
    headers: { Authorization: `Bearer ${TOKEN}`, Accept: "application/json" },
  }).then((r) => r.json());

  const targetNames = [
    "Литрес",
    "ТВОЕ",
    "Технопарк",
    "Justfood",
    "Librederm",
    "ВсеИнструменты",
  ];

  const matched = (resShop.data || []).filter((o) =>
    targetNames.some((t) => o.name.toLowerCase().includes(t.toLowerCase()))
  );

  console.log(`Найдено офферов: ${matched.length}`);

  for (const offer of matched) {
    console.log(`\nПодключаем: ${offer.name}...`);
    try {
      const resConn = await fetchWithRetry("https://saleads.pro/api/v1/connector/get-or-create", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          offer_uuid: offer.uuid,
          stand_uuid: STAND_UUID,
        }),
      });
      const connData = await resConn.json();
      console.log(`✓ Подключен: ${offer.name}`);
      console.log("Ссылки:", JSON.stringify(connData?.urls, null, 2));
    } catch (e) {
      console.error("Ошибка:", e.message);
    }
  }
}

main().catch(console.error);
