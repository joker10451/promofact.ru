/**
 * Статьи, намеренно удалённые из базы знаний.
 *
 * 25 октября 2026 из /sovety убрали 32 тонкие статьи: дубли друг друга и
 * темы без единой страницы каталога (аптека, книги, АЗС, ЖКХ, связь).
 * Средняя длина у них была 150–220 слов — такие страницы не ранжируются,
 * а при массовости тянут вниз весь домен за «малоценные страницы».
 *
 * Удалять их как 404 неправильно: 404 говорит поисковику «здесь ничего и
 * никогда не было», и он держит URL в очереди обхода ещё месяцами. Код
 * 410 Gone — прямой сигнал «страница удалена намеренно», после которого
 * URL выпадает из индекса заметно быстрее.
 *
 * Список должен оставаться неизменным: если статья вернётся, её slug надо
 * убрать отсюда, иначе она снова начнёт отдавать 410.
 */
export const GONE_ARTICLE_SLUGS: ReadonlySet<string> = new Set([
  "ekonomim-na-dostavke-edy",
  "kak-ekonomit-na-dostavke-edy-i-sushi",
  "ekspress-dostavka-skidki",
  "ekonomim-na-apteke",
  "skidki-na-lekarstva",
  "keshbek-na-produkty",
  "vybrat-vygodnyy-promokod",
  "podpiski-so-skidkoy",
  "ekonomia-na-puteshestviyah-avto",
  "kak-poluchit-skidku-na-tsvety",
  "ekonomim-na-zhkh",
  "skidki-na-odezhdu-i-obuv",
  "skidki-na-mebel-i-tovary-dlya-doma",
  "besplatnye-uslugi-i-lgoty",
  "ekonomim-na-svyazi",
  "podarochnye-sertifikaty-skidki",
  "vozvrat-tovara-i-skidka",
  "kak-oplachivat-zarubezhnye-servisy-2026",
  "gid-po-promokodam-yves-rocher",
  "promokody-na-tehniku",
  "skidki-na-knigi",
  "cashbek-na-azs",
  "promokody-fix-price-akcii",
  "deti-so-skidkoy",
  "semnyy-byudzhet-10-privychek",
  "kak-kopit-dengi",
  "byudzhet-dlya-studenta",
  "kak-ekonomit-v-internete",
  "ne-pereplychivat-na-rasprodazhah",
  "yandeks-puteshestviya-oteli-promokod",
  "kak-sekonomit-na-pechati-foto-netprint",
  "promokody-kinopoisk-yandex-plus",
]);

export function isGoneArticle(slug: string): boolean {
  return GONE_ARTICLE_SLUGS.has(slug);
}
