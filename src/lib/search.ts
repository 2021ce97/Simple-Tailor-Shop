const ARABIC_INDIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';
const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';

/** Converts Arabic-Indic and Persian digits to ASCII without changing letters. */
export const normalizeDigits = (value: unknown): string =>
  String(value ?? '').replace(/[٠-٩۰-۹]/g, digit => {
    const arabicIndex = ARABIC_INDIC_DIGITS.indexOf(digit);
    return String(arabicIndex >= 0 ? arabicIndex : PERSIAN_DIGITS.indexOf(digit));
  });

/**
 * Produces consistent searchable text for English, Dari, and Pashto.
 * It tolerates Arabic/Persian keyboard variants, diacritics, joiners, spacing,
 * and localized digits while preserving Pashto-specific letters.
 */
export const searchText = (value: unknown): string =>
  normalizeDigits(value)
    .normalize('NFKD')
    .toLocaleLowerCase()
    .replace(/[ً-ٰٟۖ-ۭ]/g, '')
    .replace(/[يىئ]/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/[‌‍‎‏⁦-⁩]/g, ' ')
    .replace(/[_\-./\\()[\]{}:،؛,]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const textIncludes = (value: unknown, query: string): boolean =>
  searchText(value).includes(searchText(query));
