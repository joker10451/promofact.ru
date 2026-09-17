import fs from "node:fs";

const env = fs.readFileSync(".env.local", "utf8");
const match = env.match(/PERFLUENCE_WIDGET_URL=["']?([^"'\r\n]+)/);
const widgetUrl = match ? match[1] : "";

async function main() {
  const res = await fetch(widgetUrl);
  const data = await res.json();
  const items = data.data || [];

  console.log(`Всего проектов: ${items.length}`);
  const list = items.map(item => {
    const p = item.project || item.shop || item;
    const groups = item.groups || [item];
    const promos = groups.flatMap(g => g.promocodes || []);
    return {
      name: p.name || p.store_name,
      id: p.id || p.project_id,
      category: p.category_name || p.category,
      promosCount: promos.length,
      sampleCode: promos[0]?.code,
      sampleBonus: promos[0]?.bonus_name
    };
  });
  console.log(JSON.stringify(list, null, 2));
}

main().catch(console.error);
