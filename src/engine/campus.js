// Areas → buildings on the campus map (spec §2) and the energize rule (§3).

import { LOCKED_IN, POINTS, MINOR_REFRESH, weightOf, weightedReadiness } from './rating.js';

// `quote` is the "what this building proves" line shown when it energizes —
// verbatim from content/study-guide.md (heading in `quoteSource`).
export const BUILDINGS = [
  {
    id: 'hq',
    area: 'Cx framework',
    name: 'Commissioning trailer',
    quote: 'At L4 I prove the system. At L5 I prove the building.',
    quoteSource: 'Data center commissioning language',
  },
  {
    id: 'yard',
    area: 'Sprinkler & underground',
    name: 'Yard, underground main and riser room',
    quote: 'Sprinkler acceptance proves the water gets there.',
    quoteSource: 'Sprinkler and underground',
  },
  {
    id: 'hall1',
    area: 'Pre-action',
    name: 'Data Hall 1',
    quote: 'Pre-action acceptance proves two opposite things: the system holds water back until the right conditions occur, and then delivers it fast enough.',
    quoteSource: 'Pre-action',
  },
  {
    id: 'pump',
    area: 'Fire pump',
    name: 'Pump house',
    quote: 'The field acceptance test proves the installed pump reproduces its certified shop curve at churn, 100% and 150% of rated flow.',
    quoteSource: 'Fire pump',
  },
  {
    id: 'gen',
    area: 'Emergency power',
    name: 'Generator block',
    quote: 'This IST proves every life-safety load rides through a utility failure (or, on an islanded campus, a generation-block trip), is back within code time, and returns to normal without anyone touching it.',
    quoteSource: 'Emergency power interface',
  },
  {
    id: 'office',
    area: 'Smoke control & FA FPT',
    name: 'Office block and stair tower',
    quote: 'Smoke control acceptance proves the system makes the design pressure differences or exhaust rates in every fire zone without making doors impossible to open.',
    quoteSource: 'Smoke control',
  },
  {
    id: 'hall2',
    area: 'Gaseous & ASD',
    name: 'Electrical rooms and Data Hall 2',
    quote: 'Clean agent acceptance proves the system can reach and hold concentration without discharging it.',
    quoteSource: 'Clean agent and CO2',
  },
  {
    id: 'energy',
    area: 'BESS, gas & mist',
    name: 'Energy yard',
    quote: 'Battery fire protection commissioning proves a layered defense works in order.',
    quoteSource: 'Battery and BESS',
  },
  {
    id: 'field',
    area: 'Applied & refresher',
    name: 'Field office',
    quote: 'The script reads like something you\'d hand Ops.',
    quoteSource: '14-day plan',
  },
  {
    id: 'conf',
    area: 'Interview',
    name: 'Conference room',
    quote: 'The code numbers get you in the door; the stories win the score.',
    quoteSource: 'Read this first',
  },
];

export const ENERGIZE_LOCKED_SHARE = 0.6;

export function buildingForArea(area) {
  return BUILDINGS.find((b) => b.area === area) || null;
}

export function topicsInBuilding(topics, building) {
  return topics.filter((t) => t.area === building.area);
}

// A building energizes when every topic in it is ≥ Minor Refresh and ≥ 60% of
// its weighted points are at Locked In (Σ weight of Locked In topics ÷ Σ weight).
export function buildingStatus(topics, building) {
  const own = topicsInBuilding(topics, building);
  const totalWeight = own.reduce((s, t) => s + weightOf(t), 0);
  const lockedWeight = own.filter((t) => t.rating === LOCKED_IN).reduce((s, t) => s + weightOf(t), 0);
  const allAtLeastMinor = own.every((t) => POINTS[t.rating] >= POINTS[MINOR_REFRESH]);
  const lockedShare = totalWeight ? lockedWeight / totalWeight : 0;
  return {
    id: building.id,
    name: building.name,
    area: building.area,
    topics: own.length,
    readiness: weightedReadiness(own).value,
    lockedShare,
    allAtLeastMinor,
    energized: own.length > 0 && allAtLeastMinor && lockedShare >= ENERGIZE_LOCKED_SHARE,
  };
}

export function campusStatus(topics) {
  return BUILDINGS.map((b) => buildingStatus(topics, b));
}
