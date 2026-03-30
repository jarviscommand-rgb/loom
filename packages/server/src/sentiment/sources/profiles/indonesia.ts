// ============================================================
// LOOM — Indonesian Media Source Profiles
//
// Comprehensive profiles of Indonesian news sources with
// ownership, political leaning, reliability, and audience data.
// These profiles enable source-weighted sentiment analysis.
//
// Includes extended profiles with deep ownership chains,
// political history, editorial stances, and reliability records.
// ============================================================

import type { MediaSource } from '../../types.js';

/**
 * Pre-configured profiles for major Indonesian media sources.
 * Signal weight is computed dynamically based on context, but
 * base reliability and bias are set here.
 */
export const INDONESIA_SOURCES: MediaSource[] = [
  // ──────────────────────────────────────────────────────────
  // 1. KOMPAS
  // ──────────────────────────────────────────────────────────
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
        "Founded by PK Ojong and Jakob Oetama (d. September 2020). Historically Indonesia's " +
        'most respected broadsheet. Catholic-founded but secular editorial line. Known as ' +
        'the "polite watchdog" — self-censors on sensitive topics to maintain access.',
    },
    editorialGoal: 'Quality centrist journalism, pro-reform, pro-institutional stability',
    reliabilityScore: 0.85,
    audienceTypes: ['elite-policy', 'urban-middle'],
    biasDirection: 'neutral',
    signalWeight: 1.0,
    active: true,
    extendedProfile: {
      ownershipChain: [
        { entity: 'PT Kompas Media Nusantara', role: 'direct-owner', stake: '100%' },
        { entity: 'Kompas Gramedia Group', role: 'parent-company', since: '1965' },
        {
          entity: 'Jakob Oetama family / foundation',
          role: 'ultimate-beneficiary',
          since: '1965',
        },
      ],
      politicalHistory: [
        {
          period: '1965-1998',
          stance: 'Cautiously independent under authoritarian constraints',
          details:
            'Survived Suharto era by practising careful self-censorship while maintaining ' +
            'higher journalistic standards than most. Never openly challenged the regime but ' +
            'earned respect for factual reporting within the allowed boundaries.',
          administration: 'Suharto (New Order)',
        },
        {
          period: '1998-2014',
          stance: 'Pro-reform centrist',
          details:
            'Embraced Reformasi era with stronger investigative coverage. Maintained balanced ' +
            'reporting through Habibie, Wahid, Megawati, and Yudhoyono administrations.',
          administration: 'Post-Suharto transition / Yudhoyono',
        },
        {
          period: '2014-2024',
          stance: 'Moderate, increasingly cautious',
          details:
            'During the Widodo era, became less critical of government, prioritizing business ' +
            'stability for the Kompas Gramedia empire. Coverage remained factual but avoided ' +
            'hard-hitting investigative pieces on sensitive political topics.',
          administration: 'Joko Widodo',
        },
        {
          period: '2024-present',
          stance: 'Centrist, cautious institutional coverage',
          details:
            'Continuing pattern of measured coverage under Prabowo administration. Maintains ' +
            'factual standards while avoiding confrontation.',
          administration: 'Prabowo Subianto',
        },
      ],
      editorialStances: [
        {
          topic: 'Democratic institutions',
          stance: 'Strongly supportive of institutional stability and rule of law',
          examples: [
            'Consistent coverage of Constitutional Court decisions with legal analysis',
            'Editorials defending press freedom when other outlets are threatened',
          ],
        },
        {
          topic: 'Economic policy',
          stance: 'Pro-market, pro-investment climate',
          examples: [
            'Favorable coverage of infrastructure development programs',
            'Balanced reporting on labor law reforms with business perspective',
          ],
        },
        {
          topic: 'Religious pluralism',
          stance: 'Supportive of pluralism, reflecting Catholic founding ethos',
          examples: [
            'Coverage of interfaith dialogue events',
            'Critical of religious intolerance incidents',
          ],
        },
      ],
      audienceDemographics: {
        estimatedMonthlyReach: '25-30 million unique visitors (web)',
        primaryDemographic: 'Urban educated professionals, 30-55 years old',
        geographicFocus: 'Java-centric with national reach',
        platformBreakdown: {
          print: '15% (declining)',
          web: '55%',
          mobile: '25%',
          social: '5%',
        },
      },
      reliabilityRecord: [
        {
          incident: 'Self-censorship patterns during Widodo era on land reform issues',
          date: '2016-2020',
          impact: 'Reduced credibility among investigative journalism advocates',
          outcome: 'No formal correction; tacit editorial shift toward safer topics',
        },
      ],
      biasExamples: [
        {
          topic: 'Kompas Gramedia business interests',
          expectedCoverage: 'Critical reporting on media consolidation and conglomerate influence',
          actualCoverage:
            'Minimal coverage of issues affecting Kompas Gramedia subsidiary businesses',
          analysis:
            'Systematic blind spot on stories that could impact the parent conglomerate, ' +
            'including bookstore labor disputes and hospitality sector regulation.',
        },
      ],
      awards: [{ name: 'Adinegoro Award', year: '2018', category: 'Investigative journalism' }],
      foundingContext:
        'Founded in 1965 by PK Ojong and Jakob Oetama, both Catholic intellectuals, during ' +
        'one of the most turbulent periods in Indonesian history. The name "Kompas" (compass) ' +
        'was reportedly suggested by President Sukarno. From its inception, the paper aimed to ' +
        'provide measured, factual journalism as a stabilizing force. The Kompas Gramedia empire ' +
        'grew to encompass Tribunnews, bookstores (Gramedia), hotels, a university, and more.',
      keyMilestones: [
        { year: '1965', event: 'Founded by PK Ojong and Jakob Oetama' },
        { year: '1978', event: 'Temporarily banned for two months for critical coverage' },
        { year: '1980s', event: 'Expanded into Kompas Gramedia conglomerate' },
        { year: '1998', event: 'Reformasi era — expanded investigative reporting' },
        { year: '2008', event: 'Launched Kompas.com digital platform' },
        { year: '2020', event: 'Jakob Oetama passed away, September 2020' },
      ],
    },
  },

  // ──────────────────────────────────────────────────────────
  // 2. DETIK
  // ──────────────────────────────────────────────────────────
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
        "Indonesia's largest online news portal by traffic. Founded 1998 by Budiono Darsono " +
        "as Indonesia's first online-only news portal. Acquired by CT Corp in 2011 for ~$60M. " +
        'Chairul Tanjung served as Coordinating Economic Affairs Minister under Yudhoyono ' +
        '(May-Oct 2014). Same owner as CNN Indonesia, Trans TV, Trans 7, CNBC Indonesia.',
    },
    editorialGoal: 'Mass market digital news, speed-first, pro-business',
    reliabilityScore: 0.6,
    audienceTypes: ['urban-middle', 'youth-digital'],
    biasDirection: 'pro-government',
    signalWeight: 0.7,
    active: true,
    extendedProfile: {
      ownershipChain: [
        { entity: 'PT Agranet Multicitra Siberkom', role: 'direct-owner', stake: '100%' },
        { entity: 'Trans Media Group', role: 'parent-company', since: '2011' },
        { entity: 'CT Corp (Chairul Tanjung)', role: 'ultimate-beneficiary', since: '2011' },
      ],
      politicalHistory: [
        {
          period: '1998-2011',
          stance: 'Independent digital pioneer',
          details:
            "Founded by Budiono Darsono as Indonesia's first purely online news portal. " +
            'During this pre-acquisition period, operated with greater editorial independence ' +
            'and was known for breaking news speed.',
          administration: 'Various (Habibie through Yudhoyono)',
        },
        {
          period: '2011-2014',
          stance: 'Transitioning to oligarch-aligned',
          details:
            'Acquired by CT Corp (Chairul Tanjung) in 2011 for approximately $60M. Coverage ' +
            'gradually shifted toward business-friendly and government-accommodating framing.',
          administration: 'Yudhoyono',
        },
        {
          period: '2014-2024',
          stance: 'Pro-Widodo, pro-business',
          details:
            'Tanjung was Coordinating Economic Affairs Minister (May-Oct 2014). His daughter ' +
            "was one of Widodo's 'millennial' expert staff members. Coverage consistently " +
            'favorable to Widodo administration policies, particularly economic and ' +
            'infrastructure programs.',
          administration: 'Joko Widodo',
        },
        {
          period: '2024-present',
          stance: 'Pro-government, business-aligned continuity',
          details:
            'Continuing pattern of alignment with whichever coalition holds power, reflecting ' +
            "Tanjung's business-first strategy of maintaining government relationships.",
          administration: 'Prabowo Subianto',
        },
      ],
      editorialStances: [
        {
          topic: 'Economic policy',
          stance: 'Strongly pro-business, pro-investment',
          examples: [
            'Favorable framing of Omnibus Law on Job Creation',
            'Minimal coverage of labor protests against CT Corp business interests',
          ],
        },
        {
          topic: 'Political coverage',
          stance: 'Government-accommodating, avoids confrontation',
          examples: [
            'Soft coverage of government controversies',
            'Rapid amplification of government press releases without critical analysis',
          ],
        },
      ],
      audienceDemographics: {
        estimatedMonthlyReach: '50-60 million unique visitors (web)',
        primaryDemographic: 'Urban Indonesians, 20-45 years old, all income levels',
        geographicFocus: 'National with Java concentration',
        platformBreakdown: {
          web: '45%',
          mobile: '40%',
          social: '15%',
        },
      },
      reliabilityRecord: [
        {
          incident: 'Frequent speed-over-accuracy errors in breaking news coverage',
          date: 'Ongoing',
          impact: 'Headlines and initial reports occasionally require correction',
          outcome: 'Corrections issued but often after initial framing has spread widely',
        },
        {
          incident: 'Perceived soft coverage of CT Corp business activities',
          date: '2011-present',
          impact: 'Reduced credibility on business reporting involving owner interests',
          outcome: 'No editorial policy change; conflicts of interest persist',
        },
      ],
      biasExamples: [
        {
          topic: 'CT Corp business dealings',
          expectedCoverage: 'Critical scrutiny of conglomerate activities',
          actualCoverage:
            'Minimal investigative coverage of Trans Media, Bank Mega, or other CT Corp ' +
            'subsidiaries. Promotional tone when covering CT Corp expansion.',
          analysis:
            'Clear owner-protection bias. Stories involving CT Corp are either absent or ' +
            'framed positively, while competitor business issues receive more critical treatment.',
        },
        {
          topic: 'Government economic policy during Widodo era',
          expectedCoverage: 'Balanced analysis of economic reforms including downsides',
          actualCoverage:
            'Predominantly positive framing of economic policy with minimal space for critics',
          analysis:
            "Alignment with owner's government-friendly positioning. Economic stories " +
            'consistently emphasize growth metrics while downplaying inequality or labor issues.',
          date: '2014-2024',
        },
      ],
      foundingContext:
        "Founded in 1998 by Budiono Darsono as Indonesia's first online-only news portal, " +
        'launching at the height of the Reformasi movement. The name "Detik" (second/moment) ' +
        'reflected its emphasis on real-time news. Became a digital pioneer but was acquired by ' +
        'CT Corp (Chairul Tanjung) in 2011, fundamentally changing its ownership structure and ' +
        'editorial independence.',
      keyMilestones: [
        {
          year: '1998',
          event: "Founded by Budiono Darsono as Indonesia's first online-only portal",
        },
        { year: '2004', event: 'Became top Indonesian news site by traffic' },
        { year: '2011', event: 'Acquired by CT Corp (Chairul Tanjung) for ~$60M' },
        { year: '2014', event: 'Owner Tanjung served as Coordinating Economic Affairs Minister' },
        { year: '2017', event: 'Expanded into 20+ vertical content channels' },
      ],
    },
  },

  // ──────────────────────────────────────────────────────────
  // 3. TEMPO
  // ──────────────────────────────────────────────────────────
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
        'Founded 1971 by Goenawan Mohamad (poet and essayist). Banned by Suharto regime on ' +
        'June 21, 1994 (along with Editor and DeTik magazine). Returned after Reformasi in ' +
        "1998. Indonesia's premier investigative journalism outlet. Collaborated with ICIJ " +
        '(International Consortium of Investigative Journalists). Staff frequently threatened, ' +
        'offices attacked.',
    },
    editorialGoal: 'Investigative journalism, democratic accountability, anti-corruption',
    reliabilityScore: 0.9,
    audienceTypes: ['elite-policy', 'urban-middle', 'international'],
    biasDirection: 'anti-government',
    signalWeight: 1.0,
    active: true,
    extendedProfile: {
      ownershipChain: [
        { entity: 'PT Tempo Inti Media Tbk', role: 'direct-owner', stake: '100%' },
        { entity: 'Tempo Media Group', role: 'parent-company', since: '1971' },
        {
          entity: 'Goenawan Mohamad / editorial trust structure',
          role: 'ultimate-beneficiary',
          since: '1971',
        },
      ],
      politicalHistory: [
        {
          period: '1971-1994',
          stance: 'Increasingly confrontational with Suharto regime',
          details:
            'Founded by Goenawan Mohamad as a news magazine modeled on Der Spiegel and ' +
            'Time. Gradually pushed boundaries of press freedom with investigative ' +
            'reporting on corruption and military abuses.',
          administration: 'Suharto (New Order)',
        },
        {
          period: '1994-1998',
          stance: 'Banned — underground resistance',
          details:
            'Banned by Suharto regime on June 21, 1994, along with Editor magazine and DeTik ' +
            'magazine. Staff continued independent journalism through alternative channels.',
          administration: 'Suharto (New Order)',
        },
        {
          period: '1998-2014',
          stance: 'Fiercely independent, anti-corruption',
          details:
            'Returned after Reformasi. Became the gold standard for Indonesian investigative ' +
            'journalism. Equal-opportunity watchdog across Habibie, Wahid, Megawati, and ' +
            'Yudhoyono administrations.',
          administration: 'Post-Suharto transition / Yudhoyono',
        },
        {
          period: '2014-2024',
          stance: 'Independent watchdog, critical of Widodo consolidation',
          details:
            'Maintained investigative edge. Criticized Widodo on democratic backsliding, ' +
            'press freedom concerns, and third-term maneuvering. Collaborated with ICIJ on ' +
            'Panama Papers and other international investigations.',
          administration: 'Joko Widodo',
        },
        {
          period: '2024-present',
          stance: 'Independent watchdog',
          details:
            'Continuing tradition of holding power accountable regardless of political ' +
            'affiliation. Critical scrutiny of Prabowo administration.',
          administration: 'Prabowo Subianto',
        },
      ],
      editorialStances: [
        {
          topic: 'Corruption',
          stance: 'Zero tolerance, aggressive investigation',
          examples: [
            'Multi-part investigation of state-owned enterprise corruption',
            'ICIJ collaboration on Panama Papers Indonesia connections',
            'Ongoing coverage of KPK (anti-corruption agency) weakening',
          ],
        },
        {
          topic: 'Press freedom',
          stance: 'Strongest advocate in Indonesian media',
          examples: [
            'Direct editorials criticizing government intimidation of journalists',
            'Legal defense of reporters facing lawsuits',
          ],
        },
        {
          topic: 'Human rights',
          stance: 'Strong advocacy for accountability',
          examples: [
            'Coverage of past military human rights abuses',
            'Investigative reporting on Papua and West Papua',
          ],
        },
      ],
      audienceDemographics: {
        estimatedMonthlyReach: '15-20 million unique visitors (web)',
        primaryDemographic: 'Educated professionals, intellectuals, policymakers, 25-60 years old',
        geographicFocus:
          'National with strong Jakarta/Java concentration; English edition for international audience',
        platformBreakdown: {
          print: '10% (weekly magazine)',
          web: '50%',
          mobile: '30%',
          social: '10%',
        },
      },
      reliabilityRecord: [
        {
          incident: 'High-profile investigative reports consistently withstand legal challenges',
          date: '2000-present',
          impact: 'Enhanced credibility through legal vindication',
          outcome: "Reputation as Indonesia's most legally tested and verified news outlet",
        },
      ],
      biasExamples: [
        {
          topic: 'Government policy',
          expectedCoverage: 'Balanced reporting including government achievements',
          actualCoverage:
            'Disproportionate focus on government failures and corruption, with less coverage ' +
            'of successful policy implementation.',
          analysis:
            'Anti-government bias is a function of investigative mission — Tempo sees its ' +
            'role as holding power accountable rather than reporting on successes. This creates ' +
            'a systematic tilt toward negative government coverage.',
        },
      ],
      pressFreedomIncidents: [
        {
          date: '1994-06-21',
          description:
            'Banned by Suharto regime along with Editor and DeTik magazine for critical ' +
            'coverage of military procurement corruption.',
          outcome: 'Resumed publication after Reformasi in 1998.',
        },
        {
          date: '2003',
          description:
            'Tempo office in Jakarta attacked by a mob during sensitive coverage period.',
          outcome: 'Continued publication; perpetrators never fully identified.',
        },
        {
          date: 'Ongoing',
          description: 'Staff members frequently receive threats related to investigative work.',
          outcome: 'Tempo maintains security protocols and legal defense fund.',
        },
      ],
      awards: [
        { name: 'CPJ International Press Freedom Award', year: '1998' },
        { name: 'Adinegoro Award', year: '2015', category: 'Investigative journalism' },
        { name: 'SOPA Award for Excellence', year: '2019', category: 'Investigative reporting' },
      ],
      foundingContext:
        'Founded in 1971 by Goenawan Mohamad, a poet and essayist, as a weekly news magazine. ' +
        'Modeled on international investigative publications. From its earliest years, Tempo ' +
        "pushed the boundaries of what was permissible under Suharto's New Order, building a " +
        'reputation for courage and quality that endured through its 1994 banning and 1998 ' +
        'resurrection. It remains the closest Indonesian equivalent to The Economist or ' +
        'Der Spiegel.',
      keyMilestones: [
        { year: '1971', event: 'Founded by Goenawan Mohamad as a weekly news magazine' },
        { year: '1994', event: 'Banned by Suharto regime on June 21 along with Editor and DeTik' },
        { year: '1998', event: 'Resumed publication after Reformasi' },
        { year: '2008', event: 'Launched Tempo.co digital platform and English edition' },
        {
          year: '2016',
          event: 'Joined ICIJ (International Consortium of Investigative Journalists)',
        },
      ],
    },
  },

  // ──────────────────────────────────────────────────────────
  // 4. THE JAKARTA POST
  // ──────────────────────────────────────────────────────────
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
    extendedProfile: {
      ownershipChain: [
        { entity: 'PT Bina Media Tenggara', role: 'direct-owner', stake: '100%' },
        {
          entity: 'Consortium of Indonesian media companies',
          role: 'parent-company',
          since: '1983',
        },
      ],
      politicalHistory: [
        {
          period: '1983-1998',
          stance: 'Moderate, operating within New Order constraints',
          details:
            'Established as an English-language daily with support from multiple Indonesian ' +
            'media groups. Served as a window into Indonesia for the international community. ' +
            'Operated within Suharto-era press constraints but maintained higher standards.',
          administration: 'Suharto (New Order)',
        },
        {
          period: '1998-2014',
          stance: 'Progressive, internationally oriented',
          details:
            'Post-Reformasi, became an important voice for progressive values and ' +
            'international-standard journalism. Attracted internationally trained journalists.',
          administration: 'Post-Suharto transition / Yudhoyono',
        },
        {
          period: '2014-present',
          stance: 'Moderate-progressive, critical on human rights and environment',
          details:
            'Maintained editorial independence with a progressive tilt on social issues. ' +
            'Strong coverage of environmental, human rights, and governance topics. Important ' +
            'bridge between Indonesian politics and international perception.',
          administration: 'Widodo / Prabowo',
        },
      ],
      editorialStances: [
        {
          topic: 'Environment and climate',
          stance: 'Strongly pro-environmental protection',
          examples: [
            'Extensive palm oil deforestation investigations',
            'Critical coverage of Jakarta air quality crisis',
          ],
        },
        {
          topic: 'Human rights',
          stance: 'Progressive, aligned with international standards',
          examples: [
            'Coverage of Papua human rights concerns',
            'Editorials on LGBTQ+ rights and minority protections',
          ],
        },
        {
          topic: 'Foreign investment',
          stance: 'Pro-investment with governance caveats',
          examples: [
            'Balanced coverage of Chinese investment projects',
            'Analysis of Nusantara capital relocation from multiple angles',
          ],
        },
      ],
      audienceDemographics: {
        estimatedMonthlyReach: '5-8 million unique visitors (web)',
        primaryDemographic: 'Diplomats, expats, English-speaking Indonesian elite, 30-60 years old',
        geographicFocus: 'Jakarta-centric with international readership',
        platformBreakdown: {
          print: '10%',
          web: '60%',
          mobile: '20%',
          social: '10%',
        },
      },
      reliabilityRecord: [
        {
          incident: 'Financial difficulties led to paywall implementation and staff reductions',
          date: '2020-2021',
          impact:
            'Reduced reporting capacity but maintained editorial standards on published content',
          outcome: 'Stabilized through digital subscription model',
        },
      ],
      biasExamples: [
        {
          topic: 'Social conservatism',
          expectedCoverage: 'Representation of conservative social views alongside progressive',
          actualCoverage:
            'Progressive framing on social issues that may not reflect majority Indonesian opinion',
          analysis:
            'English-language readership and international orientation create a progressive ' +
            'echo chamber that may underrepresent conservative Indonesian perspectives.',
        },
      ],
      foundingContext:
        'Founded in 1983 by a consortium of Indonesian media companies to provide an ' +
        "English-language newspaper serving Jakarta's diplomatic community, expats, and " +
        'internationally-minded Indonesians. Has served as a crucial bridge for international ' +
        'understanding of Indonesian affairs and is often the first source cited by foreign ' +
        'media covering Indonesia.',
      keyMilestones: [
        { year: '1983', event: "Founded as Indonesia's premier English-language daily" },
        { year: '1998', event: 'Expanded coverage during Reformasi period' },
        { year: '2010', event: 'Launched comprehensive digital platform' },
        { year: '2020', event: 'Implemented paywall; shifted to subscription model' },
      ],
    },
  },

  // ──────────────────────────────────────────────────────────
  // 5. CNN INDONESIA
  // ──────────────────────────────────────────────────────────
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
        "government-friendly framing on economic stories. Part of Tanjung's broader " +
        'media empire including Trans TV, Trans 7, and CNBC Indonesia.',
    },
    editorialGoal: 'Mainstream TV/digital news, centrist positioning',
    reliabilityScore: 0.7,
    audienceTypes: ['urban-middle', 'youth-digital'],
    biasDirection: 'pro-government',
    signalWeight: 0.8,
    active: true,
    extendedProfile: {
      ownershipChain: [
        { entity: 'PT Trans Media Corpora', role: 'direct-owner', stake: '100%' },
        { entity: 'Trans Media Group', role: 'parent-company', since: '2015' },
        { entity: 'CT Corp (Chairul Tanjung)', role: 'ultimate-beneficiary', since: '2015' },
      ],
      politicalHistory: [
        {
          period: '2015-2024',
          stance: 'Centrist positioning with pro-government undertone',
          details:
            'Launched under CT Corp ownership. Benefits from CNN brand credibility but ' +
            'operates under the same ownership influence as Detik. More polished presentation ' +
            'but similar editorial constraints on topics affecting owner interests.',
          administration: 'Joko Widodo',
        },
        {
          period: '2024-present',
          stance: 'Mainstream centrist, business-aligned',
          details:
            'Continuing centrist positioning with pro-business framing under new administration.',
          administration: 'Prabowo Subianto',
        },
      ],
      editorialStances: [
        {
          topic: 'Economic news',
          stance: 'Pro-business, investor-friendly framing',
          examples: [
            'Emphasis on positive economic indicators',
            'Favorable coverage of foreign investment deals',
          ],
        },
        {
          topic: 'Political coverage',
          stance: 'Centrist but avoids challenging government on economic issues',
          examples: [
            'Balanced presentation on social/cultural issues',
            'Government-accommodating tone on economic and business policy',
          ],
        },
      ],
      audienceDemographics: {
        estimatedMonthlyReach: '20-25 million unique visitors (web + TV)',
        primaryDemographic: 'Urban middle class, 25-50 years old, news-conscious',
        geographicFocus: 'Major cities, Java-centric',
        platformBreakdown: {
          tv: '30%',
          web: '40%',
          mobile: '20%',
          social: '10%',
        },
      },
      reliabilityRecord: [
        {
          incident:
            'CNN brand license creates perception of higher standards than actual editorial independence',
          date: 'Ongoing',
          impact: 'Audience may overestimate editorial independence due to CNN brand association',
          outcome: 'No formal clarification of editorial relationship with parent company',
        },
      ],
      biasExamples: [
        {
          topic: 'CT Corp business activities',
          expectedCoverage: 'Independent reporting on Trans Media parent company',
          actualCoverage: 'Avoidance of critical coverage of CT Corp or Tanjung family interests',
          analysis:
            'Same owner-protection pattern as Detik. CNN Indonesia brand provides a veneer ' +
            'of international editorial standards while operating under CT Corp constraints.',
        },
      ],
      foundingContext:
        'Launched in 2015 as a licensed CNN brand operated by Trans Media Group (CT Corp). ' +
        'Positioned as a premium news channel leveraging the CNN brand reputation. Operates ' +
        'both a TV channel and a digital news platform. While benefiting from global CNN ' +
        'brand credibility, editorial decisions are made by the local CT Corp-owned operation.',
      keyMilestones: [
        { year: '2015', event: 'Launched as licensed CNN brand under Trans Media Group' },
        { year: '2016', event: 'Expanded digital platform with dedicated website' },
        { year: '2019', event: 'Became one of the most-watched news channels in Indonesia' },
      ],
    },
  },

  // ──────────────────────────────────────────────────────────
  // 6. tvONE / VIVA
  // ──────────────────────────────────────────────────────────
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
    extendedProfile: {
      ownershipChain: [
        { entity: 'PT Visi Media Asia Tbk', role: 'direct-owner', stake: '100%' },
        { entity: 'Bakrie Group', role: 'parent-company', since: '2008' },
        { entity: 'Aburizal Bakrie family', role: 'ultimate-beneficiary', since: '2008' },
      ],
      politicalHistory: [
        {
          period: '2008-2014',
          stance: 'Golkar party vehicle, pro-Bakrie candidacy',
          details:
            'tvOne launched as Bakrie sought the presidency. Coverage functioned as de facto ' +
            'campaign platform for Bakrie and Golkar party interests. Aburizal Bakrie served ' +
            'as Golkar chairman 2009-2014.',
          administration: 'Yudhoyono',
        },
        {
          period: '2014-2024',
          stance: 'Shifted to coalition-aligned, then pro-government',
          details:
            "After Bakrie's presidential ambitions faded, tvOne/Viva pivoted to supporting " +
            'whichever coalition the Bakrie family aligned with, maintaining access and ' +
            'protecting business interests.',
          administration: 'Joko Widodo',
        },
        {
          period: '2024-present',
          stance: 'Pro-coalition, aligned with governing parties',
          details:
            'Continues pattern of aligning with the ruling coalition to protect Bakrie ' +
            'family business interests.',
          administration: 'Prabowo Subianto',
        },
      ],
      editorialStances: [
        {
          topic: 'Bakrie business interests',
          stance: 'Protective and promotional',
          examples: [
            'Minimal critical coverage of Lapindo mud disaster and Bakrie Group liability',
            'Favorable coverage of Bakrie Group business activities',
          ],
        },
        {
          topic: 'Coalition politics',
          stance: 'Supportive of whichever coalition Bakrie aligns with',
          examples: [
            "Shifts in editorial tone track Bakrie's political alliances",
            'Negative coverage of politicians opposing Bakrie-aligned coalition',
          ],
        },
      ],
      audienceDemographics: {
        estimatedMonthlyReach: '10-15 million (TV + digital combined)',
        primaryDemographic: 'Mass market TV viewers, 30-60 years old, lower-middle to middle class',
        geographicFocus: 'National TV reach with strong outer islands penetration',
        platformBreakdown: {
          tv: '60%',
          web: '25%',
          mobile: '10%',
          social: '5%',
        },
      },
      reliabilityRecord: [
        {
          incident: 'Lapindo mudflow coverage omissions',
          date: '2006-present',
          impact:
            'Severe credibility damage: perceived as protecting Bakrie from Lapindo liability',
          outcome: 'Widely cited as example of oligarch media capture in Indonesia',
        },
        {
          incident: 'Obvious editorial shifts tracking Bakrie political alliances',
          date: '2008-present',
          impact: 'Known as political mouthpiece rather than independent news source',
          outcome: 'Low credibility among media-literate audiences',
        },
      ],
      biasExamples: [
        {
          topic: 'Lapindo mud disaster (Sidoarjo)',
          expectedCoverage:
            "Investigation of Bakrie Group's responsibility for the catastrophic mudflow",
          actualCoverage:
            'Blamed natural causes, minimized Bakrie Group involvement, limited coverage ' +
            "of victims' ongoing displacement.",
          analysis:
            'Textbook case of owner-interest protection. One of the largest environmental ' +
            'disasters in Indonesian history received minimal critical coverage on the ' +
            "owner's own media platforms.",
        },
      ],
      foundingContext:
        "tvOne was launched in 2008 by the Bakrie Group's media arm as Aburizal Bakrie " +
        'was positioning himself for a presidential run. The channel was explicitly created ' +
        'as a news-focused platform but has always functioned partly as a political vehicle ' +
        'for Bakrie family interests and their Golkar party alliances.',
      keyMilestones: [
        { year: '2008', event: 'tvOne launched as news-focused TV channel under Bakrie Group' },
        { year: '2009', event: 'Aburizal Bakrie became Golkar chairman; tvOne served as platform' },
        {
          year: '2014',
          event: "Bakrie's presidential bid ended; editorial realigned to coalition",
        },
        { year: '2016', event: 'Viva.co.id digital platform expanded' },
      ],
    },
  },

  // ──────────────────────────────────────────────────────────
  // 7. MEDIA INDONESIA
  // ──────────────────────────────────────────────────────────
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
    extendedProfile: {
      ownershipChain: [
        { entity: 'PT Citra Media Nusa Purnama', role: 'direct-owner', stake: '100%' },
        { entity: 'Media Group', role: 'parent-company', since: '1989' },
        { entity: 'Surya Paloh', role: 'ultimate-beneficiary', since: '1989' },
      ],
      politicalHistory: [
        {
          period: '1989-2011',
          stance: 'Paloh-aligned, pre-NasDem',
          details:
            'Founded by Surya Paloh. Before NasDem was established, Media Indonesia reflected ' +
            "Paloh's personal political views and business interests. Generally centrist to " +
            "pro-government depending on Paloh's relationship with the sitting president.",
          administration: 'Suharto / Post-Suharto transition',
        },
        {
          period: '2011-present',
          stance: 'NasDem party vehicle',
          details:
            'After Paloh founded the NasDem party in 2011, Media Indonesia and Metro TV ' +
            "became explicit NasDem platforms. Coverage tracks NasDem's coalition positioning: " +
            'pro-government when in coalition, more critical when negotiating position.',
          administration: 'Yudhoyono / Widodo / Prabowo',
        },
      ],
      editorialStances: [
        {
          topic: 'NasDem party interests',
          stance: 'Promotional and protective',
          examples: [
            'Favorable coverage of NasDem politicians and policy positions',
            'Minimal critical coverage of NasDem internal politics or controversies',
          ],
        },
        {
          topic: 'Government policy (when NasDem in coalition)',
          stance: 'Supportive, emphasizing NasDem contributions',
          examples: [
            "Highlighting NasDem ministers' achievements",
            'Framing government successes as NasDem-influenced',
          ],
        },
      ],
      audienceDemographics: {
        estimatedMonthlyReach: '5-8 million (print + digital + Metro TV)',
        primaryDemographic:
          'Political class, NasDem supporters, urban professionals, 35-60 years old',
        geographicFocus: 'Jakarta political bubble with national TV reach via Metro TV',
        platformBreakdown: {
          print: '15%',
          tv: '40% (Metro TV)',
          web: '30%',
          mobile: '10%',
          social: '5%',
        },
      },
      reliabilityRecord: [
        {
          incident: 'Coverage swing during NasDem coalition negotiations',
          date: '2014, 2019, 2024',
          impact: 'Transparent correlation between NasDem political position and editorial tone',
          outcome: 'Well-known among media observers as party media; discounted accordingly',
        },
      ],
      biasExamples: [
        {
          topic: 'NasDem coalition positioning',
          expectedCoverage: 'Independent analysis of coalition dynamics',
          actualCoverage:
            "Coverage shifts in lockstep with NasDem's negotiating position. When NasDem " +
            "joined Prabowo's coalition, coverage of Prabowo shifted from critical to supportive.",
          analysis:
            'The most transparent case of party-media alignment in Indonesia. Editorial line ' +
            "is essentially NasDem's communications strategy delivered through a news format.",
        },
      ],
      foundingContext:
        'Founded in 1989 by Surya Paloh, a businessman who would later found the NasDem ' +
        "party in 2011. From inception, Media Indonesia served as Paloh's personal media " +
        'platform. Metro TV was added to the Media Group portfolio in 2000. Together they ' +
        "form the NasDem party's primary media infrastructure.",
      keyMilestones: [
        { year: '1989', event: 'Founded by Surya Paloh' },
        { year: '2000', event: 'Metro TV launched under Media Group' },
        { year: '2011', event: 'Paloh founded NasDem party; media became party vehicle' },
        { year: '2014', event: 'NasDem joined Widodo coalition; coverage aligned accordingly' },
        { year: '2024', event: 'NasDem joined Prabowo coalition; editorial pivot followed' },
      ],
    },
  },

  // ──────────────────────────────────────────────────────────
  // 8. REPUBLIKA
  // ──────────────────────────────────────────────────────────
  {
    id: 'republika',
    name: 'Republika',
    country: 'ID',
    languages: ['id'],
    url: 'https://republika.co.id',
    feedUrls: ['https://republika.co.id/rss'],
    politicalLeaning: 'islamic-conservative',
    ownership: {
      owner: 'Mahaka Media Group',
      conglomerate: 'Mahaka Media',
      politicalAffiliation: 'Islamic conservative, historically ICMI-aligned',
      notes:
        'Founded 1993 with backing from ICMI (Association of Indonesian Muslim Intellectuals). ' +
        'Acquired by Mahaka Media Group (Erick Thohir) in 2001. Thohir became Minister of SOEs ' +
        "under both Widodo and Prabowo. He was Widodo's campaign chairman in 2019, then " +
        'campaigned for Prabowo in 2024. Important gauge of Islamic community sentiment.',
    },
    editorialGoal: 'Islamic community voice, conservative social values, Muslim interests',
    reliabilityScore: 0.6,
    audienceTypes: ['urban-middle', 'rural-mass'],
    biasDirection: 'neutral',
    signalWeight: 0.8,
    active: true,
    extendedProfile: {
      ownershipChain: [
        { entity: 'PT Republika Media Mandiri', role: 'direct-owner', stake: '100%' },
        { entity: 'Mahaka Media Group', role: 'parent-company', since: '2001' },
        { entity: 'Erick Thohir', role: 'ultimate-beneficiary', since: '2001' },
      ],
      politicalHistory: [
        {
          period: '1993-2001',
          stance: 'ICMI-aligned Islamic intellectual voice',
          details:
            'Founded with backing from ICMI (Association of Indonesian Muslim Intellectuals), ' +
            'closely associated with BJ Habibie. Served as the voice of modernist Islamic ' +
            'intellectual elite during late Suharto era and Reformasi.',
          administration: 'Suharto / Habibie',
        },
        {
          period: '2001-2019',
          stance: 'Islamic conservative with Thohir business influence',
          details:
            'After Mahaka Media acquisition by Erick Thohir in 2001, maintained Islamic ' +
            "editorial identity while increasingly reflecting Thohir's business and " +
            'political interests.',
          administration: 'Megawati / Yudhoyono / Widodo',
        },
        {
          period: '2019-2024',
          stance: 'Pro-Widodo via Thohir connection',
          details:
            "Thohir served as Widodo's 2019 campaign chairman and then as Minister of SOEs. " +
            "Republika's coverage became more government-accommodating during this period, " +
            'particularly on economic issues and SOE policy.',
          administration: 'Joko Widodo',
        },
        {
          period: '2024-present',
          stance: 'Pro-Prabowo via Thohir continuity',
          details:
            'Thohir campaigned for Prabowo in 2024 and continues as Minister of SOEs. ' +
            'Republika maintains alignment through this political transition.',
          administration: 'Prabowo Subianto',
        },
      ],
      editorialStances: [
        {
          topic: 'Islamic affairs',
          stance: 'Conservative Islamic perspective, mainstream Sunni',
          examples: [
            'Prioritizes coverage of Islamic holidays, halal economy, Islamic finance',
            'Conservative positions on social issues like LGBTQ+ rights and alcohol regulation',
          ],
        },
        {
          topic: 'Palestinian solidarity',
          stance: 'Strongly pro-Palestinian',
          examples: [
            'Extensive coverage of Gaza conflict from Palestinian perspective',
            'Amplification of Indonesian Islamic solidarity movements',
          ],
        },
        {
          topic: 'SOE policy (via Thohir connection)',
          stance: 'Favorable to SOE reform under Thohir',
          examples: [
            'Positive framing of SOE restructuring initiatives',
            'Limited critical coverage of SOE controversies during Thohir tenure',
          ],
        },
      ],
      audienceDemographics: {
        estimatedMonthlyReach: '10-15 million unique visitors (web)',
        primaryDemographic: 'Muslim middle class, devout conservatives, 25-55 years old',
        geographicFocus: 'National with strong Java and Sumatra readership',
        platformBreakdown: {
          print: '10%',
          web: '55%',
          mobile: '25%',
          social: '10%',
        },
      },
      reliabilityRecord: [
        {
          incident: 'Coverage shift correlating with Thohir political transitions',
          date: '2019-2024',
          impact: 'Perceived politicization of Islamic media platform',
          outcome: 'Maintains Islamic community credibility but political independence questioned',
        },
      ],
      biasExamples: [
        {
          topic: 'Erick Thohir and SOE management',
          expectedCoverage:
            'Critical investigation of SOE performance and ministerial accountability',
          actualCoverage:
            "Favorable coverage of Thohir's SOE reform agenda; minimal coverage of " +
            'SOE controversies during his tenure.',
          analysis:
            'Owner-alignment bias operating through Islamic media frame. Economic coverage ' +
            "tracks Thohir's interests while Islamic identity topics maintain editorial integrity.",
          date: '2019-present',
        },
      ],
      foundingContext:
        'Founded in 1993 with backing from ICMI (Association of Indonesian Muslim Intellectuals), ' +
        'an influential organization closely associated with BJ Habibie during the late Suharto era. ' +
        'Represented the voice of modernist Islamic intellectuals seeking a mainstream Islamic daily. ' +
        'Acquired by Mahaka Media Group (Erick Thohir) in 2001, adding a layer of oligarchic ' +
        'ownership to its Islamic editorial mission.',
      keyMilestones: [
        { year: '1993', event: 'Founded with ICMI backing as an Islamic daily newspaper' },
        { year: '2001', event: 'Acquired by Mahaka Media Group (Erick Thohir)' },
        { year: '2010', event: 'Launched Republika.co.id digital platform' },
        {
          year: '2019',
          event: 'Owner Thohir became Widodo campaign chairman, then Minister of SOEs',
        },
        { year: '2024', event: 'Thohir campaigned for Prabowo; continues as SOE Minister' },
      ],
    },
  },

  // ──────────────────────────────────────────────────────────
  // 9. KUMPARAN
  // ──────────────────────────────────────────────────────────
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
        'Digital-native news platform founded 2016 by Hugo Diba (former Detik executive). ' +
        "As of December 2024, GDP Venture (Djarum Group's VC arm) owns 99.99%. Djarum Group " +
        "is one of Indonesia's largest conglomerates (tobacco, banking via BCA, tech).",
    },
    editorialGoal: 'Digital-native independent journalism for younger Indonesians',
    reliabilityScore: 0.65,
    audienceTypes: ['youth-digital', 'urban-middle'],
    biasDirection: 'neutral',
    signalWeight: 0.9,
    active: true,
    extendedProfile: {
      ownershipChain: [
        { entity: 'PT Jenius Bangun Raharja', role: 'direct-owner', stake: '100%' },
        {
          entity: 'GDP Venture (Djarum Group VC arm)',
          role: 'parent-company',
          stake: '99.99%',
          since: '2024',
        },
        { entity: 'Djarum Group (Hartono family)', role: 'ultimate-beneficiary', since: '2024' },
      ],
      politicalHistory: [
        {
          period: '2016-2020',
          stance: 'Independent digital startup',
          details:
            'Founded by Hugo Diba (CEO, former Detik executive) as a mobile-first news ' +
            'platform. Positioned as a fresh alternative to legacy media. Initial VC funding ' +
            'from various sources including GDP Venture.',
          administration: 'Joko Widodo',
        },
        {
          period: '2020-present',
          stance: 'Independent editorial with Djarum Group ownership concentration',
          details:
            'GDP Venture (Djarum Group VC arm) progressively increased stake to 99.99% by ' +
            "December 2024. Djarum Group is one of Indonesia's largest conglomerates (tobacco, " +
            'banking via BCA, technology). While editorial line remains generally independent, ' +
            'the concentration of ownership under Djarum raises questions about coverage of ' +
            'tobacco regulation, banking policy, and Djarum Group business interests.',
          administration: 'Joko Widodo / Prabowo Subianto',
        },
      ],
      editorialStances: [
        {
          topic: 'Digital innovation and tech',
          stance: 'Enthusiastically pro-tech',
          examples: [
            'Extensive coverage of Indonesian startup ecosystem',
            'Positive framing of digital transformation initiatives',
          ],
        },
        {
          topic: 'Social and cultural issues',
          stance: 'Moderate-progressive, youth-oriented',
          examples: [
            'Coverage of mental health awareness and work-life balance',
            'Pop culture and lifestyle content alongside hard news',
          ],
        },
      ],
      audienceDemographics: {
        estimatedMonthlyReach: '15-20 million unique visitors (web + app)',
        primaryDemographic: 'Urban millennials and Gen Z, 18-35 years old',
        geographicFocus: 'Major cities, mobile-first audience',
        platformBreakdown: {
          app: '40%',
          web: '30%',
          social: '30%',
        },
      },
      reliabilityRecord: [
        {
          incident: 'Growing pains with user-generated content quality control',
          date: '2017-2019',
          impact: 'Some low-quality or misleading user-contributed content',
          outcome: 'Tightened editorial review processes; separated professional from user content',
        },
      ],
      biasExamples: [
        {
          topic: 'Tobacco regulation and Djarum Group',
          expectedCoverage:
            'Critical coverage of tobacco industry lobbying and health impacts, including ' +
            "Djarum's role as a major tobacco company",
          actualCoverage:
            'Limited investigative coverage of tobacco regulation and Djarum Group activities',
          analysis:
            'With GDP Venture (Djarum) owning 99.99%, coverage of tobacco policy, BCA banking ' +
            'regulation, and other Djarum interests represents a significant potential blind spot.',
        },
      ],
      foundingContext:
        'Founded in 2016 by Hugo Diba, a former Detik executive, as a mobile-first news ' +
        "platform targeting Indonesia's young digital audience. Represented a new generation " +
        'of Indonesian news media with social-media-native distribution. However, by December ' +
        "2024, GDP Venture (Djarum Group's VC arm) had acquired 99.99% ownership, concentrating " +
        "control under one of Indonesia's largest conglomerates.",
      keyMilestones: [
        { year: '2016', event: 'Founded by Hugo Diba as a mobile-first news platform' },
        {
          year: '2017',
          event: 'Launched community-driven content alongside professional editorial',
        },
        { year: '2020', event: 'GDP Venture (Djarum) increased stake significantly' },
        { year: '2024', event: 'GDP Venture stake reached 99.99%, full Djarum Group control' },
      ],
    },
  },

  // ──────────────────────────────────────────────────────────
  // 10. ANTARA
  // ──────────────────────────────────────────────────────────
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
    extendedProfile: {
      ownershipChain: [
        {
          entity: 'LKBN ANTARA (Lembaga Kantor Berita Nasional)',
          role: 'direct-owner',
          stake: '100%',
        },
        { entity: 'Republic of Indonesia', role: 'ultimate-beneficiary', since: '1937' },
      ],
      politicalHistory: [
        {
          period: '1937-1945',
          stance: 'Pro-independence nationalist',
          details:
            'Founded during the colonial period as a nationalist news agency. Played a ' +
            'crucial role in disseminating the proclamation of Indonesian independence in 1945.',
          administration: 'Colonial / Independence movement',
        },
        {
          period: '1945-1998',
          stance: 'State mouthpiece under successive governments',
          details:
            'Served as the official state wire service through Sukarno and Suharto eras. ' +
            "During the New Order, functioned as the government's primary news dissemination tool.",
          administration: 'Sukarno / Suharto',
        },
        {
          period: '1998-present',
          stance: 'Modernized state agency, still government-aligned',
          details:
            'Post-Reformasi, ANTARA modernized its operations and digital presence but remains ' +
            'fundamentally a state wire service. Coverage always reflects the government position ' +
            'by institutional design, regardless of which administration is in power.',
          administration: 'All post-Reformasi administrations',
        },
      ],
      editorialStances: [
        {
          topic: 'Government policy',
          stance: 'Official government position by definition',
          examples: [
            'All government press releases distributed through ANTARA',
            'Coverage of government programs always framed positively',
          ],
        },
        {
          topic: 'International relations',
          stance: 'Reflects Ministry of Foreign Affairs positions',
          examples: [
            'ASEAN coverage aligned with government diplomatic priorities',
            'Framing of bilateral relationships tracks official positions',
          ],
        },
      ],
      audienceDemographics: {
        estimatedMonthlyReach: '8-12 million unique visitors (web)',
        primaryDemographic: 'Government officials, regional media, policy researchers',
        geographicFocus: 'National with regional bureau network',
        platformBreakdown: {
          wire: '30%',
          web: '40%',
          mobile: '20%',
          social: '10%',
        },
      },
      reliabilityRecord: [
        {
          incident: 'Factually accurate on government statements; omits critical perspectives',
          date: 'Ongoing',
          impact: 'Reliable for what the government says; unreliable for what it does not say',
          outcome: 'Understood by media professionals as government voice, not independent news',
        },
      ],
      biasExamples: [
        {
          topic: 'All government policy',
          expectedCoverage: 'Balanced analysis including opposition perspectives',
          actualCoverage:
            'Government position presented as authoritative; opposition views absent or minimized',
          analysis:
            'Not a failure of journalism but a structural feature: ANTARA is designed to ' +
            'propagate government narrative. Its value in sentiment analysis is as a baseline ' +
            'for the official government position.',
        },
      ],
      foundingContext:
        'Established in 1937 during the Dutch colonial period as a nationalist news agency. ' +
        'Played a historic role in transmitting the Indonesian declaration of independence in ' +
        '1945. Has served as the official state wire service through every Indonesian government. ' +
        'Remains the primary channel for official government communications to media outlets ' +
        'across the archipelago.',
      keyMilestones: [
        { year: '1937', event: 'Founded as nationalist news agency during colonial period' },
        { year: '1945', event: "Transmitted Indonesia's declaration of independence" },
        { year: '1962', event: 'Established as official state news agency (LKBN)' },
        { year: '2007', event: 'Launched digital platforms and English-language service' },
      ],
    },
  },

  // ──────────────────────────────────────────────────────────
  // 11. TRIBUNNEWS
  // ──────────────────────────────────────────────────────────
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
    extendedProfile: {
      ownershipChain: [
        { entity: 'PT Tribun Digital Online', role: 'direct-owner', stake: '100%' },
        { entity: 'Kompas Gramedia Group', role: 'parent-company', since: '2003' },
        {
          entity: 'Jakob Oetama family / foundation',
          role: 'ultimate-beneficiary',
          since: '2003',
        },
      ],
      politicalHistory: [
        {
          period: '2003-present',
          stance: 'Apolitical mass-market content',
          details:
            'Launched as a network of regional tabloids under Kompas Gramedia. Evolved into ' +
            'the highest-traffic Indonesian news website. Political coverage is shallow and ' +
            'non-confrontational, focused on engagement metrics rather than editorial mission.',
          administration: 'All administrations since founding',
        },
      ],
      editorialStances: [
        {
          topic: 'All topics',
          stance: 'Engagement-driven, politically non-committal',
          examples: [
            'Headlines optimized for clicks rather than accuracy',
            'Celebrity and entertainment content mixed with news',
            'Viral story aggregation with minimal original reporting',
          ],
        },
      ],
      audienceDemographics: {
        estimatedMonthlyReach:
          "80-100 million unique visitors (web) — Indonesia's highest traffic news site",
        primaryDemographic: 'Mass market, all demographics, 15-55 years old',
        geographicFocus:
          'National with strong regional network (Tribun network covers most provinces)',
        platformBreakdown: {
          web: '50%',
          mobile: '35%',
          social: '15%',
        },
      },
      reliabilityRecord: [
        {
          incident: 'Clickbait headlines that misrepresent article content',
          date: 'Ongoing',
          impact: 'Low trust among media-literate audiences; high engagement from mass audience',
          outcome: 'No significant editorial reform; traffic-first model continues',
        },
        {
          incident: 'Aggregation of unverified social media content as news',
          date: 'Ongoing',
          impact: 'Occasional spread of misinformation through amplification',
          outcome: 'Corrections issued reactively but not systematically',
        },
      ],
      biasExamples: [
        {
          topic: 'Political coverage',
          expectedCoverage: 'Substantive analysis of policy and governance',
          actualCoverage:
            'Superficial coverage focused on personalities, drama, and viral moments. ' +
            'Complex policy issues reduced to clickable headlines.',
          analysis:
            'Bias is toward engagement rather than any political direction. This creates a ' +
            'systematic distortion where sensational aspects of political stories are amplified ' +
            'while substantive policy analysis is absent.',
        },
      ],
      foundingContext:
        "Launched in 2003 as part of Kompas Gramedia's strategy to capture the mass-market " +
        'tabloid audience that the premium Kompas broadsheet did not reach. The Tribun network ' +
        "expanded into dozens of regional editions, making it Indonesia's most widely distributed " +
        "news brand. Became the country's highest-traffic news website through aggressive SEO " +
        'and clickbait strategies.',
      keyMilestones: [
        { year: '2003', event: 'Launched as regional tabloid network under Kompas Gramedia' },
        { year: '2010', event: 'Tribunnews.com launched as unified digital platform' },
        { year: '2015', event: "Became Indonesia's highest-traffic news website" },
        { year: '2020', event: 'Expanded to 30+ regional Tribun editions' },
      ],
    },
  },

  // ──────────────────────────────────────────────────────────
  // 12. MNC GROUP (NEW)
  // ──────────────────────────────────────────────────────────
  {
    id: 'mnc-group',
    name: 'MNC Media',
    country: 'ID',
    languages: ['id'],
    url: 'https://www.inews.id',
    feedUrls: [
      'https://www.inews.id/rss',
      'https://news.okezone.com/rss',
      'https://nasional.sindonews.com/rss',
    ],
    politicalLeaning: 'oligarch-owned',
    ownership: {
      owner: 'Hary Tanoesoedibjo',
      conglomerate: 'MNC Group (Global Mediacom)',
      politicalAffiliation: 'Perindo party (founded by Tanoesoedibjo in 2015)',
      notes:
        "Indonesia's largest media group by TV audience share. Controls RCTI, MNC TV, GTV, " +
        'iNews TV, Okezone, Sindonews, iNews.id, Koran Sindo. Hary Tanoesoedibjo founded ' +
        'the Perindo party in 2015; his daughter Angela Tanoesoedibjo succeeded as party ' +
        'leader in 2024 and serves as Vice-Minister of Tourism under Prabowo. Notorious for ' +
        'using media platforms for political campaigning.',
    },
    editorialGoal: 'Mass media dominance, political vehicle for Perindo/Tanoesoedibjo interests',
    reliabilityScore: 0.4,
    audienceTypes: ['rural-mass', 'urban-middle', 'youth-digital'],
    biasDirection: 'pro-government',
    signalWeight: 0.4,
    active: true,
    extendedProfile: {
      ownershipChain: [
        { entity: 'PT Media Nusantara Citra Tbk (MNCN)', role: 'direct-owner', stake: '100%' },
        { entity: 'PT Global Mediacom Tbk', role: 'parent-company', since: '2002' },
        { entity: 'Hary Tanoesoedibjo', role: 'ultimate-beneficiary', since: '2002' },
      ],
      politicalHistory: [
        {
          period: '2002-2014',
          stance: 'Building media empire, pre-political',
          details:
            "Tanoesoedibjo consolidated Indonesia's largest media group through acquisitions " +
            'of RCTI, MNC TV, and GTV. Media operations focused on commercial entertainment ' +
            'and news, with growing political ambitions.',
          administration: 'Megawati / Yudhoyono',
        },
        {
          period: '2014-2019',
          stance: 'Active political vehicle for Tanoesoedibjo ambitions',
          details:
            'Tanoesoedibjo ran as vice-presidential candidate in 2014 (with Wiranto) on ' +
            'Hanura ticket. Founded Perindo party in 2015. MNC media platforms became ' +
            'notorious for broadcasting Perindo campaign content disguised as news, including ' +
            'the Perindo party jingle airing as "interstitial" content on RCTI and MNC TV.',
          administration: 'Joko Widodo',
        },
        {
          period: '2019-2024',
          stance: 'Pro-Widodo coalition, positioning for influence',
          details:
            'Aligned with Widodo coalition. Angela Tanoesoedibjo appointed Vice-Minister of ' +
            'Tourism under Widodo. Coverage shifted to support government agenda.',
          administration: 'Joko Widodo',
        },
        {
          period: '2024-present',
          stance: 'Pro-Prabowo coalition, deepening political integration',
          details:
            'Angela Tanoesoedibjo succeeded her father as Perindo leader in 2024 and continues ' +
            'as Vice-Minister of Tourism under Prabowo. MNC media platforms continue to serve ' +
            'as political infrastructure for Tanoesoedibjo family interests.',
          administration: 'Prabowo Subianto',
        },
      ],
      editorialStances: [
        {
          topic: 'Perindo party promotion',
          stance: 'Aggressive, blurring line between news and political advertising',
          examples: [
            'Perindo party jingle aired on RCTI and MNC TV during commercial breaks',
            'iNews TV provided extensive free coverage of Perindo party events',
            'Okezone and Sindonews front-page coverage of Perindo activities',
          ],
        },
        {
          topic: 'Government policy (when in coalition)',
          stance: 'Supportive, emphasizing coalition contributions',
          examples: [
            'Favorable coverage of tourism ministry under Angela Tanoesoedibjo',
            'Promotion of government programs connected to Tanoesoedibjo family interests',
          ],
        },
        {
          topic: 'Business and entertainment',
          stance: 'Entertainment-heavy, commercially driven',
          examples: [
            'RCTI and MNC TV programming dominated by entertainment content',
            'News programs emphasize spectacle and human interest over policy depth',
          ],
        },
      ],
      audienceDemographics: {
        estimatedMonthlyReach:
          '100+ million (combined TV + digital: RCTI, MNC TV, GTV, iNews, Okezone, Sindonews)',
        primaryDemographic: 'Mass market TV audience, all demographics, 15-65 years old',
        geographicFocus: 'National free-to-air TV coverage — broadest reach in Indonesia',
        platformBreakdown: {
          tv: '55% (RCTI, MNC TV, GTV, iNews)',
          web: '25% (Okezone, Sindonews, iNews.id)',
          mobile: '15%',
          social: '5%',
        },
      },
      reliabilityRecord: [
        {
          incident:
            'KPI (Broadcasting Commission) reprimands for Perindo campaign content on news channels',
          date: '2016-2018',
          impact: 'Confirmed perception of MNC as political vehicle rather than news organization',
          outcome: 'Minimal compliance; pattern continued in reduced form',
        },
        {
          incident: 'Editorial independence questioned after Tanoesoedibjo political ambitions',
          date: '2014-present',
          impact:
            'Journalists and media observers widely regard MNC platforms as politically compromised',
          outcome: 'Some senior journalists departed; editorial culture became compliance-oriented',
        },
      ],
      biasExamples: [
        {
          topic: 'Perindo party campaigning via news platforms',
          expectedCoverage: 'Independent political coverage with equal treatment of parties',
          actualCoverage:
            'MNC TV channels aired Perindo party jingle and promotional content disguised as ' +
            'programming. iNews provided disproportionate coverage of Perindo events. Okezone ' +
            'and Sindonews front-paged Perindo activities while marginalizing competitor parties.',
          analysis:
            "The most egregious example of media-political fusion in Indonesia. MNC Group's " +
            'free-to-air TV dominance means millions of Indonesians receive Perindo propaganda ' +
            'through what appears to be news programming.',
          date: '2015-present',
        },
        {
          topic: 'Tourism ministry coverage',
          expectedCoverage: 'Balanced reporting on tourism policy including challenges',
          actualCoverage:
            'Overwhelmingly positive coverage of tourism ministry under Angela Tanoesoedibjo',
          analysis:
            'Direct conflict of interest: MNC platforms promote the government ministry led ' +
            "by the owner's daughter.",
          date: '2019-present',
        },
      ],
      pressFreedomIncidents: [
        {
          date: '2017',
          description:
            'MNC Group reportedly pressured journalists to provide favorable coverage of ' +
            'Tanoesoedibjo and Perindo party activities.',
          outcome: 'Several journalists resigned citing editorial interference.',
        },
      ],
      foundingContext:
        'MNC Group was consolidated by Hary Tanoesoedibjo in the early 2000s through acquisitions ' +
        "of RCTI (Indonesia's first private TV station), MNC TV, and GTV, creating Indonesia's " +
        'largest media conglomerate by TV audience share. The group expanded into digital media with ' +
        "Okezone (2007), Sindonews, and iNews.id. Tanoesoedibjo's founding of the Perindo party in " +
        '2015 made the political function of the media empire explicit.',
      keyMilestones: [
        { year: '2002', event: 'Tanoesoedibjo took control of MNC Group through Bhakti Investama' },
        { year: '2007', event: 'Launched Okezone.com as digital news portal' },
        { year: '2014', event: 'Tanoesoedibjo ran as VP candidate on Hanura party ticket' },
        { year: '2015', event: 'Founded Perindo party; MNC platforms became party vehicle' },
        { year: '2019', event: 'Angela Tanoesoedibjo appointed Vice-Minister of Tourism' },
        {
          year: '2024',
          event: 'Angela succeeded as Perindo leader; continues as Vice-Minister under Prabowo',
        },
      ],
    },
  },

  // ──────────────────────────────────────────────────────────
  // 13. EMTEK GROUP (NEW)
  // ──────────────────────────────────────────────────────────
  {
    id: 'emtek-group',
    name: 'EMTEK Media',
    country: 'ID',
    languages: ['id'],
    url: 'https://www.liputan6.com',
    feedUrls: ['https://www.liputan6.com/rss', 'https://www.merdeka.com/rss'],
    politicalLeaning: 'centrist',
    ownership: {
      owner: 'Eddy Sariaatmadja family',
      conglomerate: 'PT Elang Mahkota Teknologi Tbk (EMTEK)',
      politicalAffiliation: undefined,
      notes:
        "Indonesia's second-largest media group. Controls SCTV, Indosiar, O Channel, " +
        'Liputan6.com, Merdeka.com, and KapanLagi network. Eddy Sariaatmadja family ' +
        'ownership. Currently no clear political party affiliation, making EMTEK ' +
        'relatively more editorially independent among major Indonesian media groups.',
    },
    editorialGoal: 'Mass market entertainment and news, commercially driven, politically moderate',
    reliabilityScore: 0.6,
    audienceTypes: ['urban-middle', 'rural-mass', 'youth-digital'],
    biasDirection: 'neutral',
    signalWeight: 0.7,
    active: true,
    extendedProfile: {
      ownershipChain: [
        { entity: 'PT Surya Citra Media Tbk (SCM)', role: 'direct-owner', stake: '100%' },
        { entity: 'PT Elang Mahkota Teknologi Tbk (EMTEK)', role: 'parent-company', since: '2008' },
        { entity: 'Eddy Sariaatmadja family', role: 'ultimate-beneficiary', since: '2008' },
      ],
      politicalHistory: [
        {
          period: '2008-2014',
          stance: 'Commercially focused, politically neutral',
          details:
            'EMTEK acquired SCTV in 2008 and Indosiar in 2011, building a major media group. ' +
            'The Sariaatmadja family focused on commercial media operations without explicit ' +
            'political party involvement.',
          administration: 'Yudhoyono',
        },
        {
          period: '2014-present',
          stance: 'Relatively independent among major media groups',
          details:
            'Unlike MNC (Tanoesoedibjo/Perindo), Bakrie Group (Golkar), Media Group (NasDem), ' +
            'or CT Corp (government-aligned), EMTEK has maintained relative editorial independence ' +
            "due to the Sariaatmadja family's lack of formal political party affiliation. " +
            'This makes EMTEK outlets useful as a reference point for less politically influenced ' +
            'mainstream media coverage.',
          administration: 'Widodo / Prabowo',
        },
      ],
      editorialStances: [
        {
          topic: 'Political coverage',
          stance: 'Mainstream centrist, less politically motivated than peers',
          examples: [
            'Liputan6.com provides balanced political coverage relative to oligarch-owned competitors',
            'SCTV news programs maintain moderate tone',
          ],
        },
        {
          topic: 'Entertainment and lifestyle',
          stance: 'Heavily entertainment-driven, commercially motivated',
          examples: [
            'SCTV and Indosiar programming dominated by drama, variety, and entertainment',
            'KapanLagi network focused on celebrity and pop culture',
          ],
        },
      ],
      audienceDemographics: {
        estimatedMonthlyReach:
          '80+ million (combined TV + digital: SCTV, Indosiar, Liputan6, Merdeka)',
        primaryDemographic: 'Mass market TV and digital audience, 15-55 years old',
        geographicFocus: 'National free-to-air TV coverage; digital platforms reach urban areas',
        platformBreakdown: {
          tv: '50% (SCTV, Indosiar, O Channel)',
          web: '30% (Liputan6, Merdeka, KapanLagi)',
          mobile: '15%',
          social: '5%',
        },
      },
      reliabilityRecord: [
        {
          incident:
            'Liputan6.com maintains reasonable journalistic standards for mass-market digital',
          date: 'Ongoing',
          impact: 'Moderate credibility — better than clickbait outlets, below investigative media',
          outcome: 'Consistent middle-tier positioning in Indonesian media credibility rankings',
        },
      ],
      biasExamples: [
        {
          topic: 'EMTEK business interests',
          expectedCoverage:
            'Critical coverage of media consolidation and digital platform regulation',
          actualCoverage:
            'Limited coverage of issues directly affecting EMTEK business operations, including ' +
            'digital advertising regulation and TV broadcasting policy.',
          analysis:
            'Standard owner-interest blind spot, but less politically motivated than peers. ' +
            'The absence of a political party affiliation means bias is primarily commercial ' +
            'rather than political.',
        },
      ],
      foundingContext:
        'EMTEK (PT Elang Mahkota Teknologi) was established as a technology company by the ' +
        'Sariaatmadja family. Entered the media sector through the acquisition of SCTV in 2008 ' +
        "and Indosiar in 2011, creating Indonesia's second-largest media group by TV audience. " +
        'Expanded into digital media through Liputan6.com, Merdeka.com, and the KapanLagi ' +
        "entertainment network. The family's lack of direct political party involvement makes " +
        "EMTEK a relative outlier among Indonesia's major media conglomerates.",
      keyMilestones: [
        { year: '2008', event: 'Acquired SCTV, entering the broadcasting sector' },
        { year: '2011', event: 'Acquired Indosiar; became second-largest TV group' },
        { year: '2014', event: 'Expanded digital portfolio with Liputan6.com and Merdeka.com' },
        { year: '2017', event: 'Launched Vidio.com streaming platform' },
        { year: '2021', event: 'Further digital expansion and tech investments' },
      ],
    },
  },

  // ──────────────────────────────────────────────────────────
  // 14. BERITA SATU / LIPPO GROUP (NEW)
  // ──────────────────────────────────────────────────────────
  {
    id: 'berita-satu',
    name: 'Berita Satu',
    country: 'ID',
    languages: ['id'],
    url: 'https://www.beritasatu.com',
    feedUrls: ['https://www.beritasatu.com/rss'],
    politicalLeaning: 'oligarch-owned',
    ownership: {
      owner: 'James Riady',
      conglomerate: 'Lippo Group / BeritaSatu Media Holdings',
      politicalAffiliation:
        'Business-aligned, pro-investment, historically connected to multiple political figures',
      notes:
        'Part of the Lippo Group empire (James Riady). Controls BeritaSatu TV, Suara Pembaruan ' +
        'daily newspaper, and Investor Daily. Riady family has extensive US political connections ' +
        '(1996 DNC fundraising controversy). Lippo Group has interests in property, healthcare, ' +
        'retail, and media.',
    },
    editorialGoal: 'Business-focused news, pro-investment, elite audience targeting',
    reliabilityScore: 0.6,
    audienceTypes: ['elite-policy', 'urban-middle'],
    biasDirection: 'pro-government',
    signalWeight: 0.6,
    active: true,
    extendedProfile: {
      ownershipChain: [
        { entity: 'PT BeritaSatu Media Holdings', role: 'direct-owner', stake: '100%' },
        { entity: 'Lippo Group', role: 'parent-company', since: '2009' },
        { entity: 'James Riady / Riady family', role: 'ultimate-beneficiary', since: '2009' },
      ],
      politicalHistory: [
        {
          period: '2009-2014',
          stance: 'Business-friendly, pro-investment',
          details:
            'Launched by Lippo Group as a business-focused news platform. Positioned to serve ' +
            "the investor and business community. Editorial line aligned with Lippo Group's " +
            'pro-business, pro-investment orientation.',
          administration: 'Yudhoyono',
        },
        {
          period: '2014-2024',
          stance: 'Pro-Widodo, pro-investment continuity',
          details:
            "Generally supportive of Widodo's infrastructure and investment agenda, which " +
            "aligned with Lippo Group's property and development interests. Coverage favored " +
            'economic liberalization and foreign investment.',
          administration: 'Joko Widodo',
        },
        {
          period: '2024-present',
          stance: 'Business-aligned, pro-government on economic policy',
          details:
            'Continuing pro-investment editorial line under Prabowo administration, ' +
            "consistent with Lippo Group's business interests.",
          administration: 'Prabowo Subianto',
        },
      ],
      editorialStances: [
        {
          topic: 'Economic policy and investment',
          stance: 'Strongly pro-business, pro-foreign investment',
          examples: [
            'Favorable coverage of investment deregulation',
            'Investor Daily focused on capital markets and business development',
          ],
        },
        {
          topic: 'Property and development',
          stance: 'Pro-development, aligned with Lippo property interests',
          examples: [
            'Positive framing of property development projects',
            'Limited critical coverage of property sector controversies',
          ],
        },
      ],
      audienceDemographics: {
        estimatedMonthlyReach: '3-5 million unique visitors (web + TV)',
        primaryDemographic: 'Business professionals, investors, policy elite, 30-60 years old',
        geographicFocus: 'Jakarta and major business centers',
        platformBreakdown: {
          tv: '25% (BeritaSatu TV)',
          web: '45%',
          print: '15% (Suara Pembaruan, Investor Daily)',
          mobile: '10%',
          social: '5%',
        },
      },
      reliabilityRecord: [
        {
          incident: 'Lippo Group corruption case coverage gaps',
          date: '2018-2019',
          impact:
            "When Lippo Group's Meikarta project faced corruption allegations, coverage on " +
            'BeritaSatu platforms was minimal compared to other outlets.',
          outcome: 'Reinforced perception of owner-protective editorial stance',
        },
      ],
      biasExamples: [
        {
          topic: 'Lippo Group Meikarta scandal',
          expectedCoverage:
            "Thorough investigation of corruption allegations in Lippo Group's flagship " +
            'Meikarta property development project.',
          actualCoverage:
            'Minimal coverage on BeritaSatu platforms; stories downplayed severity and ' +
            "emphasized Lippo Group's cooperation with authorities.",
          analysis:
            'Clear owner-protection bias during a period when other outlets extensively covered ' +
            'the Meikarta corruption case, which resulted in arrests and significant legal proceedings.',
          date: '2018-2019',
        },
      ],
      foundingContext:
        'BeritaSatu Media Holdings was established by the Lippo Group (James Riady) around 2009, ' +
        "consolidating the group's media properties including the Suara Pembaruan daily newspaper " +
        '(founded 1987) and Investor Daily. BeritaSatu TV was launched as a business-focused news ' +
        'channel. The Riady family has extensive international connections, including the 1996 DNC ' +
        "fundraising controversy in the United States, which shaped the family's reputation for " +
        'political influence operations.',
      keyMilestones: [
        { year: '1987', event: 'Suara Pembaruan newspaper founded (later acquired by Lippo)' },
        { year: '2009', event: 'BeritaSatu Media Holdings consolidated under Lippo Group' },
        { year: '2011', event: 'BeritaSatu TV launched as business news channel' },
        {
          year: '2018',
          event: 'Lippo Group Meikarta corruption case tested editorial independence',
        },
      ],
    },
  },

  // ──────────────────────────────────────────────────────────
  // 15. TIRTO.ID (NEW)
  // ──────────────────────────────────────────────────────────
  {
    id: 'tirto',
    name: 'Tirto.id',
    country: 'ID',
    languages: ['id'],
    url: 'https://tirto.id',
    feedUrls: ['https://tirto.id/rss'],
    politicalLeaning: 'independent',
    ownership: {
      owner: 'PT Tirto Kembar Oleh',
      conglomerate: undefined,
      politicalAffiliation: undefined,
      notes:
        'Founded 2016 by Sapto Anggoro, Teguh Budi Santoso, and Nur Samsi. Known for ' +
        'data-driven, long-form journalism and rigorous fact-checking. Since early 2021, ' +
        'original founders are no longer majority shareholders; ownership changes have ' +
        'reduced transparency about ultimate beneficial ownership.',
    },
    editorialGoal: 'Data-driven, fact-based long-form journalism, independent',
    reliabilityScore: 0.8,
    audienceTypes: ['youth-digital', 'urban-middle', 'elite-policy'],
    biasDirection: 'neutral',
    signalWeight: 0.95,
    active: true,
    extendedProfile: {
      ownershipChain: [
        { entity: 'PT Tirto Kembar Oleh', role: 'direct-owner', stake: '100%' },
        {
          entity: 'Unknown new majority shareholders (post-2021)',
          role: 'ultimate-beneficiary',
          since: '2021',
        },
      ],
      politicalHistory: [
        {
          period: '2016-2021',
          stance: 'Fiercely independent, data-driven',
          details:
            'Founded by Sapto Anggoro, Teguh Budi Santoso, and Nur Samsi as a reaction to ' +
            'the shallow, clickbait-dominated Indonesian digital media landscape. Established ' +
            'a reputation for data-driven long-form journalism, infographics, and rigorous ' +
            'fact-checking. Equal-opportunity criticism of all political factions.',
          administration: 'Joko Widodo',
        },
        {
          period: '2021-present',
          stance: 'Maintaining editorial standards despite ownership changes',
          details:
            'Since early 2021, the original founders are no longer majority shareholders. ' +
            'New ownership structure has reduced transparency. However, the editorial team ' +
            "has largely maintained the fact-driven, independent approach that built Tirto's " +
            'reputation. Monitoring for potential editorial drift is warranted.',
          administration: 'Joko Widodo / Prabowo Subianto',
        },
      ],
      editorialStances: [
        {
          topic: 'Data literacy and fact-checking',
          stance: 'Strongly committed to evidence-based reporting',
          examples: [
            'Regular "Periksa Fakta" (fact-check) series debunking viral misinformation',
            'Data-rich infographics accompanying major news stories',
            'Open methodology in data journalism pieces',
          ],
        },
        {
          topic: 'Government policy',
          stance: 'Analytical and data-based, neither reflexively supportive nor oppositional',
          examples: [
            'COVID-19 coverage using independent data analysis alongside government figures',
            'Economic policy analysis using comparative international data',
          ],
        },
        {
          topic: 'Historical and cultural context',
          stance: 'Strong emphasis on historical context for current events',
          examples: [
            '"Mild Report" series providing historical context for current issues',
            'Long-form pieces connecting contemporary politics to historical patterns',
          ],
        },
      ],
      audienceDemographics: {
        estimatedMonthlyReach: '8-12 million unique visitors (web)',
        primaryDemographic: 'Educated urban millennials and Gen Z, 20-40 years old, data-literate',
        geographicFocus: 'Major cities, digitally connected audience',
        platformBreakdown: {
          web: '45%',
          mobile: '30%',
          social: '25%',
        },
      },
      reliabilityRecord: [
        {
          incident: 'Built strong fact-checking reputation through consistent methodology',
          date: '2016-present',
          impact: 'High credibility among educated, digitally literate Indonesians',
          outcome: "Recognized as one of Indonesia's most reliable digital-native outlets",
        },
        {
          incident: 'Ownership transparency concerns after founder departure',
          date: '2021',
          impact: 'Questions about potential future editorial influence by new shareholders',
          outcome: 'Editorial quality has been maintained so far; situation bears monitoring',
        },
      ],
      biasExamples: [
        {
          topic: 'Post-ownership-change coverage patterns',
          expectedCoverage: 'Same level of fearless investigative coverage across all topics',
          actualCoverage:
            'Overall high quality maintained, but some observers note reduced frequency of ' +
            'certain politically sensitive investigations since the ownership change.',
          analysis:
            'Potential early signs of editorial caution post-ownership change, though the ' +
            'shift is subtle and may also reflect broader Indonesian press freedom trends.',
          date: '2021-present',
        },
      ],
      awards: [
        { name: 'Verified signatory of International Fact-Checking Network (IFCN)', year: '2018' },
        {
          name: 'Society of Publishers in Asia (SOPA) Award',
          year: '2019',
          category: 'Information graphics',
        },
      ],
      foundingContext:
        'Founded in 2016 by Sapto Anggoro, Teguh Budi Santoso, and Nur Samsi as a ' +
        "deliberate counter to Indonesia's clickbait-driven digital media environment. " +
        'The name "Tirto" pays homage to Tirto Adhi Soerjo, considered the father of ' +
        'Indonesian journalism. Established a distinctive identity through data-driven ' +
        'long-form reporting, infographics, and a rigorous fact-checking operation. ' +
        'Since early 2021, the original founders are no longer majority shareholders, ' +
        'raising questions about the long-term sustainability of editorial independence.',
      keyMilestones: [
        { year: '2016', event: 'Founded by Sapto Anggoro, Teguh Budi Santoso, and Nur Samsi' },
        { year: '2017', event: 'Launched "Periksa Fakta" fact-checking vertical' },
        { year: '2018', event: 'Became IFCN-verified fact-checking signatory' },
        { year: '2019', event: 'Won SOPA Award for information graphics' },
        { year: '2021', event: 'Original founders lost majority shareholding; ownership change' },
      ],
    },
  },

  // ──────────────────────────────────────────────────────────
  // 16. NARASI TV (NEW)
  // ──────────────────────────────────────────────────────────
  {
    id: 'narasi-tv',
    name: 'Narasi TV',
    country: 'ID',
    languages: ['id'],
    url: 'https://narasi.tv',
    feedUrls: ['https://narasi.tv/rss'],
    politicalLeaning: 'independent',
    ownership: {
      owner: 'PT Narasi Citra Sahwahita',
      conglomerate: undefined,
      politicalAffiliation: undefined,
      notes:
        "Founded 2018 by Najwa Shihab, one of Indonesia's most prominent journalists. " +
        'Digital-first with YouTube-heavy distribution model. Editorially independent with ' +
        'strong journalist-founder identity. In 2022, suffered a major cyberattack targeting ' +
        'social media accounts while reporting on a two-star general murder case.',
    },
    editorialGoal: 'Independent digital journalism, narrative-driven, accountability-focused',
    reliabilityScore: 0.8,
    audienceTypes: ['youth-digital', 'urban-middle', 'elite-policy'],
    biasDirection: 'neutral',
    signalWeight: 0.95,
    active: true,
    extendedProfile: {
      ownershipChain: [
        { entity: 'PT Narasi Citra Sahwahita', role: 'direct-owner', stake: '100%' },
        { entity: 'Najwa Shihab (founder)', role: 'ultimate-beneficiary', since: '2018' },
      ],
      politicalHistory: [
        {
          period: '2018-present',
          stance: 'Independent, journalist-founder driven',
          details:
            'Founded by Najwa Shihab after her departure from Metro TV. Positioned as a ' +
            'digital-first, independent media platform not beholden to political or business ' +
            "conglomerate interests. Najwa's personal brand as a tough, independent interviewer " +
            'anchors the editorial identity. Has maintained independence through digital-first ' +
            'revenue model (YouTube, sponsorships, events) rather than traditional media ownership.',
          administration: 'Joko Widodo / Prabowo Subianto',
        },
      ],
      editorialStances: [
        {
          topic: 'Government accountability',
          stance: 'Strong watchdog orientation',
          examples: [
            'Najwa Shihab\'s "Mata Najwa" interview program directly challenging politicians',
            'Investigative series on corruption and governance failures',
            'Coverage of democratic backsliding concerns during Widodo era',
          ],
        },
        {
          topic: 'Youth engagement and civic participation',
          stance: 'Proactively encourages young Indonesian civic engagement',
          examples: [
            'Catatan Najwa events combining journalism with civic education',
            'Digital-native content formats designed to make politics accessible to youth',
          ],
        },
        {
          topic: 'Press freedom and journalist safety',
          stance: 'Strong advocacy, especially after 2022 cyberattack',
          examples: [
            'Public statements defending press freedom after cyberattack',
            'Coverage of journalist intimidation across Indonesia',
          ],
        },
      ],
      audienceDemographics: {
        estimatedMonthlyReach:
          '10-20 million (YouTube + digital: Narasi YouTube channels have millions of subscribers)',
        primaryDemographic: 'Digitally active Indonesians, 18-40 years old, politically engaged',
        geographicFocus: 'National digital audience; strong YouTube and social media presence',
        platformBreakdown: {
          youtube: '50%',
          web: '20%',
          social: '25%',
          mobile: '5%',
        },
      },
      reliabilityRecord: [
        {
          incident: "Built strong credibility through Najwa Shihab's journalistic reputation",
          date: '2018-present',
          impact: 'High trust among digitally engaged, younger Indonesians',
          outcome: "Established as a credible independent voice in Indonesia's digital media space",
        },
        {
          incident: 'Maintained editorial standards under cyberattack pressure',
          date: '2022',
          impact: 'Demonstrated commitment to reporting despite intimidation',
          outcome: 'Continued coverage; security strengthened',
        },
      ],
      biasExamples: [
        {
          topic: 'Political coverage tone',
          expectedCoverage: 'Equal scrutiny of all political figures',
          actualCoverage:
            "While generally balanced, Narasi's accountability-focused editorial stance " +
            'means coverage skews toward challenging whoever holds power. This creates a ' +
            'structural tilt toward critical coverage of the ruling government.',
          analysis:
            'Similar to Tempo, the watchdog orientation creates an inherent anti-incumbent ' +
            'bias. However, this is a function of editorial mission rather than political ' +
            'affiliation. Narasi applies the same scrutiny regardless of which party governs.',
        },
      ],
      pressFreedomIncidents: [
        {
          date: '2022-09',
          description:
            'Narasi TV social media accounts were targeted by a major coordinated cyberattack ' +
            'while the outlet was reporting on the murder case involving a two-star general. ' +
            'Multiple accounts were hacked simultaneously in what appeared to be an organized ' +
            'attempt to silence reporting.',
          outcome:
            'Narasi recovered accounts and continued reporting. The incident drew international ' +
            'attention and condemnation from press freedom organizations.',
        },
      ],
      awards: [
        { name: 'Human Rights Press Award', year: '2020', category: 'Digital media' },
        {
          name: 'Society of Publishers in Asia (SOPA) Award',
          year: '2021',
          category: 'Excellence in reporting',
        },
      ],
      foundingContext:
        "Founded in 2018 by Najwa Shihab, one of Indonesia's most recognized and trusted " +
        'journalists. After years as the face of "Mata Najwa" on Metro TV, Shihab left to ' +
        'create a digital-first media platform independent of the oligarch-owned media ' +
        "conglomerate ecosystem. Narasi's YouTube-heavy distribution model allows it to reach " +
        'large audiences without traditional TV broadcasting licenses controlled by conglomerates. ' +
        'Represents a new model for independent Indonesian journalism.',
      keyMilestones: [
        { year: '2018', event: 'Founded by Najwa Shihab as digital-first media platform' },
        { year: '2019', event: 'Launched "Catatan Najwa" civic engagement events nationwide' },
        { year: '2020', event: 'YouTube subscriber base surpassed 10 million' },
        {
          year: '2022',
          event: 'Suffered major cyberattack while reporting on two-star general murder case',
        },
        { year: '2023', event: 'Expanded investigative reporting team' },
      ],
    },
  },

  // ──────────────────────────────────────────────────────────
  // 17. IDN TIMES
  // ──────────────────────────────────────────────────────────
  {
    id: 'idn-times',
    name: 'IDN Times',
    country: 'ID',
    languages: ['id', 'en'],
    url: 'https://www.idntimes.com',
    feedUrls: ['https://www.idntimes.com/rss', 'https://www.idntimes.com/news/indonesia/rss'],
    politicalLeaning: 'centrist',
    ownership: {
      owner: 'PT Media Jejaring Semesta',
      conglomerate: 'IDN Media',
      politicalAffiliation: undefined,
      notes:
        "Founded in 2014 by Winston Utomo and William Utomo. One of Indonesia's largest " +
        'millennial and Gen-Z focused digital media platforms. IDN Media is the parent company ' +
        'that also operates other youth-oriented verticals including Popbela, Duniaku, and Popmama. ' +
        'Venture capital-backed with investments from EV Growth and others. No direct political ' +
        'affiliation, though lifestyle-heavy content sometimes dilutes journalistic rigour.',
    },
    editorialGoal:
      'Accessible news and lifestyle content for Indonesian youth, community-driven engagement',
    reliabilityScore: 0.55,
    audienceTypes: ['youth-digital', 'urban-middle'],
    biasDirection: 'neutral',
    signalWeight: 0.5,
    active: true,
    extendedProfile: {
      ownershipChain: [
        { entity: 'PT Media Jejaringku Semesta', role: 'direct-owner', stake: '100%' },
        { entity: 'IDN Media', role: 'parent-company', since: '2014' },
        {
          entity: 'Winston Utomo & William Utomo (co-founders)',
          role: 'ultimate-beneficiary',
          since: '2014',
        },
        {
          entity: 'EV Growth, Kejora Capital (investors)',
          role: 'minority-shareholder',
          since: '2017',
        },
      ],
      politicalHistory: [
        {
          period: '2014-2019',
          stance: 'Apolitical, lifestyle and entertainment focus',
          details:
            'Launched primarily as a youth-focused content platform blending news with ' +
            'entertainment, lifestyle, and community-generated content. Political coverage was ' +
            "minimal and largely neutral, reflecting the audience's primary interest in " +
            'non-political content.',
          administration: 'Joko Widodo (first term)',
        },
        {
          period: '2019-present',
          stance: 'Centrist with progressive social leanings',
          details:
            'Gradually expanded news coverage including politics, social issues, and economics. ' +
            'Editorial stance on social issues tends slightly progressive — supporting gender ' +
            'equality, mental health awareness, and environmental topics that resonate with younger ' +
            'audiences. Political coverage remains broadly centrist without strong partisan alignment.',
          administration: 'Joko Widodo (second term) / Prabowo Subianto',
        },
      ],
      editorialStances: [
        {
          topic: 'Social issues and youth advocacy',
          stance: 'Slightly progressive, youth-empowerment oriented',
          examples: [
            'Regular coverage of mental health, gender equality, and LGBTQ+ issues (relatively rare in Indonesian media)',
            'Series on financial literacy and career development for young Indonesians',
            'Climate change and environmental sustainability content',
          ],
        },
        {
          topic: 'Political coverage',
          stance: 'Centrist, accessible, non-confrontational',
          examples: [
            'Election coverage focused on explainers and youth voter engagement',
            'Avoids deep investigative or adversarial political reporting',
            'Tends toward "both sides" framing on politically sensitive topics',
          ],
        },
      ],
      audienceDemographics: {
        estimatedMonthlyReach:
          "40-60 million unique visitors (one of Indonesia's top 5 most-visited news/content sites)",
        primaryDemographic: 'Indonesian millennials and Gen-Z, aged 18-35, digitally native',
        geographicFocus: 'National with strong urban concentration, especially Java',
        platformBreakdown: {
          web: '40%',
          mobile: '35%',
          social: '20%',
          youtube: '5%',
        },
      },
      reliabilityRecord: [
        {
          incident:
            'Community-contributed content (IDN Times Community) blurs editorial vs user-generated boundaries',
          date: '2018-present',
          impact: 'Variable quality; user-generated content sometimes lacks editorial standards',
          outcome: 'Added clearer labelling to distinguish editorial vs community content',
        },
        {
          incident: 'Clickbait-style headlines on lifestyle and entertainment verticals',
          date: 'Ongoing',
          impact: 'Reduces overall perceived reliability despite decent news vertical quality',
          outcome: 'News vertical maintains higher standards than lifestyle/entertainment sections',
        },
      ],
      biasExamples: [
        {
          topic: 'Government policy coverage',
          expectedCoverage: 'Balanced assessment of policy impacts on youth',
          actualCoverage:
            'Coverage is generally balanced but shallow on political analysis. Tends to avoid ' +
            'confrontational reporting that might alienate advertisers or platform partners. ' +
            'Progressive lean on social issues is notable for Indonesian media landscape.',
          analysis:
            'The slight progressive lean on social issues is more a reflection of its young ' +
            "audience's values than a deliberate editorial agenda. Political coverage is too " +
            'surface-level to exhibit strong partisan bias.',
        },
      ],
      pressFreedomIncidents: [],
      awards: [{ name: 'Google News Initiative Innovation Challenge Award', year: '2019' }],
      foundingContext:
        'Founded in 2014 by Winston Utomo (CEO) and William Utomo as a digital media ' +
        'platform targeting Indonesian millennials and Gen-Z. Built on the insight that ' +
        'traditional Indonesian media was not speaking to younger audiences in formats and ' +
        'on platforms they preferred. Grew rapidly through community-driven content, social ' +
        'media distribution, and multiple verticals covering news, lifestyle, entertainment, ' +
        'gaming, and parenting. IDN Media as a parent company has positioned itself as ' +
        "Indonesia's leading millennial/Gen-Z media group with over 70 million monthly users.",
      keyMilestones: [
        { year: '2014', event: 'Founded by Winston Utomo and William Utomo' },
        { year: '2017', event: 'Secured Series A funding from EV Growth' },
        { year: '2018', event: 'Launched IDN Times Community user-generated content platform' },
        { year: '2019', event: 'Expanded to multiple verticals (Popbela, Duniaku, Popmama)' },
        { year: '2021', event: 'Surpassed 60 million monthly unique visitors' },
        { year: '2023', event: 'Expanded English-language content and regional coverage' },
      ],
    },
  },

  // ──────────────────────────────────────────────────────────
  // 18. RMOL (RAKYAT MERDEKA ONLINE)
  // ──────────────────────────────────────────────────────────
  {
    id: 'rmol',
    name: 'RMOL (Rakyat Merdeka Online)',
    country: 'ID',
    languages: ['id'],
    url: 'https://rmol.id',
    feedUrls: ['https://rmol.id/rss'],
    politicalLeaning: 'opposition',
    ownership: {
      owner: 'PT Rakyat Merdeka Intermedia',
      conglomerate: undefined,
      politicalAffiliation:
        'Opposition-linked; historically associated with elite political figures critical of incumbent governments',
      notes:
        'Connected to the Rakyat Merdeka newspaper tradition, which was known for its ' +
        'sensationalist, opposition-leaning tabloid style. RMOL serves as a digital platform ' +
        'for opposition narratives and commentary, frequently featuring opinion pieces from ' +
        'political figures and analysts critical of the ruling government. Has historically ' +
        'been associated with political circles around figures like Rizal Ramli and other ' +
        'opposition-aligned commentators.',
    },
    editorialGoal:
      'Opposition-oriented news and political commentary, amplifying critical voices against incumbent power',
    reliabilityScore: 0.45,
    audienceTypes: ['elite-policy', 'urban-middle'],
    biasDirection: 'anti-government',
    signalWeight: 0.4,
    active: true,
    extendedProfile: {
      ownershipChain: [
        { entity: 'PT Rakyat Merdeka Intermedia', role: 'direct-owner', stake: '100%' },
        {
          entity: 'Rakyat Merdeka Group',
          role: 'parent-company',
          since: '2000',
        },
      ],
      politicalHistory: [
        {
          period: '2000-2014',
          stance: 'Populist opposition voice',
          details:
            'Rakyat Merdeka newspaper established its identity during the post-Suharto era as a ' +
            'provocative, often sensationalist tabloid willing to challenge whoever was in power. ' +
            'RMOL emerged as the digital extension of this tradition. Known for inflammatory ' +
            'headlines and strong opinion content critical of successive governments from ' +
            'Megawati through Yudhoyono.',
          administration: 'Megawati / Susilo Bambang Yudhoyono',
        },
        {
          period: '2014-2024',
          stance: 'Anti-Jokowi opposition platform',
          details:
            "Under Jokowi's presidency, RMOL became a prominent platform for opposition voices, " +
            'frequently featuring commentary from political figures and analysts critical of ' +
            "Widodo's policies. Provided a platform for Prabowo-aligned voices during the " +
            '2014 and 2019 election cycles. Content heavily opinion-driven with selective ' +
            'news framing to support opposition narratives.',
          administration: 'Joko Widodo',
        },
        {
          period: '2024-present',
          stance: 'Adapting to new political configuration',
          details:
            "With Prabowo Subianto becoming president, RMOL's positioning is in flux. " +
            'Historically critical of incumbent governments regardless of party, though its ' +
            'network of commentators had closer ties to certain opposition figures. May shift ' +
            'to criticizing or cautiously supporting the new administration depending on ' +
            'factional alignments.',
          administration: 'Prabowo Subianto',
        },
      ],
      editorialStances: [
        {
          topic: 'Government accountability',
          stance: 'Aggressively critical of incumbent government',
          examples: [
            'Frequent op-eds framing government policies as failures',
            "Amplifying opposition politicians' press conferences and statements",
            "Critical coverage of Jokowi's dynasty politics and constitutional court controversy",
          ],
        },
        {
          topic: 'Economic policy',
          stance:
            'Populist-nationalist, critical of perceived neoliberal or foreign-favoring policies',
          examples: [
            'Opposition to foreign investment deals framed as "selling national assets"',
            "Criticism of infrastructure spending as prioritizing optics over people's welfare",
          ],
        },
        {
          topic: 'Democratic governance',
          stance: 'Selectively pro-democracy when it serves opposition narrative',
          examples: [
            'Strong coverage of democratic backsliding concerns — but primarily when it affects opposition',
            'Less concerned with press freedom or democratic norms when opposition allies are in question',
          ],
        },
      ],
      audienceDemographics: {
        estimatedMonthlyReach: '3-8 million unique visitors',
        primaryDemographic:
          'Politically engaged Indonesians sympathetic to opposition; older demographic skew',
        geographicFocus: 'National, Jakarta-centric political audience',
        platformBreakdown: {
          web: '60%',
          social: '25%',
          mobile: '10%',
          youtube: '5%',
        },
      },
      reliabilityRecord: [
        {
          incident: 'Frequent mixing of opinion and news content without clear labelling',
          date: 'Ongoing',
          impact:
            'Readers often cannot distinguish between editorial opinion and factual reporting',
          outcome: 'Contributes to lower reliability score; content requires cross-referencing',
        },
        {
          incident: 'Sensationalist headlines and framing',
          date: 'Ongoing',
          impact: 'Headlines frequently exaggerate or misrepresent the nuance of stories',
          outcome:
            'Useful as a signal of opposition sentiment but unreliable as a primary news source',
        },
        {
          incident: 'Platform for unverified political claims',
          date: 'Periodic',
          impact:
            'Op-eds and "analysis" pieces sometimes contain unverified allegations presented as fact',
          outcome:
            'Content should be weighted as opinion/political signal rather than factual reporting',
        },
      ],
      biasExamples: [
        {
          topic: 'Jokowi administration coverage',
          expectedCoverage: 'Balanced assessment of policy successes and failures',
          actualCoverage:
            'Overwhelmingly negative framing of Jokowi-era policies. Positive developments ' +
            'were minimized or reframed as insufficient, while failures were amplified. ' +
            'Opposition figures and critics given outsized platform compared to government ' +
            'voices.',
          analysis:
            'RMOL functions more as an opposition political platform than a traditional news ' +
            'outlet. Its value to LOOM is as a signal source for opposition sentiment and ' +
            'narratives, not as a reliable factual source. The anti-government bias is ' +
            'structural and consistent regardless of which party governs.',
        },
      ],
      pressFreedomIncidents: [
        {
          date: '2003',
          description:
            'Rakyat Merdeka editor Supratman was arrested and convicted of defamation for ' +
            'publishing inflammatory headlines about then-President Megawati Sukarnoputri. ' +
            'The case highlighted tensions between press freedom and defamation law in ' +
            'post-Suharto Indonesia.',
          outcome:
            'Editor sentenced; the case became a reference point in debates about Indonesian ' +
            'press freedom and the use of defamation charges against journalists.',
        },
      ],
      awards: [],
      foundingContext:
        'RMOL emerged from the Rakyat Merdeka newspaper tradition, which was established in ' +
        'the early post-Suharto era as a sensationalist, populist tabloid. The digital ' +
        'platform extended this identity into online media, becoming a key outlet for ' +
        'opposition political commentary and analysis. While it plays an important role ' +
        "in Indonesia's media ecosystem by providing space for dissenting voices, its " +
        'opinion-heavy, often sensationalist approach means it functions more as a political ' +
        'signal source than a traditional news outlet.',
      keyMilestones: [
        { year: '2000', event: 'Rakyat Merdeka established as a post-Suharto tabloid voice' },
        { year: '2003', event: 'Editor arrested for defamation of President Megawati' },
        { year: '2009', event: 'RMOL digital platform launched' },
        { year: '2014', event: 'Became prominent opposition platform during Jokowi presidency' },
        { year: '2024', event: 'Navigating editorial position under Prabowo presidency' },
      ],
    },
  },

  // ──────────────────────────────────────────────────────────
  // 19. BISNIS INDONESIA
  // ──────────────────────────────────────────────────────────
  {
    id: 'bisnis-indonesia',
    name: 'Bisnis Indonesia',
    country: 'ID',
    languages: ['id'],
    url: 'https://www.bisnis.com',
    feedUrls: [
      'https://www.bisnis.com/rss',
      'https://finansial.bisnis.com/rss',
      'https://market.bisnis.com/rss',
    ],
    politicalLeaning: 'centrist',
    ownership: {
      owner: 'PT Jurnalindo Aksara Grafika',
      conglomerate: 'Bisnis Indonesia Group',
      politicalAffiliation: undefined,
      notes:
        "Founded in 1985 by Sukamdani Sahid Gitosardjono as Indonesia's first dedicated " +
        'business daily. Part of the Bisnis Indonesia Group which also operates Bisnis.com ' +
        'and related financial information services. Maintained editorial independence focused ' +
        'on economic and financial reporting. The Sahid Group (hospitality conglomerate) is ' +
        'the historical backer, though the editorial operation runs independently.',
    },
    editorialGoal: 'Authoritative business and financial journalism, pro-market economic analysis',
    reliabilityScore: 0.75,
    audienceTypes: ['elite-policy'],
    biasDirection: 'neutral',
    signalWeight: 0.8,
    active: true,
    extendedProfile: {
      ownershipChain: [
        { entity: 'PT Jurnalindo Aksara Grafika', role: 'direct-owner', stake: '100%' },
        { entity: 'Bisnis Indonesia Group', role: 'parent-company', since: '1985' },
        {
          entity: 'Sahid Group (Sukamdani family)',
          role: 'ultimate-beneficiary',
          since: '1985',
        },
      ],
      politicalHistory: [
        {
          period: '1985-1998',
          stance: 'Pro-business within New Order constraints',
          details:
            'Launched during the Suharto era as a business daily serving the growing Indonesian ' +
            'corporate sector. Operated within the permissible boundaries of New Order press ' +
            'restrictions but carved out a niche in financial and economic reporting where ' +
            'editorial constraints were somewhat looser than in political coverage.',
          administration: 'Suharto (New Order)',
        },
        {
          period: '1998-2014',
          stance: 'Pro-reform from an economic liberalization perspective',
          details:
            'Supported economic reforms during post-Suharto transition. Covered the Asian ' +
            'Financial Crisis aftermath, IMF restructuring, and subsequent economic recovery ' +
            'with depth unmatched by generalist outlets. Maintained centrist political stance ' +
            'while advocating for market-friendly policies and good governance as prerequisites ' +
            'for economic development.',
          administration: 'Post-Suharto transition / Yudhoyono',
        },
        {
          period: '2014-present',
          stance: 'Centrist, pro-business, policy-focused',
          details:
            "Covered Jokowi's infrastructure push and economic policies with analytical depth. " +
            'Generally supportive of pro-investment and market-opening policies while maintaining ' +
            'critical coverage of regulatory inconsistencies and business climate challenges. ' +
            'Under Prabowo, focused on fiscal policy, defense spending impacts on the economy, ' +
            'and free meal programme cost analysis.',
          administration: 'Joko Widodo / Prabowo Subianto',
        },
      ],
      editorialStances: [
        {
          topic: 'Economic policy and investment climate',
          stance: 'Pro-market, pro-investment, reform-oriented',
          examples: [
            'Supportive coverage of Omnibus Law on Job Creation as business climate improvement',
            'Critical analysis of protectionist policies that deter foreign investment',
            'In-depth coverage of capital market development and financial sector reforms',
          ],
        },
        {
          topic: 'State-owned enterprises (SOEs)',
          stance: 'Reform-oriented, favours professional management over political appointment',
          examples: [
            'Analytical coverage of SOE performance and governance issues',
            'Critical of political appointments to SOE leadership positions',
            'Advocacy for SOE privatisation and professional governance standards',
          ],
        },
        {
          topic: 'Fiscal and monetary policy',
          stance: 'Broadly orthodox, supportive of Bank Indonesia independence',
          examples: [
            'Detailed coverage of BI interest rate decisions and macroeconomic analysis',
            'Critical coverage of fiscal deficit concerns and debt sustainability',
            'Analytical reporting on rupiah stability and capital flows',
          ],
        },
      ],
      audienceDemographics: {
        estimatedMonthlyReach:
          '8-15 million unique visitors (web); print circulation ~45,000 (premium business readership)',
        primaryDemographic:
          'Business executives, investors, financial professionals, policymakers, aged 30-60',
        geographicFocus: 'Jakarta-centric; national business community',
        platformBreakdown: {
          web: '55%',
          print: '15%',
          mobile: '20%',
          social: '10%',
        },
      },
      reliabilityRecord: [
        {
          incident: 'Consistently high standards in financial and economic reporting',
          date: '1985-present',
          impact: 'Regarded as the most authoritative Indonesian source for business news',
          outcome: 'Trusted by financial professionals and policymakers as a reference source',
        },
        {
          incident:
            'Occasional uncritical coverage of major advertisers and business conglomerates',
          date: 'Periodic',
          impact: 'Business model dependence on corporate advertising creates potential conflicts',
          outcome:
            'Coverage of major advertisers should be cross-referenced with independent sources',
        },
      ],
      biasExamples: [
        {
          topic: 'Labour rights vs business interests',
          expectedCoverage: 'Balanced assessment of worker protections and business flexibility',
          actualCoverage:
            'Consistently frames labour market issues from an employer/investor perspective. ' +
            'Coverage of the Omnibus Law heavily emphasized business benefits while underplaying ' +
            'worker concerns. Labour protests covered primarily through the lens of business ' +
            'disruption rather than legitimate grievance.',
          analysis:
            "The pro-business bias is structural and consistent with the publication's identity. " +
            'Valuable as an authoritative business perspective but should be complemented with ' +
            'sources that cover labour, social, and distributional impacts of economic policy.',
        },
      ],
      pressFreedomIncidents: [],
      awards: [
        { name: 'SOPA Award for Excellence in Business Reporting', year: '2017' },
        { name: 'Indonesia Press Council Standards Compliance Recognition', year: '2020' },
      ],
      foundingContext:
        "Founded in 1985 by Sukamdani Sahid Gitosardjono as Indonesia's first dedicated " +
        'business daily newspaper, filling a gap in the media landscape for serious financial ' +
        'and economic reporting. Modelled on international business dailies, Bisnis Indonesia ' +
        'has maintained its position as the authoritative voice on Indonesian business and ' +
        'economic affairs for nearly four decades. The transition to digital through Bisnis.com ' +
        'has expanded its reach while maintaining the analytical depth of the print tradition.',
      keyMilestones: [
        { year: '1985', event: "Founded as Indonesia's first dedicated business daily" },
        {
          year: '1998',
          event:
            'Comprehensive coverage of Asian Financial Crisis and its impact on Indonesian business',
        },
        { year: '2008', event: 'Launched Bisnis.com digital platform' },
        { year: '2017', event: 'Won SOPA Award for business reporting excellence' },
        { year: '2020', event: 'Expanded digital subscription model and financial data services' },
      ],
    },
  },

  // ──────────────────────────────────────────────────────────
  // 20. JAWA POS
  // ──────────────────────────────────────────────────────────
  {
    id: 'jawa-pos',
    name: 'Jawa Pos',
    country: 'ID',
    languages: ['id'],
    url: 'https://www.jawapos.com',
    feedUrls: ['https://www.jawapos.com/rss', 'https://www.jawapos.com/nasional/rss'],
    politicalLeaning: 'centrist',
    ownership: {
      owner: 'PT Jawa Pos Koran',
      conglomerate: 'Jawa Pos Group',
      politicalAffiliation:
        'Moderate pro-government leanings; founder Dahlan Iskan served as Minister of SOEs under Yudhoyono',
      notes:
        'Founded in 1949, but revitalised and transformed into a major media empire by Dahlan ' +
        "Iskan from the 1980s onward. The Jawa Pos Group grew to become one of Indonesia's " +
        'largest media conglomerates with over 100 regional newspapers under the Jawa Pos News ' +
        "Network (JPNN). Dahlan Iskan's political career (SOE Minister 2011-2014, brief 2014 " +
        'presidential bid) inextricably linked the media group to political networks. After ' +
        "Dahlan's era, the group continues under professional management but retains the " +
        'moderate, establishment-friendly editorial orientation.',
    },
    editorialGoal:
      'Regional and national news with strong East Java roots, moderate mainstream reporting',
    reliabilityScore: 0.65,
    audienceTypes: ['urban-middle', 'rural-mass'],
    biasDirection: 'pro-government',
    signalWeight: 0.65,
    active: true,
    extendedProfile: {
      ownershipChain: [
        { entity: 'PT Jawa Pos Koran', role: 'direct-owner', stake: '100%' },
        { entity: 'Jawa Pos Group', role: 'parent-company', since: '1982' },
        {
          entity: 'Dahlan Iskan / Jawa Pos Group management',
          role: 'ultimate-beneficiary',
          since: '1982',
        },
        {
          entity: 'Jawa Pos News Network (JPNN — 100+ regional newspapers)',
          role: 'parent-company',
          since: '2002',
        },
      ],
      politicalHistory: [
        {
          period: '1949-1982',
          stance: 'Small regional newspaper',
          details:
            'Founded in 1949 in Surabaya as a small local newspaper. Went through several ' +
            'ownership changes and struggled financially before Dahlan Iskan took over editorial ' +
            'leadership in 1982, transforming it from a nearly defunct paper with circulation ' +
            'under 10,000 into a major national media force.',
          administration: 'Sukarno / Suharto (New Order)',
        },
        {
          period: '1982-2011',
          stance: 'Moderate, business-minded, expansion-focused',
          details:
            "Under Dahlan Iskan's leadership, Jawa Pos grew from a struggling regional paper " +
            "into one of Indonesia's largest media groups. Editorial stance was moderate and " +
            "business-friendly, reflecting Dahlan's entrepreneurial orientation. Built the JPNN " +
            'network of over 100 regional papers, creating unprecedented regional media coverage ' +
            'across Indonesia. Operated within New Order constraints but pivoted effectively to ' +
            'the post-Reformasi landscape.',
          administration: 'Suharto (New Order) / Post-Suharto transition / Yudhoyono',
        },
        {
          period: '2011-2014',
          stance: "Complicated by founder's political career",
          details:
            'Dahlan Iskan was appointed Minister of State-Owned Enterprises by President ' +
            'Yudhoyono in 2011, creating an inherent conflict of interest with the media group. ' +
            'During this period, coverage of SOE-related issues and Yudhoyono government was ' +
            'notably softer. Dahlan briefly ran for the 2014 presidential nomination, further ' +
            'entangling the media group with political ambitions.',
          administration: 'Susilo Bambang Yudhoyono',
        },
        {
          period: '2014-present',
          stance: 'Moderate pro-government, establishment-friendly',
          details:
            "After Dahlan's exit from government, Jawa Pos settled into a moderate, " +
            'establishment-friendly editorial stance. Coverage of successive governments has ' +
            'been generally supportive without being sycophantic. Strong on regional coverage ' +
            'through JPNN network, but national political coverage tends toward safe, ' +
            'non-confrontational reporting.',
          administration: 'Joko Widodo / Prabowo Subianto',
        },
      ],
      editorialStances: [
        {
          topic: 'Regional development and decentralisation',
          stance: 'Strongly supportive, reflecting East Java roots and regional network',
          examples: [
            'Extensive coverage of regional development through JPNN network',
            'Advocacy for equitable development beyond Jakarta',
            'Positive framing of regional autonomy and local governance stories',
          ],
        },
        {
          topic: 'National politics',
          stance: 'Moderate, avoids strong adversarial positions',
          examples: [
            'Coverage of national politics tends toward event reporting over investigative depth',
            "Soft treatment of figures connected to Jawa Pos Group's political network",
            'Generally supportive of government development narratives',
          ],
        },
        {
          topic: 'Business and entrepreneurship',
          stance: "Pro-business, reflecting Dahlan Iskan's entrepreneurial legacy",
          examples: [
            'Regular features on business success stories, especially from East Java',
            'Positive coverage of infrastructure and economic development programmes',
            "Dahlan Iskan's personal column remains influential",
          ],
        },
      ],
      audienceDemographics: {
        estimatedMonthlyReach:
          '15-25 million unique visitors (Jawapos.com + JPNN network combined reach)',
        primaryDemographic:
          'Middle-class Indonesians, 25-55, strong East Java and regional readership',
        geographicFocus:
          'East Java (primary), national via JPNN network; Surabaya is the editorial base',
        platformBreakdown: {
          web: '40%',
          print: '20%',
          mobile: '25%',
          social: '15%',
        },
      },
      reliabilityRecord: [
        {
          incident: 'Solid regional reporting through extensive JPNN correspondent network',
          date: 'Ongoing',
          impact: 'Often first to report on regional stories due to deep local presence',
          outcome: 'Strong reliability for East Java and regional news coverage',
        },
        {
          incident: 'National political coverage limited by establishment-friendly orientation',
          date: 'Ongoing',
          impact: 'Avoids adversarial reporting that might damage political relationships',
          outcome:
            'Reliable for factual reporting but limited as a source for critical political analysis',
        },
        {
          incident: "Conflict of interest during Dahlan Iskan's ministerial tenure",
          date: '2011-2014',
          impact: 'Coverage of SOEs and Yudhoyono government was compromised during this period',
          outcome:
            "Legacy conflict of interest that affected credibility; since resolved with Dahlan's departure from government",
        },
      ],
      biasExamples: [
        {
          topic: "Coverage of Dahlan Iskan's political and legal issues",
          expectedCoverage:
            "Objective coverage of founder's corruption case and political activities",
          actualCoverage:
            "Notably sympathetic coverage of Dahlan Iskan's 2017 corruption conviction (later " +
            'overturned on appeal) and his ongoing political commentary. His personal column ' +
            'in Jawa Pos remains a prominent feature despite the obvious editorial independence ' +
            'concerns.',
          analysis:
            'The founder-media relationship creates an inherent bias in coverage related to ' +
            'Dahlan Iskan personally and to political figures and issues connected to him. ' +
            'This is a well-understood limitation in Indonesian media circles.',
        },
        {
          topic: 'East Java regional politics',
          expectedCoverage: 'Balanced coverage of regional political competition',
          actualCoverage:
            'Coverage of East Java politics tends to favour candidates and parties aligned with ' +
            "the Jawa Pos Group's interests and network. The paper's enormous influence in East " +
            'Java makes it a political actor in its own right, not merely a reporter.',
          analysis:
            "Jawa Pos's dominance in East Java media makes it simultaneously a news source and " +
            'a political power broker in the region. Coverage should be read with this dual role ' +
            'in mind.',
        },
      ],
      pressFreedomIncidents: [],
      awards: [
        { name: 'Adinegoro Award (Indonesian Journalism Award)', year: '2005' },
        { name: 'WAN-IFRA Asian Media Award for regional network innovation', year: '2015' },
      ],
      foundingContext:
        'Founded in 1949 in Surabaya as a small local newspaper, Jawa Pos was transformed into ' +
        'a media powerhouse by Dahlan Iskan after he took over editorial leadership in 1982. ' +
        'From a nearly defunct paper with fewer than 10,000 readers, Dahlan built it into ' +
        "Indonesia's largest regional newspaper and established the Jawa Pos News Network " +
        '(JPNN), a network of over 100 regional newspapers spanning the Indonesian archipelago. ' +
        'This network represents one of the most significant innovations in Indonesian media — ' +
        'creating a distributed regional reporting infrastructure unmatched by any other ' +
        "Indonesian media group. Dahlan Iskan's subsequent political career (SOE Minister " +
        'under Yudhoyono 2011-2014, unsuccessful 2014 presidential bid, 2017 corruption case ' +
        "later overturned) added layers of political entanglement to the media group's identity.",
      keyMilestones: [
        { year: '1949', event: 'Founded in Surabaya as a local newspaper' },
        {
          year: '1982',
          event: 'Dahlan Iskan takes over; begins transformation into national media group',
        },
        { year: '1997', event: 'Circulation reaches 400,000+, largest in East Java' },
        { year: '2002', event: 'Jawa Pos News Network (JPNN) formalised with 80+ regional papers' },
        { year: '2011', event: 'Founder Dahlan Iskan appointed Minister of SOEs under Yudhoyono' },
        {
          year: '2014',
          event: "Dahlan Iskan's brief presidential bid; returns to media after Jokowi wins",
        },
        {
          year: '2017',
          event: 'Dahlan Iskan convicted of corruption (later overturned on appeal in 2018)',
        },
        {
          year: '2020',
          event: 'Digital expansion of Jawapos.com; JPNN network exceeds 100 regional papers',
        },
      ],
    },
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
