// @ts-ignore bun test runner
import { describe, expect, test } from 'bun:test';
import { dagenTeLaat, verwachteLevering, ymd } from './leverdatum';

// Openingsdagen zoals in de database: Midsland dicht op ma(1)+di(2), West dicht op di(2).
const MIDS_DICHT = new Set([1, 2]);
const midsOpen = (d: Date) => !MIDS_DICHT.has(d.getDay());
const altijdOpen = () => true;

// do 29 okt 2026
const DO = new Date(2026, 9, 29);

describe('verwachteLevering', () => {
  test('zonder leverancier: morgen', () => {
    expect(ymd(verwachteLevering(DO, [], altijdOpen))).toBe('2026-10-30');
  });

  test('morgen dicht (Midsland maandag): doorschuiven naar dinsdag... woensdag', () => {
    // zon 1 nov 2026 besteld -> ma 2 nov dicht, di 3 nov dicht -> wo 4 nov
    const zon = new Date(2026, 10, 1);
    expect(ymd(verwachteLevering(zon, [], midsOpen))).toBe('2026-11-04');
  });

  test('leverdag leverancier: eerstvolgende besteldag + offset', () => {
    // Leverancier besteldag vrijdag(5), offset 1 -> za 31 okt
    expect(ymd(verwachteLevering(DO, [{ weekdag: 5, offset: 1 }], altijdOpen))).toBe('2026-10-31');
  });

  test('besteldag is vandaag: vandaag + offset, niet volgende week', () => {
    // do 29 okt, besteldag donderdag(4), offset 1 -> vr 30 okt
    expect(ymd(verwachteLevering(DO, [{ weekdag: 4, offset: 1 }], altijdOpen))).toBe('2026-10-30');
  });

  test('leverdag op dichte dag schuift door naar open dag', () => {
    // Leverancier levert maandag(1) (offset 0), Midsland maandag dicht -> woensdag 4 nov
    const zon = new Date(2026, 10, 1);
    expect(ymd(verwachteLevering(zon, [{ weekdag: 1, offset: 0 }], midsOpen))).toBe('2026-11-04');
  });

  test('meerdere besteldagen: vroegste wint', () => {
    const leverdagen = [
      { weekdag: 6, offset: 0 }, // za 31 okt
      { weekdag: 5, offset: 1 }, // za 31 okt? vr 30 + 1 = za 31
      { weekdag: 0, offset: 0 }, // zo 1 nov
    ];
    expect(ymd(verwachteLevering(DO, leverdagen, altijdOpen))).toBe('2026-10-31');
  });
});

describe('dagenTeLaat', () => {
  test('verwacht vandaag of later: niet te laat', () => {
    expect(dagenTeLaat('2026-10-29', DO, altijdOpen)).toBe(0);
    expect(dagenTeLaat('2026-10-30', DO, altijdOpen)).toBe(0);
  });

  test('verwacht gisteren: 1 dag te laat', () => {
    expect(dagenTeLaat('2026-10-28', DO, altijdOpen)).toBe(1);
  });

  test('dichte dagen tellen niet mee', () => {
    // verwacht vr 30 okt (Midsland); vandaag do 5 nov. Open dagen erna: za 31, zo 1, wo 4, do 5 = 4 (ma+di dicht)
    const vandaag = new Date(2026, 10, 5);
    expect(dagenTeLaat('2026-10-30', vandaag, midsOpen)).toBe(4);
  });

  test('zonder datum: nooit te laat', () => {
    expect(dagenTeLaat(null, DO, altijdOpen)).toBe(0);
  });
});
