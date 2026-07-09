import { describe, expect, it } from 'bun:test';

import { parseEcbRates } from './CurrencyRates';

/** Verbatim shape of https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml, truncated */
const ECB_FEED = `<?xml version="1.0" encoding="UTF-8"?>
<gesmes:Envelope xmlns:gesmes="http://www.gesmes.org/xml/2002-08-01" xmlns="http://www.ecb.int/vocabulary/2002-08-01/eurofxref">
	<gesmes:subject>Reference rates</gesmes:subject>
	<gesmes:Sender>
		<gesmes:name>European Central Bank</gesmes:name>
	</gesmes:Sender>
	<Cube>
		<Cube time='2026-07-09'>
			<Cube currency='USD' rate='1.1435'/>
			<Cube currency='JPY' rate='185.72'/>
			<Cube currency='GBP' rate='0.85363'/>
			<Cube currency='SEK' rate='11.0620'/>
		</Cube>
	</Cube>
</gesmes:Envelope>`;

describe('parseEcbRates', () => {
  it('extracts the publication date and every rate', () => {
    const parsed = parseEcbRates(ECB_FEED);
    expect(parsed.date).toEqual('2026-07-09');
    expect(parsed.base).toEqual('EUR');
    expect(parsed.rates).toEqual({
      USD: '1.1435',
      JPY: '185.72',
      GBP: '0.85363',
      SEK: '11.0620',
    });
  });

  it('keeps rates as strings so precision survives', () => {
    const parsed = parseEcbRates(ECB_FEED);
    // A number or a Money would lose the trailing digits of 0.85363
    expect(parsed.rates.GBP).toEqual('0.85363');
    expect(typeof parsed.rates.GBP).toEqual('string');
  });

  it('does not invent an EUR rate', () => {
    expect(parseEcbRates(ECB_FEED).rates.EUR).toBeUndefined();
  });

  it('accepts double-quoted attributes', () => {
    const parsed = parseEcbRates(
      `<Cube time="2026-07-09"><Cube currency="USD" rate="1.1435"/></Cube>`,
    );
    expect(parsed.rates.USD).toEqual('1.1435');
  });

  it('fails loudly when the feed has no rate date', () => {
    expect(() => parseEcbRates(`<Cube><Cube currency='USD' rate='1.1435'/></Cube>`)).toThrow();
  });

  it('fails loudly when the feed shape changes and yields no rates', () => {
    expect(() =>
      parseEcbRates(`<Cube time='2026-07-09'><Rate ccy='USD' v='1.14'/></Cube>`),
    ).toThrow(/no rates/);
  });
});
