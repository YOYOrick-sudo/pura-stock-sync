// Statische lijst van Terschelling-evenementen voor 2026-2027
// Bron: vvvterschelling.nl/evenementen — geüpload door gebruiker (april 2026)
// Update: jaarlijks rond april

export interface TerschellingEvent {
  name: string;
  /** ISO datum (YYYY-MM-DD) — voor multi-day events de eerste dag */
  startDate: string;
  /** Optioneel: ISO datum laatste dag */
  endDate?: string;
  description?: string;
  category?: 'cultuur' | 'muziek' | 'sport' | 'markt' | 'tradition' | 'natuur' | 'overig';
  location?: string;
}

export const TERSCHELLING_EVENTS: TerschellingEvent[] = [
  // ===== APRIL 2026 =====
  { name: 'Concert Tango op het Wad', startDate: '2026-04-26', category: 'muziek' },
  { name: 'Koningsdag op Terschelling', startDate: '2026-04-27', description: 'Vier het feest op Terschelling met diverse activiteiten in de dorpen.', category: 'tradition' },
  { name: 'Voorjaarsmarkt', startDate: '2026-04-29', description: 'Voorjaarsmarkt in Midsland', category: 'markt', location: 'Midsland' },
  { name: 'Brandaris Wandeltochten', startDate: '2026-04-29', endDate: '2026-10-15', description: 'Al meer dan 50 jaar steeds weer een andere wandelroute', category: 'natuur' },
  { name: 'Concert West Aleta Singers', startDate: '2026-04-30', description: 'Zeemansliederen en Terschellinger liederen door het Terschellinger koor', category: 'muziek' },

  // ===== MEI 2026 =====
  { name: 'Meivuur Terschelling', startDate: '2026-05-01', description: 'Traditionele ontsteking van het meivuur', category: 'tradition' },
  { name: 'Proeveri Meslâns', startDate: '2026-05-01', description: 'Proeverij van Terschellinger producten in Midsland', category: 'markt', location: 'Midsland' },
  { name: 'Tussen Kunst en Kliko', startDate: '2026-05-02', description: 'Rommelmarkt in de tuin bij Zus', category: 'markt' },
  { name: 'Rommelmarkt in De Stilen', startDate: '2026-05-02', description: 'Tweedehands spullen, unieke vondsten en gezellige sfeer', category: 'markt' },
  { name: 'Wijnmakerslunch Terschelling', startDate: '2026-05-03', description: 'Exclusieve wijnmakerslunch met wijnmaker Carl Ehrhard uit de Rheingau', category: 'overig' },
  { name: 'Stille tocht', startDate: '2026-05-04', description: 'Stille tocht ter herdenking van de oorlogsslachtoffers', category: 'tradition' },
  { name: 'Week van de Stenen Winkel', startDate: '2026-05-04', endDate: '2026-05-10', category: 'overig' },
  { name: 'Nationale Reddingbootdag', startDate: '2026-05-09', description: 'KNRM Paal 8 en West Terschelling openen deuren', category: 'overig' },
  { name: 'Ringsteken in Midsland', startDate: '2026-05-09', endDate: '2026-10-18', description: 'Ringsteken met paard en wagen in de Oosterburen', category: 'tradition', location: 'Midsland' },
  { name: 'HT Roeirace', startDate: '2026-05-15', description: 'Spectaculaire HT-roeisloepenrace, een van de zwaarste roeiwedstrijden in het land', category: 'sport' },
  { name: 'Sagitta zeilrace', startDate: '2026-05-16', description: 'Traditioneel volgt op HT, strijd om de Sagitta beker', category: 'sport' },
  { name: 'Dag van het Schaap', startDate: '2026-05-24', description: 'Het evenement met de hoogste aaibaarheidsfactor', category: 'tradition' },
  { name: 'Tuigwedstrijd', startDate: '2026-05-17', endDate: '2026-10-11', description: 'Tuigwedstrijd Et Hossefolk — aangespannen en onder zadel', category: 'tradition' },
  { name: 'HT Zeilrace', startDate: '2026-05-28', endDate: '2026-05-29', description: 'HT Zeilrace tussen Harlingen en Terschelling met 110 schepen', category: 'sport' },
  { name: 'Dichter bij Zee', startDate: '2026-05-30', description: 'Poëzie in de kerk in Midsland', category: 'cultuur', location: 'Midsland' },
  { name: 'Bunkerdag Terschelling', startDate: '2026-05-30', category: 'cultuur' },
  { name: 'Kofferbakmarkt Oosterend', startDate: '2026-05-31', description: 'Rommelmarkt vanuit de kofferbak op Terschelling', category: 'markt', location: 'Oosterend' },

  // ===== JUNI 2026 =====
  { name: 'Oerol Festival', startDate: '2026-06-12', endDate: '2026-06-21', description: 'Eén van de grootste theaterfestivals van Europa', category: 'cultuur' },
  { name: 'Oerol Braderie', startDate: '2026-06-16', endDate: '2026-06-18', description: 'Braderie op markten in West-Terschelling, Midsland en Hoorn', category: 'markt' },
  { name: 'Muzikaal verteltheater', startDate: '2026-06-23', endDate: '2026-06-30', description: 'Een vertelling omlijst met muziek op viool', category: 'cultuur' },
  { name: "Sint Jan's Draverij", startDate: '2026-06-25', description: "Traditionele paardenrace in Midsland — paarden en pony's draven door de straten", category: 'tradition', location: 'Midsland' },
  { name: 'Dag van het Wad', startDate: '2026-06-27', description: 'Dag van het Wad op Terschelling', category: 'natuur' },

  // ===== JULI 2026 =====
  { name: 'Demonstratie paardenreddingboot', startDate: '2026-07-09', description: 'Spectaculaire demonstraties met de klassieke paardenreddingboot (ook 23 juli, 6 augustus, 13 september)', category: 'tradition' },
  { name: 'Harddraverij strand Oosterend', startDate: '2026-07-12', description: 'Harddraverij bij het Heartbreak hotel in Oosterend, onder zadel en aangespannen', category: 'sport', location: 'Oosterend' },
  { name: "Strandfeest 'Uit je Duinpan'", startDate: '2026-07-18', description: "Kom dansen in het zand bij strandfeest 'Uit je Duinpan'", category: 'muziek' },
  { name: 'Ringsteken te paard', startDate: '2026-07-23', description: 'Ringsteken te paard in Formerum, een spannende wedstrijd', category: 'tradition', location: 'Formerum' },
  { name: 'Lokale avondmarkt West', startDate: '2026-07-25', endDate: '2026-08-08', category: 'markt', location: 'West-Terschelling' },
  { name: 'Zomeroefening reddingwezen KNRM', startDate: '2026-07-29', endDate: '2026-08-12', description: 'KNRM zomeroefening strand Paal 8 — twee KNRM-reddingstations op Terschelling', category: 'overig' },
  { name: 'Terschelling Openlucht Filmfestival', startDate: '2026-07-31', endDate: '2026-08-09', description: 'Films kijken in de openlucht. Dat is TOF!', category: 'cultuur' },

  // ===== AUGUSTUS 2026 =====
  { name: 'Dag van het Paard', startDate: '2026-08-02', category: 'tradition' },
  { name: 'Platenmarkt Terschelling', startDate: '2026-08-04', description: 'Platenmarkt onder de toren', category: 'markt' },
  { name: 'SC Terschelling Summercamp', startDate: '2026-08-05', endDate: '2026-08-06', description: 'Een super tof Summercamp op Terschelling', category: 'sport' },
  { name: 'Ringsteken Hoorn', startDate: '2026-08-07', description: 'Ringsteken voor aangespannen paarden op het Abt Folkertspad in Hoorn', category: 'tradition', location: 'Hoorn' },
  { name: 'Keuring KFPS en het Groninger Paard', startDate: '2026-08-10', description: 'Keuring voor Friese paarden en het Groninger paard in Hoorn', category: 'tradition', location: 'Hoorn' },
  { name: 'Horizontoer', startDate: '2026-08-10', endDate: '2026-08-11', description: 'Horizontoer, theateracts, cabaret en optredens van singer-songwriters & bands', category: 'cultuur' },
  { name: 'Stoelendans te paard', startDate: '2026-08-13', description: 'Stoelendans te paard, een waar spektakel', category: 'tradition' },
  { name: 'Lokale markt Oosterend', startDate: '2026-08-30', description: 'Eilandproducten, kunst, groentes, ambacht en meer', category: 'markt', location: 'Oosterend' },

  // ===== SEPTEMBER 2026 =====
  { name: 'Concerten in de kerk', startDate: '2026-09-01', endDate: '2026-09-30', description: 'Op wisselende data kun je genieten van muziek in de kerk van Midsland of Hoorn', category: 'muziek' },
  { name: 'Marktdraverij Heereweg', startDate: '2026-09-09', description: 'Marktdraverij om de Jaap Borsch trofee', category: 'tradition' },
  { name: 'Beestemerk', startDate: '2026-09-10', description: 'Veetentoonstelling in Midsland', category: 'tradition', location: 'Midsland' },
  { name: "Rock 'n Roll Street", startDate: '2026-09-11', endDate: '2026-09-13', description: 'Live-optredens, dansdemonstraties, hotdogs en feesten in de sfeervolle straten', category: 'muziek' },
  { name: 'Springtij', startDate: '2026-09-23', endDate: '2026-09-25', description: 'Drie dagen in een omgeving vol kunst, kennis en natuur, in het teken van verduurzaming', category: 'cultuur' },
  { name: 'The Bluescruise Terschelling', startDate: '2026-09-26', description: 'Jaarlijks muzikaal evenement in het laatste weekend van september', category: 'muziek' },

  // ===== OKTOBER 2026 =====
  { name: 'Kunst in de Kerk', startDate: '2026-10-12', endDate: '2026-10-24', description: 'Uitgebreide selectie van kunstenaars, fotografen, bekend en minder bekend', category: 'cultuur' },
  { name: 'De Heksenmarkt', startDate: '2026-10-14', description: 'Met pompoenen, bezemstelen, lampionnen en vuurkorven wordt de Oosterburen omgetoverd', category: 'markt' },
  { name: 'Kunst te Kijk', startDate: '2026-10-15', description: 'Kunst te Kijk op Terschelling: gedichten, verhalen, schilderijen, vilt, glas, hout, steen, keramiek', category: 'cultuur' },
  { name: 'Kuiper Brandarisrace', startDate: '2026-10-17', endDate: '2026-10-18', description: 'Jaarlijkse zeilwedstrijd voor traditionele zeilschepen van Harlingen naar Terschelling', category: 'sport' },
  { name: 'Nacht van de Nacht', startDate: '2026-10-23', endDate: '2026-10-24', description: 'Jaarlijkse viering van de Nacht van de Nacht in Oosterend', category: 'natuur', location: 'Oosterend' },
  { name: 'Kleintje Berenloop', startDate: '2026-10-31', description: 'Opwarmer voor het echte werk op zondag', category: 'sport' },
  { name: 'Jeugdloop Berenloop', startDate: '2026-10-31', category: 'sport' },

  // ===== NOVEMBER 2026 =====
  { name: 'Berenloop', startDate: '2026-11-01', description: 'Berenloop Terschelling — loopwedstrijd door de schitterende en afwisselende natuur', category: 'sport' },
  { name: 'Festival LOW', startDate: '2026-11-27', endDate: '2026-11-29', description: 'Genieten van swingende en veelzijdige muziek voor iedereen', category: 'muziek' },

  // ===== DECEMBER 2026 =====
  { name: 'Kerstmarkt West', startDate: '2026-12-12', description: 'Een gezellige markt rondom het huis van Zus Kooijman', category: 'markt', location: 'West-Terschelling' },
  { name: 'Kerstwandeltocht', startDate: '2026-12-26', description: 'Jaarlijks wordt er op Tweede Kerstdag een mooie route gelopen tijdens de Kerstwandeltocht', category: 'natuur' },
  { name: 'Lichtjes kerstmarkt Oosterend', startDate: '2026-12-28', category: 'markt', location: 'Oosterend' },
  { name: 'Lichtjestocht Natuurlijk Oosterend', startDate: '2026-12-28', description: 'Traditionele Lichtjestocht in een nieuw winterkasje gestoken', category: 'tradition', location: 'Oosterend' },
  { name: 'Midwintermarkt Midsland', startDate: '2026-12-29', description: 'Traditionele Midwintermarkt in Midsland', category: 'markt', location: 'Midsland' },

  // ===== JANUARI 2027 =====
  { name: 'Nieuwjaarsduik Terschelling', startDate: '2027-01-01', description: 'Nieuwjaarsduik op het strand bij Midsland aan Zee. Voor echte bikkels!', category: 'tradition', location: 'Midsland aan Zee' },

  // ===== MAART 2027 =====
  { name: 'Trailrun Terschelling', startDate: '2027-03-01', description: '10, 15 en 25 kilometer trailrun voor zowel beginnende als ervaren trailrunner', category: 'sport' },
  { name: 'Noordsvaarder Cross Country', startDate: '2027-03-01', description: 'Cross Country over de Noordsvaarder, een prachtige mountainbike tocht', category: 'sport' },
  { name: 'Lytse Fjoertoer', startDate: '2027-03-19', description: 'Speciaal voor kinderen en hun (groot)ouders', category: 'tradition' },
  { name: 'Fjoertoer', startDate: '2027-03-20', description: 'Een tocht langs bakens van vuur, op weg naar de Brandaris', category: 'tradition' },
];

/**
 * Geeft het eerstvolgende event vanaf vandaag.
 * Multi-day events tellen mee zolang endDate >= vandaag.
 */
export function getNextEvent(now: Date = new Date()): TerschellingEvent | null {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const upcoming = TERSCHELLING_EVENTS
    .filter((e) => {
      const end = new Date(e.endDate ?? e.startDate);
      return end >= today;
    })
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
  return upcoming[0] ?? null;
}

/** Komende N events vanaf vandaag */
export function getUpcomingEvents(n: number, now: Date = new Date()): TerschellingEvent[] {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return TERSCHELLING_EVENTS
    .filter((e) => new Date(e.endDate ?? e.startDate) >= today)
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .slice(0, n);
}

/** Aantal dagen tussen vandaag en de gegeven datum (negatief = al begonnen) */
export function getDaysUntil(dateIso: string, now: Date = new Date()): number {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(dateIso);
  const diffMs = target.getTime() - today.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/** NL-geformatteerde datum, bv. "vrijdag 12 juni" */
export function formatEventDate(dateIso: string): string {
  const date = new Date(dateIso);
  return date.toLocaleDateString('nl-NL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}
