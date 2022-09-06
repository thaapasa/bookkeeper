/**
 * Returns a template string function that joins the non-empty elements with
 * the given element.
 *
 * The string content in the actual template string is discarded, so you can
 * just put the elements together or add example content between them to hint
 * at the proper end result.
 *
 * ```ts
 * const s = joinStr(", ")`${"A"} ${null} ${"B"} ${null}`
 * // s is "A, B"
 * const s2 = joinStr(", ", "(", ")")`${"A"} ${null} ${"B"} ${null}`
 * // s is "(A, B)"
 * ```
 *
 * @return the template keys, joined together with the given elements
 */
export function joinStr(joiner: string, prefix = '', suffix = '') {
  return (_strings: TemplateStringsArray, ...keys: any[]) =>
    prefix +
    keys
      .filter(v => !(v === undefined || v === null || v === ''))
      .join(joiner) +
    suffix;
}

/**
 * Constructs a string with correct spacing between the given input strings.
 * If some elements are missing (null, undefiend, or empty strings), the extra
 * spaces around those elements are removed.
 *
 * The string content in the actual template string is discarded, so you can
 * just put the elements together or add spaces between them to hint at the
 * proper end result.
 *
 * ```ts
 * const s = spaced`${"A"} ${null} ${"B"} ${null}`
 * // s is "A B"
 * ```
 *
 * @return the template keys, spaced properly
 */
export const spaced = joinStr(' ');
