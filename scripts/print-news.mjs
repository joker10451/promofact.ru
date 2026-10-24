import fs from 'node:fs';

const news = JSON.parse(fs.readFileSync('./data/perfluence_news_raw.json', 'utf8'));
const notifs = JSON.parse(fs.readFileSync('./data/perfluence_notifs_raw.json', 'utf8'));

console.log('=== LATEST NEWS (FIRST 20) ===');
news.data.slice(0, 20).forEach((item, i) => {
  console.log(`\n[News ${i+1}] ${item.event_at} (${item.date_text} ${item.time_text})`);
  console.log(`Title: ${item.title}`);
  for (const [k, v] of Object.entries(item)) {
    if (!['id', 'image', 'is_viewed', 'viewed_at', 'category'].includes(k)) {
      console.log(`  ${k}: ${typeof v === 'string' ? v.slice(0, 150) : JSON.stringify(v)}`);
    }
  }
});

console.log('\n\n=== LATEST NOTIFICATIONS (FIRST 20) ===');
notifs.data.slice(0, 20).forEach((item, i) => {
  console.log(`\n[Notif ${i+1}] ${item.event_at} (${item.date_text} ${item.time_text})`);
  console.log(`Title: ${item.title}`);
  for (const [k, v] of Object.entries(item)) {
    if (!['id', 'image', 'is_viewed', 'viewed_at', 'category'].includes(k)) {
      console.log(`  ${k}: ${typeof v === 'string' ? v.slice(0, 150) : JSON.stringify(v)}`);
    }
  }
});
