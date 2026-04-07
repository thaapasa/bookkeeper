import { Big, RoundingMode } from 'big.js';
import { z } from 'zod';
// Two decimal places
Big.DP = 2;
// Round down (truncate)
Big.RM = 0;

export type MoneyLike = string | number | Money | Big;

const MoneyLikeRE = /^-?[0-9]+(.[0-9]+)?$/;
export function isMoneyLike(e: unknown): e is MoneyLike {
  switch (typeof e) {
    case 'number':
      return true;
    case 'string':
      return MoneyLikeRE.test(e);
    case 'object':
      return (e !== null && Money.isMoney(e)) || Money.isBig(e);
    default:
      return false;
  }
}

const numberFormatOptions: Intl.NumberFormatOptions = {
  style: 'currency',
  currency: 'EUR',
  currencyDisplay: 'symbol',
  useGrouping: true,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
};

export type MoneySign = 'positive' | 'negative' | 'zero';

export class Money {
  public value: Big;

  public static toBig(m: MoneyLike): Big {
    if (Money.isBig(m)) {
      return m;
    } else if (Money.isMoney(m)) {
      return m.value;
    } else {
      return Big(m);
    }
  }

  public static toValue(m: MoneyLike): number {
    if (typeof m === 'number') {
      return m;
    }
    return parseInt(Money.from(m).value.times(100).round().toString(), 10) / 100;
  }

  public constructor(value: MoneyLike) {
    this.value = Money.toBig(value);
  }

  public static isMoney(value: unknown): value is Money {
    return value instanceof Money && Money.isBig(value.value);
  }

  public static isBig(value: unknown): value is Big {
    return value instanceof Big && typeof value.eq === 'function';
  }

  public static from(value: MoneyLike | null, defaultValue?: MoneyLike): Money {
    if (value === null || value === undefined) {
      if (defaultValue === undefined) {
        throw new Error('Money.from(undefined)');
      }
      return Money.from(defaultValue);
    }
    if (Money.isMoney(value)) {
      return value;
    }
    return new Money(typeof value === 'string' ? sanitizeMoneyInput(value) : value);
  }

  public static parse(value: MoneyLike | null): Money | undefined {
    if (value === null || value === undefined) return;
    try {
      return Money.from(value);
    } catch {
      return;
    }
  }

  public static toString(value: MoneyLike) {
    return Money.from(value).toString();
  }

  public static orZero(value: MoneyLike | null | undefined): Money {
    return value ? Money.from(value) || Money.zero : Money.zero;
  }

  public static negate(value: MoneyLike): Money {
    return Money.from(value).negate();
  }

  public sign(): MoneySign {
    return Money.sign(this.value);
  }

  public static sign(value: MoneyLike): MoneySign {
    const b = Money.toBig(value);
    if (b.gt(0)) {
      return 'positive';
    }
    if (b.lt(0)) {
      return 'negative';
    }
    return 'zero';
  }

  public valueOf(): number {
    return Money.toValue(this);
  }

  public static valueOf(m: MoneyLike): number {
    return Money.toValue(m);
  }

  public isValid(): boolean {
    return !isNaN(this.valueOf());
  }

  public abs(): Money {
    return Money.from(this.value.abs());
  }

  public toString(scale?: number): string {
    return this.value.toFixed(scale ?? 2);
  }

  public format(scale?: number, options?: Intl.NumberFormatOptions): string {
    return `${Number(this.value).toLocaleString('fi', {
      ...numberFormatOptions,
      ...options,
      minimumFractionDigits: scale ?? 2,
    })}`;
  }

  public inspect(): string {
    return this.format();
  }

  public plus(o: MoneyLike): Money {
    return new Money(this.value.plus(Money.toBig(o)));
  }

  public static plus(a: MoneyLike, b: MoneyLike): Money {
    return Money.from(a).plus(b);
  }

  public minus(o: MoneyLike): Money {
    return new Money(this.value.minus(Money.toBig(o)));
  }

  public toCents(): number {
    return parseInt(this.value.times(100).toFixed(0), 10);
  }

  public gte(o: MoneyLike): boolean {
    return this.value.gte(Money.toBig(o));
  }
  public gt(o: MoneyLike): boolean {
    return this.value.gt(Money.toBig(o));
  }
  public lte(o: MoneyLike): boolean {
    return this.value.lte(Money.toBig(o));
  }
  public lt(o: MoneyLike): boolean {
    return this.value.lt(Money.toBig(o));
  }

  public divide(o: MoneyLike): Money {
    return new Money(this.value.div(Money.toBig(o)));
  }

  public round(scale: number, decimals: RoundingMode): Money {
    return new Money(this.value.round(scale, decimals));
  }

  public multiply(o: MoneyLike): Money {
    return new Money(this.value.times(Money.toBig(o)));
  }

  public negate(): Money {
    return new Money(this.value.times(-1));
  }

  public equals(o: MoneyLike): boolean {
    return this.value.eq(Money.toBig(o));
  }

