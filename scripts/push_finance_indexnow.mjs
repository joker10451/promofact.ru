import { submitIndexNowBatch } from "./indexnow-push.mjs";

async function main() {
  const urls = [
    "https://promofact.ru/store/t-bank",
    "https://promofact.ru/store/alfa-bank",
    "https://promofact.ru/store/yandex-pay",
    "https://promofact.ru/store/zenit",
    "https://promofact.ru/store/otp-bank",
    "https://promofact.ru/collections/finansy-i-karty",
  ];
  console.log("Submitting IndexNow batch:", urls);
  const res = await submitIndexNowBatch(urls);
  console.log("IndexNow submission result:", res);
}

main().catch(console.error);
