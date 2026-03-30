// ============================================================
// LOOM — Indonesian Media Source Profiles
//
// Comprehensive profiles of Indonesian news sources with
// ownership, political leaning, reliability, and audience data.
// These profiles enable source-weighted sentiment analysis.
// ============================================================

import type { MediaSource } from '../../types.js';

/**
 * Pre-configured profiles for major Indonesian media sources.
 * Signal weight is computed dynamically based on context, but
 * base reliability and bias are set here.
 */
export const INDONESIA_SOURCES: MediaSource[] = [
  {
    id: 'kompas',
    name: 'Kompas',
    country: 'ID',
    languages: ['id'],
    url: 'https://www.kompas.com',
    feedUrls: [
      'https://rss.kompas.com/kompas.xml',
      'https://news.kompas.com/nasional/rss',
      'https://news.kompas.com/internasional/rss',
    ],
    politicalLeaning: 'centrist',
    ownership: {
      owner: 'Kompas Gramedia Group',
      conglomerate: 'Kompas Gramedia',
      politicalAffiliation: undefined,
      notes:
        "Founded by Jakob Oetama (d. 2020). Historically Indonesia's most respected " +
        'broadsheet. Catholic-founded but secular editorial line. Known for measured, ' +
        'fact-based reporting. Occasionally self-censors on sensitive topics.',
    },
    editorialGoal: 'Quality centrist journalism, pro-reform, pro-institutional stability',
    reliabilityScore: 0.85,
    audienceTypes: ['elite-policy', 'urban-middle'],
    biasDirection: 'neutral',
    signalWeight: 1.0,
    active: true,
  },
  {
    id: 'detik',
    name: 'Detik.com',
    country: 'ID',
    languages: ['id'],
    url: 'https://www.detik.com',
    feedUrls: [
      'https://rss.detik.com/index.php/detikcom',
      'https://rss.detik.com/index.php/detiknews',
      'https://rss.detik.com/index.php/detikfinance',
    ],
    politicalLeaning: 'oligarch-owned',
    ownership: {
      owner: 'Chairul Tanjung',
      conglomerate: 'CT Corp / Trans Media Group',
      politicalAffiliation: 'Business-aligned, generally pro-government',
      notes:
        "Indonesia's largest online news portal by traffic. Acquired by CT Corp in 2011. " +
        'Prioritizes speed over depth. Entertainment-heavy. Chairul Tanjung is one of ' +
        "Indonesia's richest businessmen with close government ties.",
    },
    editorialGoal: 'Mass market digital news, speed-first, pro-business',
    reliabilityScore: 0.6,
    audienceTypes: ['urban-middle', 'youth-digital'],
    biasDirection: 'pro-government',
    signalWeight: 0.7,
    active: true,
  },
  {
    id: 'tempo',
    name: 'Tempo',
    country: 'ID',
    languages: ['id', 'en'],
    url: 'https://www.tempo.co',
    feedUrls: [
      'https://rss.tempo.co/nasional',
      'https://rss.tempo.co/bisnis',
      'https://rss.tempo.co/internasional',
    ],
    politicalLeaning: 'independent',
    ownership: {
      owner: 'Tempo Media Group',
      conglomerate: undefined,
      politicalAffiliation: undefined,
      notes:
        'Founded 1971 by Goenawan Mohamad. Banned by Suharto in 1994 (returned 1998). ' +
        "Indonesia's premier investigative journalism outlet. Closest equivalent to " +
        'The Economist or Der Spiegel. Known for going after corruption regardless of ' +
        'political affiliation. Staff are frequently threatened/harassed.',
    },
    editorialGoal: 'Investigative journalism, democratic accountability, anti-corruption',
    reliabilityScore: 0.9,
    audienceTypes: ['elite-policy', 'urban-middle', 'international'],
    biasDirection: 'anti-government',
    signalWeight: 1.0,
    active: true,
  },
  {
    id: 'jakarta-post',
    name: 'The Jakarta Post',
    country: 'ID',
    languages: ['en'],
    url: 'https://www.thejakartapost.com',
    feedUrls: ['https://www.thejakartapost.com/rss'],
    politicalLeaning: 'progressive',
    ownership: {
      owner: 'PT Bina Media Tenggara',
      conglomerate: undefined,
      politicalAffiliation: undefined,
      notes:
        "Founded 1983. Indonesia's leading English-language daily. Targets diplomatic " +
        'community, expats, and internationally-minded Indonesians. Moderate-progressive ' +
        'editorial line. Important for international perception of Indonesia.',
    },
    editorialGoal: 'International-facing quality journalism, moderate-progressive',
    reliabilityScore: 0.82,
    audienceTypes: ['international', 'elite-policy', 'diaspora'],
    biasDirection: 'neutral',
    signalWeight: 1.0,
    active: true,
  },
  {
    id: 'cnn-indonesia',
    name: 'CNN Indonesia',
    country: 'ID',
    languages: ['id'],
    url: 'https://www.cnnindonesia.com',
    feedUrls: [
      'https://www.cnnindonesia.com/nasional/rss',
      'https://www.cnnindonesia.com/ekonomi/rss',
    ],
    politicalLeaning: 'centrist',
    ownership: {
      owner: 'Chairul Tanjung',
      conglomerate: 'Trans Media Group / CT Corp',
      politicalAffiliation: 'Same owner as Detik — business-aligned',
      notes:
        'Licensed CNN brand operated by Trans Media. More polished than Detik but ' +
        'same ownership influence. Mainstream centrist positioning with occasional ' +
        'government-friendly framing on economic stories.',
    },
    editorialGoal: 'Mainstream TV/digital news, centrist positioning',
    reliabilityScore: 0.7,
    audienceTypes: ['urban-middle', 'youth-digital'],
    biasDirection: 'pro-government',
    signalWeight: 0.8,
    active: true,
  },
  {
    id: 'tvone-viva',
    name: 'tvOne / Viva.co.id',
    country: 'ID',
    languages: ['id'],
    url: 'https://www.viva.co.id',
    feedUrls: ['https://www.viva.co.id/rss'],
    politicalLeaning: 'oligarch-owned',
    ownership: {
      owner: 'Aburizal Bakrie',
      conglomerate: 'Bakrie Group / Visi Media Asia',
      politicalAffiliation: 'Golkar party (Bakrie was Golkar chairman 2009-2014)',
      notes:
        "Bakrie family is one of Indonesia's most politically connected business dynasties. " +
        'tvOne launched as a "news channel" but functions partly as political vehicle. ' +
        'Known for pro-government slant regardless of which coalition is in power, ' +
        'as Bakrie family maintains relationships across parties.',
    },
    editorialGoal: 'Pro-government news, political vehicle for Golkar/coalition interests',
    reliabilityScore: 0.45,
    audienceTypes: ['rural-mass', 'urban-middle'],
    biasDirection: 'pro-government',
    signalWeight: 0.5,
    active: true,
  },
  {
    id: 'media-indonesia',
    name: 'Media Indonesia',
    country: 'ID',
    languages: ['id'],
    url: 'https://mediaindonesia.com',
    feedUrls: ['https://mediaindonesia.com/rss'],
    politicalLeaning: 'pro-government',
    ownership: {
      owner: 'Surya Paloh',
      conglomerate: 'Media Group',
      politicalAffiliation: 'NasDem party (Paloh is NasDem founder and chairman)',
      notes:
        'Surya Paloh uses Media Indonesia and Metro TV as platforms for his NasDem party. ' +
        "Editorial line closely tracks NasDem's political positioning. When NasDem is " +
        'in the coalition, coverage is pro-government; when in opposition, it shifts. ' +
        "Currently part of Prabowo's coalition.",
    },
    editorialGoal: 'NasDem-aligned political coverage, party platform journalism',
    reliabilityScore: 0.5,
    audienceTypes: ['elite-policy', 'urban-middle'],
    biasDirection: 'pro-government',
    signalWeight: 0.5,
    active: true,
  },
  {
    id: 'republika',
    name: 'Republika',
    country: 'ID',
    languages: ['id'],
    url: 'https://republika.co.id',
    feedUrls: ['https://republika.co.id/rss'],
    politicalLeaning: 'islamic-conservative',
    ownership: {
      owner: 'Mahaka Media Group / Erick Thohir (former)',
      conglomerate: 'Mahaka Media',
      politicalAffiliation: 'Islamic conservative, historically ICMI-aligned',
      notes:
        'Founded 1993 with backing from ICMI (Association of Indonesian Muslim Intellectuals). ' +
        'Historically close to Islamic political parties. Coverage prioritizes Islamic ' +
        'community issues and conservative social values. Important gauge of Islamic ' +
        'community sentiment, which is electorally significant in Indonesia.',
    },
    editorialGoal: 'Islamic community voice, conservative social values, Muslim interests',
    reliabilityScore: 0.6,
    audienceTypes: ['urban-middle', 'rural-mass'],
    biasDirection: 'neutral',
    signalWeight: 0.8,
    active: true,
  },
  {
    id: 'kumparan',
    name: 'Kumparan',
    country: 'ID',
    languages: ['id'],
    url: 'https://kumparan.com',
    feedUrls: ['https://kumparan.com/rss'],
    politicalLeaning: 'independent',
    ownership: {
      owner: 'PT Jenius Bangun Raharja',
      conglomerate: undefined,
      politicalAffiliation: undefined,
      notes:
        'Digital-native news platform founded 2016. Relatively young and independent. ' +
        'Funded by venture capital (including GDP Venture/Djarum). Positioned as a ' +
        'modern alternative to legacy media. Social-media-first distribution. ' +
        'Growing credibility but still establishing editorial identity.',
    },
    editorialGoal: 'Digital-native independent journalism for younger Indonesians',
    reliabilityScore: 0.65,
    audienceTypes: ['youth-digital', 'urban-middle'],
    biasDirection: 'neutral',
    signalWeight: 0.9,
    active: true,
  },
  {
    id: 'antara',
    name: 'ANTARA',
    country: 'ID',
    languages: ['id', 'en'],
    url: 'https://www.antaranews.com',
    feedUrls: ['https://www.antaranews.com/rss/terkini', 'https://en.antaranews.com/rss/news'],
    politicalLeaning: 'state-media',
    ownership: {
      owner: 'Republic of Indonesia',
      conglomerate: undefined,
      politicalAffiliation: 'State news agency — always reflects government position',
      notes:
        "Indonesia's official state news agency, established 1937. All government " +
        'ministries and agencies use ANTARA as their official wire service. Coverage ' +
        'is the official government line by definition. Useful as a baseline for ' +
        'what the government WANTS the narrative to be — not what it IS.',
    },
    editorialGoal: 'Official government communications, state narrative propagation',
    reliabilityScore: 0.55,
    audienceTypes: ['elite-policy', 'rural-mass'],
    biasDirection: 'pro-government',
    signalWeight: 0.3,
    active: true,
  },
  {
    id: 'tribunnews',
    name: 'Tribunnews',
    country: 'ID',
    languages: ['id'],
    url: 'https://www.tribunnews.com',
    feedUrls: ['https://www.tribunnews.com/rss'],
    politicalLeaning: 'centrist',
    ownership: {
      owner: 'Kompas Gramedia Group',
      conglomerate: 'Kompas Gramedia',
      politicalAffiliation: undefined,
      notes:
        'Part of the Kompas Gramedia network but positioned as mass-market/tabloid ' +
        'alternative to the main Kompas broadsheet. Highest traffic Indonesian news ' +
        'site overall. Heavy on clickbait, listicles, celebrity news. News coverage ' +
        'is shallow but reaches the widest audience. Useful for tracking mass ' +
        'sentiment but low signal-to-noise ratio.',
    },
    editorialGoal: 'Mass market news, maximize traffic, clickbait-leaning',
    reliabilityScore: 0.45,
    audienceTypes: ['rural-mass', 'urban-middle', 'youth-digital'],
    biasDirection: 'neutral',
    signalWeight: 0.4,
    active: true,
  },
];

/**
 * Get all Indonesian source profiles.
 */
export function getIndonesiaSources(): MediaSource[] {
  return [...INDONESIA_SOURCES];
}

/**
 * Get a specific source by ID.
 */
export function getIndonesiaSourceById(id: string): MediaSource | undefined {
  return INDONESIA_SOURCES.find((s) => s.id === id);
}

/**
 * Get sources filtered by bias direction.
 */
export function getSourcesByBias(direction: MediaSource['biasDirection']): MediaSource[] {
  return INDONESIA_SOURCES.filter((s) => s.biasDirection === direction);
}

/**
 * Get sources filtered by minimum reliability score.
 */
export function getReliableSources(minScore: number): MediaSource[] {
  return INDONESIA_SOURCES.filter((s) => s.reliabilityScore >= minScore);
}