  public static equals(o1: MoneyLike, o2: MoneyLike): boolean {
    return Money.from(o1).equals(o2);
  }

  public static zero = new Money('0');
  public static euro = new Money('1');
  public static cent = new Money('0.01');
}

export function sanitizeMoneyInput(v: string): string {
  return v?.replace(/,/g, '.').replace(/ +/g, '') ?? '';
}

/**
 * Evaluate a simple arithmetic expression (e.g. "124.42 - 23.42 + 3.33")
 * using Money (Big.js) for precision. Supports +, -, *, / with standard
 * operator precedence. Returns the result as a Money string, or undefined
 * if the input is not a valid expression (e.g. a plain number or invalid syntax).
 */
export function evaluateMoneyExpression(input: string): string | undefined {
  const sanitized = sanitizeMoneyInput(input);
  // Tokenize into numbers and operators
  const tokens = tokenize(sanitized);
  if (!tokens || tokens.length < 3) return undefined;
  // Must contain at least one operator
  if (!tokens.some(t => t.type === 'op')) return undefined;
  try {
    const result = parseExpression(tokens, 0);
    if (result.pos !== tokens.length) return undefined;
    return result.value.toString();
  } catch {
    return undefined;
  }
}

type Token =
  | { type: 'num'; value: string }
  | { type: 'op'; value: string }
  | { type: 'paren'; value: '(' | ')' };

function tokenize(input: string): Token[] | undefined {
  const tokens: Token[] = [];
  let i = 0;
  while (i < input.length) {
    if (input[i] === ' ') {
      i++;
      continue;
    }
    // Parentheses
    if (input[i] === '(' || input[i] === ')') {
      tokens.push({ type: 'paren', value: input[i] as '(' | ')' });
      i++;
      continue;
    }
    // Number (with optional leading minus for first token, after operator, or after '(')
    const prev = tokens[tokens.length - 1];
    if (
      /[0-9.]/.test(input[i]) ||
      (input[i] === '-' &&
        (tokens.length === 0 ||
          prev.type === 'op' ||
          (prev.type === 'paren' && prev.value === '(')))
    ) {
      let num = '';
      if (input[i] === '-') {
        num = '-';
        i++;
      }
      while (i < input.length && /[0-9.]/.test(input[i])) {
        num += input[i++];
      }
      if (num === '-' || num === '' || num === '.') return undefined;
      tokens.push({ type: 'num', value: num });
    } else if ('+-*/'.includes(input[i])) {
      tokens.push({ type: 'op', value: input[i] });
      i++;
    } else {
      return undefined;
    }
  }
  return tokens;
}

// Recursive descent parser: expr = term (('+' | '-') term)*
function parseExpression(tokens: Token[], pos: number): { value: Money; pos: number } {
  let { value, pos: p } = parseTerm(tokens, pos);
  while (p < tokens.length && tokens[p].type === 'op' && '+-'.includes(tokens[p].value)) {
    const op = tokens[p].value;
    p++;
    const right = parseTerm(tokens, p);
    value = op === '+' ? value.plus(right.value) : value.minus(right.value);
    p = right.pos;
  }
  return { value, pos: p };
}

// term = factor (('*' | '/') factor)*
function parseTerm(tokens: Token[], pos: number): { value: Money; pos: number } {
  let { value, pos: p } = parseFactor(tokens, pos);
  while (p < tokens.length && tokens[p].type === 'op' && '*/'.includes(tokens[p].value)) {
    const op = tokens[p].value;
    p++;
    const right = parseFactor(tokens, p);
    value = op === '*' ? value.multiply(right.value) : value.divide(right.value);
    p = right.pos;
  }
  return { value, pos: p };
}

function parseFactor(tokens: Token[], pos: number): { value: Money; pos: number } {
  const token = tokens[pos];
  if (!token) throw new Error('Expected number or (');
  if (token.type === 'paren' && token.value === '(') {
    const result = parseExpression(tokens, pos + 1);
    const closing = tokens[result.pos];
    if (!closing || closing.type !== 'paren' || closing.value !== ')') {
      throw new Error('Expected )');
    }
    return { value: result.value, pos: result.pos + 1 };
  }
  if (token.type !== 'num') throw new Error('Expected number');
  return { value: new Money(token.value), pos: pos + 1 };
}

export const MoneyV = z
  .any()
  .refine(v => isMoneyLike(v))
  .transform(v => Money.from(v))
  .refine(v => v.isValid());

const BigShape = z
  .object({
    c: z.array(z.number()),
    abs: z.function(),
    cmp: z.function(),
  })
  .refine(v => Money.isBig(v))
  .transform<Big>(v => v as Big);

const MoneyShape = z
  .object({ value: BigShape })
  .refine(v => Money.isMoney(v))
  .transform<Money>(v => v as Money);

export const MoneyLike = z
  .union([z.string(), z.number(), MoneyShape, BigShape])
  .refine(t => isMoneyLike(t) && MoneyV.safeParse(t).success, {
    message: 'String does not encode a proper monetary amount',
  });
