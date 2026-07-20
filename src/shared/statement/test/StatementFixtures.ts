/**
 * Cooked-up statement CSV fixtures that match the real export formats
 * (OP: quoted fields, ISO dates, LF; S-pankki: unquoted fields, Finnish
 * dates, CRLF, "-" for empty fields). Not real bank data.
 */

const BOM = '\uFEFF';

export const OP_HEADER = `"Kirjauspäivä";"Arvopäivä";"Määrä EUROA";"Laji";"Selitys";"Saaja/Maksaja";"Saajan tilinumero";"Saajan pankin BIC";"Viite";"Viesti";"Arkistointitunnus"`;

export const opCsv = (rows: string[]) => BOM + [OP_HEADER, ...rows].join('\n') + '\n';

export const OP_ROWS = [
  `"2026-05-02";"2026-05-02";-12,90;"162";"PKORTTIMAKSU";"MEGASTORE HELSINKI";"";"";"ref=";"Viesti: 512345******9876 OSTOPVM 260501";"20260502/ABC123/000001"`,
  `"2026-05-03";"2026-05-03";-250,00;"106";"TILISIIRTO";"TESTI TESTAAJA";"FI2112345600000785";"NDEAFIHH";"ref=1122334455";"";"20260503/ABC123/000002"`,
  `"2026-05-15";"2026-05-15";2500,00;"510";"PALKKA";"TYÖNANTAJA OY";"";"";"ref=";"SEPA-MAKSU Viesti: Palkka kaudelta 5/2026";"20260515/ABC123/000003"`,
  `"2026-05-28";"2026-05-28";-400,00;"106";"TILISIIRTO";"Säästötili";"FI2112345600000786";"OKOYFIHH";"ref=";"Viesti: Kuukausisäästö";"20140101/STANDING/00001"`,
  `"2026-06-28";"2026-06-28";-400,00;"106";"TILISIIRTO";"Säästötili";"FI2112345600000786";"OKOYFIHH";"ref=";"Viesti: Kuukausisäästö";"20140101/STANDING/00001"`,
];

export const OPCREDIT_HEADER = `"Kirjauspäivä";"Arvopäivä";"Määrä";"Kurssi";"Selite";"Maksaja";"Saaja";"Arkistointitunnus"`;

export const opCreditCsv = (rows: string[]) => BOM + [OPCREDIT_HEADER, ...rows].join('\n') + '\n';

/**
 * OP credit card export: Kirjauspäivä is the purchase date, Arvopäivä the
 * later billing date, amounts use dot decimals (1–2 decimals). Purchases
 * duplicate the merchant in Selite and Saaja; incoming bill payments are
 * "Suoritus" rows with empty Maksaja/Saaja.
 */
export const OPCREDIT_ROWS = [
  `"2026-05-20";"2026-06-09";-342.25;"EUR";"AUTOVUOKRAAMO OY";"MEIKÄLÄINEN MATTI";"AUTOVUOKRAAMO OY";"74463656189601898056439"`,
  `"2026-05-07";"2026-05-08";211.1;"EUR";"Suoritus";"";"";"202606185FVT00223666"`,
  `"2026-05-02";"2026-05-03";-6.99;"EUR";"Suoratoisto Oy";"MEIKÄLÄINEN MATTI";"Suoratoisto Oy";"74313306175404759728315"`,
];

export const SPANKKI_HEADER = `Kirjauspäivä;Maksupäivä;Summa;Tapahtumalaji;Maksaja;Saajan nimi;Saajan tilinumero;Saajan BIC-tunnus;Viitenumero;Viesti;Arkistointitunnus`;

export const spankkiCsv = (rows: string[]) => BOM + [SPANKKI_HEADER, ...rows].join('\r\n') + '\r\n';

export const SPANKKI_ROWS = [
  `13.05.2026;11.05.2026;-25,50;KORTTIOSTO;MATTI MEIKÄLÄINEN;KAUPPA HELSINKI;-;-;-;'512345******1234 260511000001';20260513390000000001`,
  `20.05.2026;20.05.2026;-100,00;TILISIIRTO;MATTI MEIKÄLÄINEN;Testi Saaja;FI21 1234 5600 0007 85 ;NDEAFIHH;-;'Vuokra';20260520390000000002`,
  `25.05.2026;25.05.2026;+5,25;BONUS;OSUUSKAUPPA;MATTI MEIKÄLÄINEN;FI21 1234 5600 0007 86;SBAN FI HH;-;'-';20260525390000000003`,
  `28.05.2026;28.05.2026;+300,00;TILISIIRTO;MAIJA MEIKÄLÄINEN;Yhteinen tili;FI21 1234 5600 0007 86 ;SBANFIHH;-;'Käyttörahaa';20260528390000000004`,
];
