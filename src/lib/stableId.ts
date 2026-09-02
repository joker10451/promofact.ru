/**
 * Детерминированные идентификаторы для купонов из внешних фидов.
 *
 * Зачем: у Saleads купонам без id раньше присваивался Math.random(), а
 * магазинам — константа 80000. Из-за первого id менялся на каждом рендере
 * (React key прыгает, статистика по купону не сходится), из-за второго все
 * безымянные магазины схлопывались в один (CouponGrid группирует по store.id).
 *
 * Здесь id считается из смысловых полей (слаг магазина, код купона), поэтому
 * стабилен между рендерами и деплоями, а «полосы» гарантируют, что id из
 * разных сетей не столкнутся между собой и с id Perfluence/Admitad.
 */

const BAND_SIZE = 2 ** 32;

/** Полосы номеров: каждая сеть и тип сущности живут в своём диапазоне. */
export const ID_BANDS = {
  saleadsStore: 3 * BAND_SIZE,
  saleadsCoupon: 4 * BAND_SIZE,
} as const;

/** Разделитель частей ключа: не встречается ни в слагах, ни в кодах. */
const SEP = String.fromCharCode(0);

/** FNV-1a, 32 бита. Быстрая некриптографическая хеш-функция. */
export function hash32(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Идентификатор внутри полосы. Части склеиваются через разделитель, чтобы
 * ("ab", "c") и ("a", "bc") давали разные значения.
 */
export function bandedId(band: number, ...parts: (string | number)[]): number {
  return band + hash32(parts.join(SEP));
}
