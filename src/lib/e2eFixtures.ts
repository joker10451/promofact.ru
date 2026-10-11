import type { Coupon } from "@/lib/types";

/**
 * Изолированные синтетические данные E2E для магазина FARFOR.
 * Подключаются исключительно при CI тестовой сборке и запуске Playwright (E2E_FIXTURES=true).
 * Не попадают в Production-сборку и не модифицируют реальный perfluence-feed.json.
 */
export function getE2EFixtureCoupons(): Coupon[] {
  return [
    {
      id: 99233301,
      promocode: {
        id: 99233301,
        code: "FARFORTEST1",
        bonusName: "Скидка 500 ₽ на первый заказ от 1500 ₽",
        terms: "Скидка 500 ₽ на первый заказ от 1500 ₽ в ресторане доставки FARFOR. Синтетическая тестовая фикстура для новых клиентов.",
        expires: "2028-12-31",
        isHit: true,
        isUniversal: false,
        isFirstOrderOnly: true,
        region: null,
        isBarcode: false,
        barcodeImage: null,
        group: null,
      },
      store: {
        id: 2333,
        name: "FARFOR",
        slug: "farfor",
        logo: "/media/p/1/6/8/1683f7ba-0c46-4e81-bb29-1cecc344e29c.jpg",
        category: "Доставка из ресторанов",
        categorySlug: "dostavka-iz-restoranov",
        about: "FARFOR — федеральная сеть ресторанов доставки готовой еды. Синтетическая тестовая витрина для сценариев Playwright E2E.",
        conditions: "Тестовые условия акции FARFOR для автоматизированных сценариев E2E.",
        site: "https://farfor.ru",
        activeBloggers: 1200,
      },
      affiliate: {
        link: "https://farfor.prfl.me/sites/test-e2e?erid=test-farfor-e2e-2026",
        landingLink: "https://farfor.prfl.me/sites/test-e2e?erid=test-farfor-e2e-2026",
        ordMarker: "test-farfor-e2e-2026",
        ordText: "Реклама. ООО «Фарфор Франчайзинг», ИНН 0278189874, erid: test-farfor-e2e-2026. Синтетическая тестовая фикстура E2E.",
      },
      extraLinks: [],
    },
    {
      id: 99233302,
      promocode: {
        id: 99233302,
        code: "FARFORTEST2",
        bonusName: "Скидка 15% на повторный заказ от 2000 ₽",
        terms: "Скидка 15% на повторный заказ от 2000 ₽ в ресторане доставки FARFOR для постоянных клиентов. Синтетическая тестовая фикстура.",
        expires: "2028-12-31",
        isHit: false,
        isUniversal: true,
        isFirstOrderOnly: false,
        region: null,
        isBarcode: false,
        barcodeImage: null,
        group: null,
      },
      store: {
        id: 2333,
        name: "FARFOR",
        slug: "farfor",
        logo: "/media/p/1/6/8/1683f7ba-0c46-4e81-bb29-1cecc344e29c.jpg",
        category: "Доставка из ресторанов",
        categorySlug: "dostavka-iz-restoranov",
        about: "FARFOR — федеральная сеть ресторанов доставки готовой еды. Синтетическая тестовая витрина для сценариев Playwright E2E.",
        conditions: "Тестовые условия акции FARFOR для автоматизированных сценариев E2E.",
        site: "https://farfor.ru",
        activeBloggers: 1200,
      },
      affiliate: {
        link: "https://farfor.prfl.me/sites/test-e2e?erid=test-farfor-e2e-2026",
        landingLink: "https://farfor.prfl.me/sites/test-e2e?erid=test-farfor-e2e-2026",
        ordMarker: "test-farfor-e2e-2026",
        ordText: "Реклама. ООО «Фарфор Франчайзинг», ИНН 0278189874, erid: test-farfor-e2e-2026. Синтетическая тестовая фикстура E2E.",
      },
      extraLinks: [],
    },
  ];
}
