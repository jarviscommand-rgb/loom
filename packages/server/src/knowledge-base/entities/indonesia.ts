/**
 * @module indonesia
 * @description Entity profiles knowledge base for key Indonesian political and media figures.
 * Contains structured biographical data, relationships, public stances, and media ownership
 * connections used by the LOOM narrative intelligence engine for contextual analysis.
 */

/**
 * Represents a relationship between two entities in the knowledge base.
 */
export interface EntityRelationship {
  /** Unique identifier of the related entity */
  entityId: string;
  /** Display name of the related entity */
  name: string;
  /** Description of the relationship */
  relationship: string;
}

/**
 * Represents a publicly known stance an entity holds on a topic.
 */
export interface PublicStance {
  /** The policy area or topic */
  topic: string;
  /** Summary of the entity's known position */
  stance: string;
}

/**
 * Represents a historical position or role held by an entity.
 */
export interface HistoricalPosition {
  /** Time period (e.g. "2014-2024") */
  period: string;
  /** Title or role held during that period */
  position: string;
}

/**
 * Represents a connection between an entity and a media organization.
 */
export interface MediaOwnershipConnection {
  /** Unique identifier of the media source */
  sourceId: string;
  /** Name of the media organization */
  sourceName: string;
  /** The entity's role or relationship to the media organization */
  role: string;
}

/**
 * A comprehensive profile for a key entity (person or organization) tracked by LOOM.
 * Profiles include biographical context, known relationships, public stances,
 * career history, and media ownership connections relevant to narrative analysis.
 */
export interface EntityProfile {
  /** Unique identifier for the entity */
  id: string;
  /** Full display name */
  name: string;
  /** Current primary role or title */
  role: string;
  /** Biographical background paragraph */
  background: string;
  /** Known relationships to other entities in the knowledge base */
  knownRelationships: EntityRelationship[];
  /** Publicly documented stances on key topics */
  publicStances: PublicStance[];
  /** Historical positions and roles held over time */
  historicalPositions: HistoricalPosition[];
  /** Connections to media organizations (ownership, editorial influence, etc.) */
  mediaOwnershipConnections: MediaOwnershipConnection[];
}

/**
 * Curated profiles of key Indonesian political and media figures.
 * Data reflects publicly available information as of early 2026.
 */
export const INDONESIA_ENTITY_PROFILES: EntityProfile[] = [
  {
    id: 'id-prabowo-subianto',
    name: 'Prabowo Subianto',
    role: 'President of the Republic of Indonesia (inaugurated October 2024)',
    background:
      "Prabowo Subianto is the eighth President of Indonesia, inaugurated on 20 October 2024 after winning the February 2024 presidential election with running mate Gibran Rakabuming Raka. A former lieutenant general in the Indonesian Army and former commander of Kopassus (Special Forces), Prabowo was previously dismissed from the military in 1998 amid allegations of human rights abuses during the fall of Suharto. He founded the Gerindra party in 2008 and ran unsuccessfully for president in 2014 and 2019 before serving as Minister of Defense under Joko Widodo from 2019 to 2024. His 2024 victory was seen as carrying forward elements of the Widodo political legacy, reinforced by the vice-presidential candidacy of Widodo's eldest son.",
    knownRelationships: [
      {
        entityId: 'id-joko-widodo',
        name: 'Joko Widodo',
        relationship:
          "Predecessor as President; appointed Prabowo as Minister of Defense (2019-2024); Widodo's son Gibran serves as Prabowo's Vice President",
      },
      {
        entityId: 'id-erick-thohir',
        name: 'Erick Thohir',
        relationship:
          'Retained as Minister of State-Owned Enterprises in the Prabowo cabinet, continuity from the Widodo administration',
      },
      {
        entityId: 'id-hary-tanoesoedibjo',
        name: 'Hary Tanoesoedibjo',
        relationship:
          "Political ally; Perindo party supported Prabowo's 2024 presidential campaign; MNC Group media provided favorable coverage",
      },
      {
        entityId: 'id-surya-paloh',
        name: 'Surya Paloh',
        relationship:
          'NasDem party initially backed rival candidate Anies Baswedan in 2024 before some NasDem figures shifted support to the Prabowo coalition',
      },
    ],
    publicStances: [
      {
        topic: 'Defense and sovereignty',
        stance:
          'Advocates a strong national defense posture; has pushed for increased military spending and domestic defense manufacturing capability',
      },
      {
        topic: 'Food security',
        stance:
          'Flagship policy of achieving national food self-sufficiency; launched ambitious agricultural programs including the controversial food estate project',
      },
      {
        topic: 'Free school meals',
        stance:
          'Signature social program providing free nutritious meals to schoolchildren nationwide, a central campaign promise',
      },
      {
        topic: 'Foreign policy',
        stance:
          "Maintains Indonesia's traditional non-aligned stance while strengthening bilateral ties with major powers including China and the United States",
      },
    ],
    historicalPositions: [
      {
        period: '1970s-1998',
        position:
          'Indonesian Army officer, rising to Commander of Kopassus (Special Forces Command)',
      },
      {
        period: '1998',
        position:
          'Commander of the Army Strategic Reserve (Kostrad); dismissed from military service',
      },
      { period: '2008', position: 'Founded the Great Indonesia Movement Party (Gerindra)' },
      { period: '2014', position: 'Presidential candidate (lost to Joko Widodo)' },
      {
        period: '2019',
        position:
          'Presidential candidate (lost to Joko Widodo); subsequently appointed Minister of Defense',
      },
      { period: '2019-2024', position: 'Minister of Defense under President Joko Widodo' },
      { period: '2024-present', position: 'President of the Republic of Indonesia' },
    ],
    mediaOwnershipConnections: [],
  },
  {
    id: 'id-joko-widodo',
    name: 'Joko Widodo',
    role: 'Former President of Indonesia (2014-2024)',
    background:
      'Joko Widodo, widely known as Jokowi, served as the seventh President of Indonesia from 2014 to 2024. Rising from a furniture business background in Solo, he became Mayor of Surakarta (2005-2012) and Governor of Jakarta (2012-2014) before winning the presidency. His administration prioritized infrastructure development, including the massive Trans-Java toll road, the new capital city Nusantara in East Kalimantan, and significant expansion of social welfare programs. His second term saw increasing criticism over democratic backsliding, including controversial constitutional court maneuvers that enabled his son Gibran Rakabuming Raka to run as vice president. He left office with a complex legacy of economic modernization alongside concerns about institutional erosion.',
    knownRelationships: [
      {
        entityId: 'id-prabowo-subianto',
        name: 'Prabowo Subianto',
        relationship:
          'Former political rival turned ally; Widodo appointed Prabowo as Defense Minister in 2019 and tacitly supported his 2024 presidential bid',
      },
      {
        entityId: 'id-erick-thohir',
        name: 'Erick Thohir',
        relationship:
          "Appointed Thohir as Minister of SOEs in 2019; Thohir previously chaired Widodo's 2019 re-election campaign",
      },
      {
        entityId: 'id-chairul-tanjung',
        name: 'Chairul Tanjung',
        relationship:
          "Business ally; Tanjung briefly served as Coordinating Minister for Economic Affairs in 2014 under the Yudhoyono administration but maintained close relations with Widodo's economic agenda",
      },
      {
        entityId: 'id-surya-paloh',
        name: 'Surya Paloh',
        relationship:
          "NasDem party under Paloh was a key coalition partner in both of Widodo's presidential terms",
      },
      {
        entityId: 'id-najwa-shihab',
        name: 'Najwa Shihab',
        relationship:
          "Conducted high-profile interviews with Widodo; Narasi TV frequently covered Widodo's policies with critical analysis",
      },
    ],
    publicStances: [
      {
        topic: 'Infrastructure',
        stance:
          'Championed massive infrastructure program including toll roads, airports, dams, and the new capital Nusantara in East Kalimantan',
      },
      {
        topic: 'Economic development',
        stance:
          'Focused on attracting foreign investment, downstreaming of natural resources (notably nickel), and expanding manufacturing',
      },
      {
        topic: 'Social welfare',
        stance:
          'Expanded social safety net programs including the PKH conditional cash transfer and Kartu Prakerja skills program',
      },
      {
        topic: 'Democratic norms',
        stance:
          'Faced criticism in second term for perceived erosion of democratic checks and balances, including controversial revisions to the KPK (anti-corruption commission) law',
      },
    ],
    historicalPositions: [
      { period: '2005-2012', position: 'Mayor of Surakarta (Solo)' },
      { period: '2012-2014', position: 'Governor of Jakarta' },
      { period: '2014-2019', position: 'President of Indonesia (first term)' },
      { period: '2019-2024', position: 'President of Indonesia (second term)' },
    ],
    mediaOwnershipConnections: [],
  },
  {
    id: 'id-chairul-tanjung',
    name: 'Chairul Tanjung',
    role: 'Chairman of CT Corp; media and banking conglomerate owner',
    background:
      "Chairul Tanjung is one of Indonesia's wealthiest individuals and the founder and chairman of CT Corp, a diversified conglomerate spanning media, financial services, retail, and entertainment. Through Trans Media, he controls a significant share of Indonesia's media landscape including Trans TV, Trans7, Detik.com (one of Indonesia's most-visited news portals), and CNN Indonesia (operated under license from Warner Bros. Discovery). His business empire also includes Bank Mega and the Trans Retail Group (Carrefour/Transmart). Often called \"Si Anak Singkong\" (The Cassava Kid) referencing his humble origins, Tanjung is regarded as one of the most powerful figures in Indonesian media, with the capacity to shape public discourse through editorial influence across his platforms.",
    knownRelationships: [
      {
        entityId: 'id-joko-widodo',
        name: 'Joko Widodo',
        relationship:
          'Maintained close business-political relations during the Widodo era; CT Corp benefited from economic stability under Widodo',
      },
      {
        entityId: 'id-hary-tanoesoedibjo',
        name: 'Hary Tanoesoedibjo',
        relationship:
          'Primary competitor in the Indonesian media market; Trans Media and MNC Group are the two largest commercial media conglomerates',
      },
      {
        entityId: 'id-surya-paloh',
        name: 'Surya Paloh',
        relationship:
          "Fellow media mogul; Paloh's Metro TV competes with CT Corp's CNN Indonesia in the television news segment",
      },
      {
        entityId: 'id-goenawan-mohamad',
        name: 'Goenawan Mohamad',
        relationship:
          "CT Corp's Detik.com competes directly with Tempo (founded by Goenawan Mohamad) in the online news space; represent contrasting media traditions — commercial vs. independent journalism",
      },
    ],
    publicStances: [
      {
        topic: 'Media industry',
        stance:
          'Advocates for commercially sustainable media models; has invested heavily in digital media transformation',
      },
      {
        topic: 'Economic liberalization',
        stance:
          'Supports open markets and foreign investment in Indonesia; active in promoting Indonesian business internationally',
      },
      {
        topic: 'Education and philanthropy',
        stance:
          'Established CT ARSA Foundation focused on education scholarships and community development',
      },
    ],
    historicalPositions: [
      { period: '1987', position: 'Founded Para Group (later renamed CT Corp)' },
      { period: '2001', position: 'Acquired Bank Mega' },
      {
        period: '2005-present',
        position: 'Built Trans Media empire (Trans TV, Trans7, Detik.com, CNN Indonesia)',
      },
      {
        period: '2014',
        position:
          'Briefly served as Coordinating Minister for Economic Affairs (final months of Yudhoyono administration)',
      },
    ],
    mediaOwnershipConnections: [
      {
        sourceId: 'media-trans-tv',
        sourceName: 'Trans TV',
        role: 'Owner via CT Corp / Trans Media',
      },
      { sourceId: 'media-trans7', sourceName: 'Trans7', role: 'Owner via CT Corp / Trans Media' },
      {
        sourceId: 'media-detik',
        sourceName: 'Detik.com',
        role: 'Owner via CT Corp / Trans Media (acquired 2011)',
      },
      {
        sourceId: 'media-cnn-indonesia',
        sourceName: 'CNN Indonesia',
        role: 'Owner and operator via Trans Media under license from Warner Bros. Discovery',
      },
      {
        sourceId: 'media-cnbc-indonesia',
        sourceName: 'CNBC Indonesia',
        role: 'Owner and operator via Trans Media under license',
      },
    ],
  },
  {
    id: 'id-hary-tanoesoedibjo',
    name: 'Hary Tanoesoedibjo',
    role: 'Chairman of MNC Group; founder of Perindo party',
    background:
      "Hary Tanoesoedibjo is the chairman of MNC Group (Media Nusantara Citra), Indonesia's largest integrated media company by audience reach. MNC controls three free-to-air television networks — RCTI, MNC TV (formerly TPI), and GTV — along with the iNews TV news channel, Okezone.com news portal, and numerous radio and print properties. Beyond media, Tanoesoedibjo founded the Indonesian Unity Party (Perindo) in 2015 after previously leading the Hanura party. He has used his media empire to advance his political ambitions, with Perindo advertisements and branding heavily featured across MNC platforms. His dual role as media tycoon and party leader exemplifies the deep entanglement of media ownership and politics in Indonesia, attracting persistent criticism from press freedom advocates.",
    knownRelationships: [
      {
        entityId: 'id-prabowo-subianto',
        name: 'Prabowo Subianto',
        relationship:
          'Political ally; Perindo party joined the Prabowo-Gibran coalition for the 2024 presidential election; MNC media coverage was broadly favorable to Prabowo',
      },
      {
        entityId: 'id-chairul-tanjung',
        name: 'Chairul Tanjung',
        relationship:
          'Principal rival in Indonesian commercial media; MNC Group and Trans Media compete for advertising revenue and audience share',
      },
      {
        entityId: 'id-surya-paloh',
        name: 'Surya Paloh',
        relationship:
          'Fellow media-owner-turned-politician; both exemplify the media-politics nexus in Indonesia, though they lead rival parties',
      },
      {
        entityId: 'id-aburizal-bakrie',
        name: 'Aburizal Bakrie',
        relationship:
          "Fellow media-owning political figure; Bakrie's Viva Group (tvOne) competes with MNC in the news television segment",
      },
      {
        entityId: 'id-najwa-shihab',
        name: 'Najwa Shihab',
        relationship:
          'Najwa previously worked at Metro TV; her independent Narasi TV represents an alternative to conglomerate-owned media like MNC',
      },
    ],
    publicStances: [
      {
        topic: 'Media regulation',
        stance:
          'Opposes strict media ownership concentration limits; argues that market forces should determine media landscape',
      },
      {
        topic: 'Economic populism',
        stance:
          'Perindo party campaigns on small-business empowerment and programs providing carts and capital to street vendors',
      },
      {
        topic: 'National unity',
        stance:
          "Promotes Indonesian nationalism and pluralism through Perindo's branding; party anthem was ubiquitous across MNC channels",
      },
    ],
    historicalPositions: [
      { period: '2002', position: 'Acquired controlling stake in RCTI and built the MNC Group' },
      { period: '2011-2013', position: 'Chairman of Hanura party' },
      { period: '2015', position: 'Founded the Indonesian Unity Party (Perindo)' },
      { period: '2014', position: 'Vice presidential candidate alongside Wiranto' },
      {
        period: '2024-present',
        position: 'Perindo party chairman; coalition partner in the Prabowo government',
      },
    ],
    mediaOwnershipConnections: [
      { sourceId: 'media-rcti', sourceName: 'RCTI', role: 'Owner via MNC Group' },
      { sourceId: 'media-mnc-tv', sourceName: 'MNC TV', role: 'Owner via MNC Group' },
      { sourceId: 'media-gtv', sourceName: 'GTV', role: 'Owner via MNC Group' },
      { sourceId: 'media-inews', sourceName: 'iNews TV', role: 'Owner via MNC Group' },
      { sourceId: 'media-okezone', sourceName: 'Okezone.com', role: 'Owner via MNC Group' },
      { sourceId: 'media-sindonews', sourceName: 'SindoNews.com', role: 'Owner via MNC Group' },
    ],
  },
  {
    id: 'id-surya-paloh',
    name: 'Surya Paloh',
    role: 'Founder and Chairman of NasDem party; owner of Media Group',
    background:
      "Surya Paloh is the founder and chairman of the National Democrats (NasDem) party and the owner of Media Group, which controls Metro TV and the Media Indonesia daily newspaper. A veteran media figure, Paloh built his media empire starting in the 1980s and leveraged it into political influence. He founded NasDem in 2011, and the party became a key coalition partner in both of Joko Widodo's presidential terms. For the 2024 election, Paloh initially backed Anies Baswedan as NasDem's presidential candidate, positioning the party in opposition to the eventual Prabowo-Gibran ticket. Metro TV's editorial line has historically reflected NasDem's political positioning, making it one of the clearest examples of owner-directed political coverage in Indonesian broadcast media.",
    knownRelationships: [
      {
        entityId: 'id-joko-widodo',
        name: 'Joko Widodo',
        relationship:
          'NasDem was a core coalition partner in both Widodo presidential terms (2014-2024); relationship strained in 2024 when NasDem backed Anies Baswedan',
      },
      {
        entityId: 'id-prabowo-subianto',
        name: 'Prabowo Subianto',
        relationship:
          'Initially positioned NasDem against Prabowo in 2024 by backing Anies; post-election dynamics required navigating a new relationship with the Prabowo government',
      },
      {
        entityId: 'id-chairul-tanjung',
        name: 'Chairul Tanjung',
        relationship:
          'Competitor in television news; Metro TV competes with CNN Indonesia (CT Corp) for the politically engaged news audience',
      },
      {
        entityId: 'id-hary-tanoesoedibjo',
        name: 'Hary Tanoesoedibjo',
        relationship:
          'Both are media-mogul-politicians; NasDem and Perindo compete for similar voter bases while their TV networks compete for news viewers',
      },
      {
        entityId: 'id-najwa-shihab',
        name: 'Najwa Shihab',
        relationship:
          'Najwa Shihab was a prominent anchor at Metro TV before departing in 2017 to pursue independent journalism; her departure highlighted tensions between editorial independence and owner influence',
      },
    ],
    publicStances: [
      {
        topic: 'Political reform',
        stance:
          'NasDem was founded on a "Restorasi Indonesia" (Indonesian Restoration) platform promoting political change and clean governance',
      },
      {
        topic: 'Press freedom',
        stance:
          "Publicly advocates for press freedom while critics note Metro TV's editorial alignment with NasDem's political interests",
      },
      {
        topic: 'Coalition politics',
        stance:
          'Pragmatic coalition builder; has demonstrated willingness to shift alliances based on strategic considerations',
      },
    ],
    historicalPositions: [
      { period: '1986', position: 'Founded Media Indonesia newspaper' },
      { period: '2000', position: "Launched Metro TV, Indonesia's first 24-hour news channel" },
      { period: '2011', position: 'Founded the NasDem party' },
      {
        period: '2014-2024',
        position: 'NasDem chairman and coalition partner in the Widodo government',
      },
      { period: '2024', position: "Backed Anies Baswedan as NasDem's presidential candidate" },
    ],
    mediaOwnershipConnections: [
      { sourceId: 'media-metro-tv', sourceName: 'Metro TV', role: 'Owner via Media Group' },
      {
        sourceId: 'media-media-indonesia',
        sourceName: 'Media Indonesia',
        role: 'Owner via Media Group',
      },
      {
        sourceId: 'media-medcom',
        sourceName: 'Medcom.id',
        role: 'Owner via Media Group (online portal)',
      },
    ],
  },
  {
    id: 'id-erick-thohir',
    name: 'Erick Thohir',
    role: 'Minister of State-Owned Enterprises; media entrepreneur',
    background:
      "Erick Thohir is an Indonesian businessman and politician serving as Minister of State-Owned Enterprises (BUMN) under both President Joko Widodo (from 2019) and President Prabowo Subianto. Before entering government, Thohir built Mahaka Media Group, which includes Republika newspaper and Jak TV, and gained international prominence as the owner of Inter Milan football club (2013-2018) and the chairman of the Indonesia Asian Games 2018 organizing committee. He chaired Joko Widodo's successful 2019 re-election campaign before being appointed to the cabinet. As SOE minister, he has overseen significant restructuring of Indonesia's state enterprises, including merging Sharia banking entities into Bank Syariah Indonesia and reforming the Pertamina and PLN state utilities. His retention by Prabowo signals policy continuity in state enterprise management.",
    knownRelationships: [
      {
        entityId: 'id-joko-widodo',
        name: 'Joko Widodo',
        relationship:
          "Chaired Widodo's 2019 re-election campaign; appointed Minister of SOEs in 2019",
      },
      {
        entityId: 'id-prabowo-subianto',
        name: 'Prabowo Subianto',
        relationship:
          'Retained as Minister of SOEs in the Prabowo cabinet (2024-present), one of few ministers carried over from the Widodo administration',
      },
      {
        entityId: 'id-chairul-tanjung',
        name: 'Chairul Tanjung',
        relationship:
          "Fellow media and business figure; Mahaka Media operates in a different segment (niche/community media) compared to CT Corp's mass-market dominance",
      },
      {
        entityId: 'id-aburizal-bakrie',
        name: 'Aburizal Bakrie',
        relationship:
          "Both are businessmen-turned-politicians; Thohir's SOE reforms have occasionally intersected with Bakrie Group interests in resources and infrastructure",
      },
    ],
    publicStances: [
      {
        topic: 'SOE reform',
        stance:
          'Advocates aggressive restructuring and professionalization of state-owned enterprises; has merged, dissolved, and reorganized numerous entities',
      },
      {
        topic: 'Digital transformation',
        stance: 'Pushes for digitalization of government services and state enterprise operations',
      },
      {
        topic: 'Sports and soft power',
        stance:
          "Uses sports ownership and event management as vehicles for Indonesia's international branding and soft power projection",
      },
    ],
    historicalPositions: [
      { period: '2000s', position: 'Built Mahaka Media Group (Republika, Jak TV)' },
      { period: '2013-2018', position: 'Owner and president of Inter Milan football club' },
      {
        period: '2018',
        position: 'Chairman of the Indonesian Asian Games 2018 organizing committee (INASGOC)',
      },
      {
        period: '2019',
        position: "Chairman of Joko Widodo's 2019 presidential re-election campaign",
      },
      {
        period: '2019-2024',
        position: 'Minister of State-Owned Enterprises under President Widodo',
      },
      {
        period: '2024-present',
        position: 'Minister of State-Owned Enterprises under President Prabowo',
      },
    ],
    mediaOwnershipConnections: [
      {
        sourceId: 'media-republika',
        sourceName: 'Republika',
        role: 'Owner via Mahaka Media Group',
      },
      { sourceId: 'media-jak-tv', sourceName: 'Jak TV', role: 'Owner via Mahaka Media Group' },
    ],
  },
  {
    id: 'id-aburizal-bakrie',
    name: 'Aburizal Bakrie',
    role: 'Chairman of Bakrie Group; former Golkar chairman',
    background:
      "Aburizal Bakrie is an Indonesian business magnate and politician who serves as chairman of the Bakrie Group, one of Indonesia's oldest conglomerates with interests in telecommunications, mining, real estate, and media. Through the Viva Group, he controls tvOne (a 24-hour news channel) and Viva.co.id news portal. Bakrie served as Coordinating Minister for the Economy (2004-2005) and Coordinating Minister for People's Welfare (2005-2009) under President Susilo Bambang Yudhoyono. He subsequently served as chairman of the Golkar party (2009-2014), using that platform to run unsuccessfully for the party's presidential nomination. His business legacy is complicated by the Lapindo mudflow disaster (2006), in which a Bakrie Group subsidiary's drilling operations were implicated in triggering a devastating mud volcano in Sidoarjo, East Java, displacing tens of thousands of people.",
    knownRelationships: [
      {
        entityId: 'id-hary-tanoesoedibjo',
        name: 'Hary Tanoesoedibjo',
        relationship:
          'Competitor in news television; tvOne competes with iNews (MNC Group) for the news-oriented viewer segment',
      },
      {
        entityId: 'id-surya-paloh',
        name: 'Surya Paloh',
        relationship:
          'Fellow media-owning political figure; tvOne and Metro TV are direct competitors in the news channel market',
      },
      {
        entityId: 'id-erick-thohir',
        name: 'Erick Thohir',
        relationship:
          "Thohir's SOE ministry oversees state enterprises that intersect with Bakrie Group business interests in mining and infrastructure",
      },
      {
        entityId: 'id-goenawan-mohamad',
        name: 'Goenawan Mohamad',
        relationship:
          'Tempo magazine (co-founded by Goenawan) has been a persistent critical voice on the Lapindo mudflow disaster and Bakrie Group business practices',
      },
    ],
    publicStances: [
      {
        topic: 'Economic nationalism',
        stance:
          'Advocates for Indonesian ownership of strategic resources and industries; skeptical of excessive foreign control of mining and energy sectors',
      },
      {
        topic: 'Golkar and political centrism',
        stance:
          "Positioned Golkar as a centrist, pragmatic party during his chairmanship; emphasized economic competence as the party's core identity",
      },
      {
        topic: 'Lapindo mudflow',
        stance:
          'Has consistently disputed that Bakrie Group drilling caused the Sidoarjo mud volcano, attributing it to natural geological activity despite contrary scientific evidence',
      },
    ],
    historicalPositions: [
      { period: '1990s-present', position: 'Chairman of the Bakrie Group conglomerate' },
      {
        period: '2004-2005',
        position: 'Coordinating Minister for Economic Affairs under President Yudhoyono',
      },
      {
        period: '2005-2009',
        position: "Coordinating Minister for People's Welfare under President Yudhoyono",
      },
      { period: '2009-2014', position: 'Chairman of the Golkar party' },
      { period: '2014-present', position: 'Continued leadership of Bakrie Group and Viva Media' },
    ],
    mediaOwnershipConnections: [
      { sourceId: 'media-tvone', sourceName: 'tvOne', role: 'Owner via Viva Group / Bakrie Group' },
      {
        sourceId: 'media-viva',
        sourceName: 'Viva.co.id',
        role: 'Owner via Viva Group / Bakrie Group',
      },
      {
        sourceId: 'media-antv',
        sourceName: 'ANTV',
        role: 'Former owner via Viva Group (entertainment channel)',
      },
    ],
  },
  {
    id: 'id-najwa-shihab',
    name: 'Najwa Shihab',
    role: 'Founder of Narasi TV; journalist and media figure',
    background:
      "Najwa Shihab is Indonesia's most prominent and influential journalist, known for her incisive interviewing style and commitment to accountability journalism. The daughter of renowned Islamic scholar Quraish Shihab, she began her career at Metro TV in 2001, where she anchored the flagship program \"Mata Najwa\" (Najwa's Eye), which became one of Indonesia's most-watched political talk shows. She left Metro TV in 2017 — a departure widely attributed to tensions between editorial independence and the political interests of Metro TV owner Surya Paloh — and founded Narasi TV, a digital-first media company. Narasi has become a leading independent news platform, known for in-depth investigative reporting, innovative digital storytelling, and engaging younger audiences through social media. Najwa's YouTube channel has millions of subscribers, making her one of Southeast Asia's most-followed journalists.",
    knownRelationships: [
      {
        entityId: 'id-surya-paloh',
        name: 'Surya Paloh',
        relationship:
          "Former employer; Najwa's departure from Metro TV in 2017 highlighted tensions between journalistic independence and owner-directed editorial policy",
      },
      {
        entityId: 'id-joko-widodo',
        name: 'Joko Widodo',
        relationship:
          'Conducted multiple high-profile interviews; known for pressing Widodo on difficult topics including democratic backsliding and the Nusantara capital project',
      },
      {
        entityId: 'id-goenawan-mohamad',
        name: 'Goenawan Mohamad',
        relationship:
          'Fellow champion of independent journalism in Indonesia; both represent the tradition of media as a check on power rather than an instrument of it',
      },
      {
        entityId: 'id-hary-tanoesoedibjo',
        name: 'Hary Tanoesoedibjo',
        relationship:
          'Narasi TV represents an independent alternative to conglomerate-controlled media like MNC Group; Najwa has covered media ownership concentration as a governance issue',
      },
    ],
    publicStances: [
      {
        topic: 'Press freedom',
        stance:
          'Outspoken advocate for press freedom and editorial independence; frequently speaks at international media freedom events',
      },
      {
        topic: 'Media ownership transparency',
        stance:
          'Has publicly highlighted the risks of media concentration in the hands of politically active owners; advocates for clearer separation of media ownership and political activity',
      },
      {
        topic: 'Digital media and youth engagement',
        stance:
          'Pioneered digital-first journalism models in Indonesia; believes in engaging younger audiences through social media platforms and innovative storytelling formats',
      },
      {
        topic: 'Accountability journalism',
        stance:
          'Known for holding politicians of all affiliations to account through tough, well-prepared interviews; "Mata Najwa" has challenged officials across the political spectrum',
      },
    ],
    historicalPositions: [
      { period: '2001-2017', position: 'Journalist and anchor at Metro TV; host of "Mata Najwa"' },
      { period: '2018-present', position: 'Founder and editorial director of Narasi TV' },
      {
        period: '2018-present',
        position: 'Host of "Mata Najwa" (revived on Trans7 and digital platforms)',
      },
    ],
    mediaOwnershipConnections: [
      { sourceId: 'media-narasi', sourceName: 'Narasi TV', role: 'Founder and editorial director' },
    ],
  },
  {
    id: 'id-goenawan-mohamad',
    name: 'Goenawan Mohamad',
    role: 'Co-founder of Tempo magazine; poet, essayist, and press freedom advocate',
    background:
      'Goenawan Mohamad is one of Indonesia\'s most respected intellectuals, celebrated as a poet, essayist, and founding figure of independent journalism in Indonesia. He co-founded Tempo magazine in 1971, which became the country\'s most influential newsweekly, known for its investigative journalism and willingness to challenge the Suharto regime. Tempo was banned by the government in 1994 for its critical reporting, an act that galvanized the Indonesian press freedom movement. The magazine was relaunched after the fall of Suharto in 1998 and continues to operate as Tempo Media Group, encompassing the weekly magazine, daily newspaper Koran Tempo, and the Tempo.co digital platform. Goenawan stepped down from direct editorial management but remains an influential voice through his weekly "Catatan Pinggir" (Sideline Notes) column and his broader literary and cultural activities. He is regarded as a moral compass for Indonesian journalism and a symbol of the principle that press freedom is inseparable from democratic governance.',
    knownRelationships: [
      {
        entityId: 'id-chairul-tanjung',
        name: 'Chairul Tanjung',
        relationship:
          "Tempo.co competes with CT Corp's Detik.com in online news; represents the independent journalism tradition in contrast to commercially-driven conglomerate media",
      },
      {
        entityId: 'id-aburizal-bakrie',
        name: 'Aburizal Bakrie',
        relationship:
          'Tempo has published extensive critical investigations of Bakrie Group business practices and the Lapindo mudflow disaster',
      },
      {
        entityId: 'id-najwa-shihab',
        name: 'Najwa Shihab',
        relationship:
          "Fellow champion of independent journalism; Goenawan's legacy at Tempo and Najwa's work at Narasi represent successive generations of press independence in Indonesia",
      },
      {
        entityId: 'id-surya-paloh',
        name: 'Surya Paloh',
        relationship:
          "Represents a contrasting vision of media's role; Goenawan advocates for media independence from political interests, while Paloh's Metro TV is closely tied to NasDem party agenda",
      },
    ],
    publicStances: [
      {
        topic: 'Press freedom',
        stance:
          "Lifelong champion of press freedom; Tempo's 1994 banning became a landmark moment in the Indonesian press freedom struggle",
      },
      {
        topic: 'Media independence',
        stance:
          "Advocates for media that serves the public interest rather than the political or business interests of owners; critical of Indonesia's media-political oligarchy",
      },
      {
        topic: 'Democracy and civil society',
        stance:
          'Believes that an independent press is a prerequisite for a functioning democracy; has spoken against authoritarian tendencies regardless of which government is in power',
      },
      {
        topic: 'Culture and pluralism',
        stance:
          'Promotes cultural pluralism and intellectual openness through literary and artistic work; co-founded the Utan Kayu community arts center and Salihara cultural complex in Jakarta',
      },
    ],
    historicalPositions: [
      { period: '1971', position: 'Co-founded Tempo magazine' },
      {
        period: '1971-1998',
        position: 'Editor-in-chief of Tempo (magazine banned by Suharto government in 1994)',
      },
      {
        period: '1998-present',
        position:
          'Founding figure and columnist at Tempo Media Group (magazine relaunched after fall of Suharto)',
      },
      {
        period: '2000s-present',
        position:
          'Poet, essayist, and cultural figure; author of the weekly "Catatan Pinggir" column',
      },
    ],
    mediaOwnershipConnections: [
      {
        sourceId: 'media-tempo',
        sourceName: 'Tempo Magazine',
        role: 'Co-founder (no longer in direct operational control)',
      },
      {
        sourceId: 'media-tempo-co',
        sourceName: 'Tempo.co',
        role: 'Founding figure of the Tempo Media Group that operates the platform',
      },
      {
        sourceId: 'media-koran-tempo',
        sourceName: 'Koran Tempo',
        role: 'Founding figure of the Tempo Media Group that publishes the daily',
      },
    ],
  },
  {
    id: 'id-anies-baswedan',
    name: 'Anies Baswedan',
    role: 'Former Governor of Jakarta (2017-2022); 2024 presidential candidate and opposition figure',
    background:
      "Anies Baswedan is a prominent Indonesian politician and academic who has occupied the intersection of intellectual credibility and populist appeal. Formerly the rector of Paramadina University, he briefly served as Minister of Education and Culture under Joko Widodo (2014-2016) before being replaced in a cabinet reshuffle. He then pivoted to the Jakarta gubernatorial race in 2017, winning a highly polarizing election against incumbent Basuki Tjahaja Purnama (Ahok) with significant support from conservative Islamic groups including the 212 movement. As governor, Anies reversed several of Ahok's signature policies — most notably halting the Jakarta Bay land reclamation project — and pursued a governance style emphasizing inclusivity rhetoric while drawing criticism for uneven administrative performance. His governorship ended in 2022 due to term limits. In the 2024 presidential election, he ran on the AMIN ticket (with Muhaimin Iskandar of PKB as his running mate), backed by NasDem, PKS, and PKB. Despite strong debate performances and support from reform-minded urbanites and conservative Muslims alike, he finished third. Post-election, Anies has positioned himself as a key opposition voice, advocating for democratic norms and critiquing the Prabowo administration's policy direction.",
    knownRelationships: [
      {
        entityId: 'id-joko-widodo',
        name: 'Joko Widodo',
        relationship:
          "Former mentor turned political rival; Widodo appointed Anies as Education Minister in 2014 but replaced him in 2016, and their relationship deteriorated further when Anies defeated Widodo's ally Ahok in the 2017 Jakarta election",
      },
      {
        entityId: 'id-surya-paloh',
        name: 'Surya Paloh',
        relationship:
          "Paloh's NasDem party was a key backer of Anies's 2024 presidential bid, providing critical party infrastructure and media support through Metro TV",
      },
      {
        entityId: 'id-prabowo-subianto',
        name: 'Prabowo Subianto',
        relationship:
          'Rival in the 2024 presidential election; Anies has since positioned himself as a leading opposition figure to the Prabowo administration',
      },
      {
        entityId: 'id-megawati-soekarnoputri',
        name: 'Megawati Soekarnoputri',
        relationship:
          'Complex and adversarial relationship; PDI-P under Megawati backed Ahok against Anies in the 2017 Jakarta election, establishing lasting political rivalry',
      },
    ],
    publicStances: [
      {
        topic: 'Urban governance reform',
        stance:
          'Advocates for inclusive urban development, community participation in city planning, and reversal of policies seen as favoring developers over residents',
      },
      {
        topic: 'Land reclamation',
        stance:
          'Strongly opposed Jakarta Bay reclamation project, halting it as governor on environmental and social equity grounds',
      },
      {
        topic: 'Education reform',
        stance:
          'As former Education Minister, pushed for Indonesia Teaching program (Indonesia Mengajar) and broader access to quality education',
      },
      {
        topic: 'Democratic norms',
        stance:
          'Vocal critic of democratic backsliding, political dynasties, and erosion of institutional checks and balances under the Prabowo administration',
      },
      {
        topic: 'Opposition politics',
        stance:
          'Positioned as a leading opposition figure advocating for accountability, transparency, and reform post-2024 election',
      },
    ],
    historicalPositions: [
      { period: '2007-2014', position: 'Rector of Paramadina University' },
      { period: '2014-2016', position: 'Minister of Education and Culture under Joko Widodo' },
      { period: '2017-2022', position: 'Governor of Jakarta (DKI Jakarta)' },
      {
        period: '2024',
        position:
          'Presidential candidate on the AMIN ticket (with Muhaimin Iskandar), finished third',
      },
      { period: '2024-present', position: 'Opposition figure and public intellectual' },
    ],
    mediaOwnershipConnections: [],
  },
  {
    id: 'id-ganjar-pranowo',
    name: 'Ganjar Pranowo',
    role: 'Former Governor of Central Java (2013-2023); 2024 presidential candidate',
    background:
      "Ganjar Pranowo is a PDI-P cadre who rose to national prominence as the widely popular Governor of Central Java. A former member of the DPR (national parliament), Ganjar built his reputation on an informal, approachable governing style characterized by impromptu visits to public facilities, blusukan (unannounced inspections), and an exceptionally active social media presence that earned him a massive following. His governance of Central Java was marked by investments in digital infrastructure, village development, and anti-corruption measures. In the 2024 presidential election, he was chosen by PDI-P chairperson Megawati Soekarnoputri as the party's candidate, running with Mahfud MD as his vice-presidential partner. Despite strong early polling, Ganjar finished second to Prabowo Subianto, with his campaign hampered by the Joko Widodo political machine's tacit support for the rival Prabowo-Gibran ticket — a painful irony given that both Ganjar and Widodo were PDI-P figures. His loss exposed deep fractures within PDI-P and raised questions about the party's future direction.",
    knownRelationships: [
      {
        entityId: 'id-megawati-soekarnoputri',
        name: 'Megawati Soekarnoputri',
        relationship:
          "Megawati, as PDI-P chairperson, personally selected Ganjar as the party's 2024 presidential candidate, reflecting her trust in his electability and party loyalty",
      },
      {
        entityId: 'id-joko-widodo',
        name: 'Joko Widodo',
        relationship:
          "Fellow PDI-P figure and Central Java political product, but Widodo's tacit backing of Prabowo-Gibran over Ganjar in 2024 created a deep rift",
      },
      {
        entityId: 'id-prabowo-subianto',
        name: 'Prabowo Subianto',
        relationship:
          'Primary rival in the 2024 presidential election; Ganjar lost to Prabowo in a contest shaped by incumbent political machinery',
      },
      {
        entityId: 'id-mahfud-md',
        name: 'Mahfud MD',
        relationship:
          "Vice-presidential running mate on the 2024 PDI-P ticket; their pairing combined Ganjar's populist appeal with Mahfud's legal and constitutional credibility",
      },
    ],
    publicStances: [
      {
        topic: 'Clean governance',
        stance:
          'Strong advocate for transparent, accountable governance; built his reputation on anti-corruption practices and open administration in Central Java',
      },
      {
        topic: 'Village development',
        stance:
          'Prioritized rural development and village fund optimization as governor, emphasizing bottom-up economic empowerment',
      },
      {
        topic: 'Digital governance',
        stance:
          'Pioneer of social media engagement in Indonesian politics; used digital platforms for direct citizen communication and public accountability',
      },
      {
        topic: 'Anti-corruption',
        stance:
          'Consistent supporter of the KPK (Corruption Eradication Commission) and institutional anti-corruption measures',
      },
      {
        topic: 'Education and human capital',
        stance:
          'Emphasized investment in education and vocational training as foundations for economic development',
      },
    ],
    historicalPositions: [
      {
        period: '2004-2013',
        position: 'Member of the DPR (national parliament) representing Central Java',
      },
      { period: '2013-2023', position: 'Governor of Central Java (two terms)' },
      {
        period: '2024',
        position: 'Presidential candidate on the PDI-P ticket (with Mahfud MD), finished second',
      },
    ],
    mediaOwnershipConnections: [],
  },
  {
    id: 'id-megawati-soekarnoputri',
    name: 'Megawati Soekarnoputri',
    role: 'Chairperson of PDI-P (Indonesian Democratic Party of Struggle); former President of Indonesia (2001-2004)',
    background:
      "Megawati Soekarnoputri is the daughter of Indonesia's founding President Sukarno and one of the most enduring figures in Indonesian politics. She became chairperson of PDI-P (Partai Demokrasi Indonesia Perjuangan) and served as Indonesia's first female president from 2001 to 2004, ascending to the presidency after the removal of Abdurrahman Wahid. She lost subsequent presidential bids in 2004 and 2009 but has since wielded enormous political power as PDI-P chairperson, effectively serving as kingmaker in Indonesian politics. Her party machine was the launching pad for Joko Widodo's rise from Solo mayor to president in 2014. However, her relationship with Widodo deteriorated sharply during his second term, particularly over the controversial Constitutional Court ruling that allowed Gibran Rakabuming Raka (Widodo's son) to run as Prabowo's vice-presidential candidate in 2024 — a move Megawati viewed as a betrayal of democratic principles and an act of political dynasty-building. PDI-P under Megawati lost the 2024 proxy battle when Prabowo-Gibran defeated her chosen candidate Ganjar Pranowo. She maintains tight party discipline and controls one of the largest legislative blocs in parliament, making PDI-P a critical force in Indonesian politics regardless of whether it sits in government or opposition.",
    knownRelationships: [
      {
        entityId: 'id-joko-widodo',
        name: 'Joko Widodo',
        relationship:
          "Elevated Widodo from Solo mayor to presidential candidate in 2014, but the relationship fractured during Widodo's second term over the Gibran VP candidacy and perceived disloyalty to PDI-P",
      },
      {
        entityId: 'id-prabowo-subianto',
        name: 'Prabowo Subianto',
        relationship:
          'Longtime political rival spanning multiple election cycles; Megawati lost the 2024 proxy battle when Widodo backed Prabowo-Gibran over her chosen candidate Ganjar',
      },
      {
        entityId: 'id-ganjar-pranowo',
        name: 'Ganjar Pranowo',
        relationship:
          "Personally selected Ganjar as PDI-P's 2024 presidential candidate; his loss was a significant political setback for Megawati's influence",
      },
      {
        entityId: 'id-sri-mulyani',
        name: 'Sri Mulyani Indrawati',
        relationship:
          "First appointed Sri Mulyani as Finance Minister during her own presidency; Sri Mulyani's technocratic credentials were first elevated on the national stage by Megawati",
      },
    ],
    publicStances: [
      {
        topic: 'Sukarnoism and nationalism',
        stance:
          "Upholds her father Sukarno's nationalist legacy, emphasizing Indonesian sovereignty, self-reliance, and the Pancasila state ideology",
      },
      {
        topic: 'Natural resource sovereignty',
        stance:
          'Advocates for state control over natural resources and skepticism toward foreign exploitation of Indonesian mineral and energy assets',
      },
      {
        topic: 'Political dynasties',
        stance:
          'Publicly opposed to political dynasty-building — particularly critical of the Widodo-Gibran arrangement — though critics note the irony given her own Sukarno dynasty',
      },
      {
        topic: 'Party discipline and loyalty',
        stance:
          'Demands strict loyalty from PDI-P cadres; views party discipline as essential to maintaining political coherence and ideological consistency',
      },
      {
        topic: 'Social welfare',
        stance:
          'Supports expansive social welfare programs, subsidies for the poor, and state-led economic intervention on behalf of ordinary Indonesians',
      },
    ],
    historicalPositions: [
      { period: '1999-2001', position: 'Vice President of Indonesia under Abdurrahman Wahid' },
      { period: '2001-2004', position: 'President of Indonesia (first female president)' },
      {
        period: '1999-present',
        position: 'Chairperson of PDI-P (Partai Demokrasi Indonesia Perjuangan)',
      },
      { period: '2004', position: 'Presidential candidate (lost to Susilo Bambang Yudhoyono)' },
      { period: '2009', position: 'Presidential candidate (lost to Yudhoyono again)' },
    ],
    mediaOwnershipConnections: [],
  },
  {
    id: 'id-luhut-pandjaitan',
    name: 'Luhut Binsar Pandjaitan',
    role: 'Former Coordinating Minister for Maritime and Investment Affairs; powerful political-business figure',
    background:
      "Luhut Binsar Pandjaitan is a retired military general who became one of the most powerful figures in Joko Widodo's government and arguably the single most influential person in Indonesian policy-making outside the presidency itself. A former Kopassus (special forces) commander with extensive military and intelligence experience, Luhut transitioned into business after retirement, building interests in mining, energy, and technology. His close personal friendship with Widodo — dating back to their shared roots in Solo — made him the president's most trusted adviser and enforcer. He served in multiple cabinet positions under Widodo, including Chief of Staff to the President, Coordinating Minister for Political, Legal, and Security Affairs, and ultimately Coordinating Minister for Maritime and Investment Affairs. In this last role, his portfolio expanded far beyond its formal scope: he led Indonesia's COVID-19 response on Java and Bali, spearheaded the electric vehicle and nickel downstreaming industrial policy, drove investment deregulation through the Omnibus Law, and cultivated deep relationships with Chinese investors and technology companies. His influence often exceeded his ministerial brief, earning him the nickname \"minister of everything.\" After Widodo's presidency ended, Luhut maintains significant business and political influence, with extensive networks that bridge the military, government, and business worlds.",
    knownRelationships: [
      {
        entityId: 'id-joko-widodo',
        name: 'Joko Widodo',
        relationship:
          "Closest adviser, enforcer, and personal friend throughout Widodo's presidency; entrusted with the most sensitive and challenging policy portfolios",
      },
      {
        entityId: 'id-prabowo-subianto',
        name: 'Prabowo Subianto',
        relationship:
          'Fellow retired military general with a complex relationship; both served in Kopassus, and Luhut maintains influence in the Prabowo era through business and political networks',
      },
      {
        entityId: 'id-sri-mulyani',
        name: 'Sri Mulyani Indrawati',
        relationship:
          'Cabinet colleague under Widodo; occasionally clashed on fiscal policy versus investment liberalization priorities, representing the tension between fiscal discipline and growth-at-all-costs approaches',
      },
      {
        entityId: 'id-erick-thohir',
        name: 'Erick Thohir',
        relationship:
          'Fellow Widodo cabinet member; worked in parallel on state enterprise reform and investment promotion, with overlapping but sometimes competing economic policy visions',
      },
    ],
    publicStances: [
      {
        topic: 'Investment liberalization',
        stance:
          'Aggressive proponent of deregulation and foreign investment attraction, particularly through the Omnibus Law on Job Creation and special economic zones',
      },
      {
        topic: 'EV industry and nickel downstreaming',
        stance:
          "Architect of Indonesia's strategy to ban raw nickel ore exports and build a domestic EV battery and processing industry, attracting billions in Chinese and Korean investment",
      },
      {
        topic: 'China engagement',
        stance:
          'Pragmatic advocate for deep economic engagement with China, viewing Chinese investment and technology transfer as essential for Indonesian industrialization',
      },
      {
        topic: 'Digital economy',
        stance:
          'Supports rapid digital economy development, including digital payments, e-commerce infrastructure, and tech startup ecosystem growth',
      },
      {
        topic: 'Infrastructure development',
        stance:
          'Champion of large-scale infrastructure projects as drivers of economic growth, including ports, industrial estates, and transportation networks',
      },
    ],
    historicalPositions: [
      {
        period: '1970s-1990s',
        position:
          'Military career in Kopassus (Army Special Forces Command) and various command positions',
      },
      { period: '1999-2002', position: 'Ambassador of Indonesia to Singapore' },
      { period: '2014-2015', position: 'Chief of Staff to President Joko Widodo' },
      {
        period: '2015-2016',
        position: 'Coordinating Minister for Political, Legal, and Security Affairs',
      },
      {
        period: '2016-2024',
        position:
          'Coordinating Minister for Maritime and Investment Affairs (portfolio repeatedly expanded)',
      },
    ],
    mediaOwnershipConnections: [],
  },
  {
    id: 'id-sri-mulyani',
    name: 'Sri Mulyani Indrawati',
    role: 'Minister of Finance of Indonesia; internationally recognized economic technocrat',
    background:
      "Sri Mulyani Indrawati is one of Indonesia's most internationally respected technocrats and one of the longest-serving finance ministers in the country's democratic era. She first rose to prominence as Finance Minister under Megawati's presidency, then served under Susilo Bambang Yudhoyono from 2005 to 2010, where she earned recognition for tax reform, improved fiscal transparency, and professional financial management. She departed to become Managing Director of the World Bank (2010-2016), one of the highest-ranking positions ever held by an Indonesian in an international institution. Joko Widodo recalled her to serve as Finance Minister in 2016, and she has held the position continuously since — through the remainder of Widodo's presidency and into the Prabowo administration. Her retention by Prabowo signals a commitment to fiscal policy continuity and international credibility. Sri Mulyani has won multiple international \"Best Finance Minister\" awards and is known for her transparent communication style, rigorous fiscal discipline, and willingness to push back against populist spending proposals. She has navigated Indonesia's finances through the COVID-19 pandemic, commodity price volatility, and the tension between fiscal prudence and the political demands for expansive social spending. Her relationship with the Prabowo administration carries inherent tension, as Prabowo's ambitious spending plans (particularly the free school meals program) test her commitment to deficit and debt limits.",
    knownRelationships: [
      {
        entityId: 'id-joko-widodo',
        name: 'Joko Widodo',
        relationship:
          'Recalled her from the World Bank in 2016 and entrusted her with fiscal management through both terms; Widodo valued her international credibility and technocratic independence',
      },
      {
        entityId: 'id-prabowo-subianto',
        name: 'Prabowo Subianto',
        relationship:
          "Retained as Finance Minister under Prabowo, but faces tension between her fiscal discipline and Prabowo's expansive spending ambitions, particularly the flagship free meals program",
      },
      {
        entityId: 'id-megawati-soekarnoputri',
        name: 'Megawati Soekarnoputri',
        relationship:
          'Megawati first elevated Sri Mulyani to national prominence by appointing her in the cabinet; this early relationship established her technocratic career trajectory',
      },
      {
        entityId: 'id-luhut-pandjaitan',
        name: 'Luhut Binsar Pandjaitan',
        relationship:
          "Cabinet colleague under Widodo with occasional policy friction; Luhut's push for investment spending sometimes conflicted with Sri Mulyani's fiscal discipline priorities",
      },
    ],
    publicStances: [
      {
        topic: 'Fiscal discipline',
        stance:
          "Steadfast defender of Indonesia's fiscal rules, including the 3% of GDP deficit ceiling; consistently pushes back against populist proposals that threaten fiscal sustainability",
      },
      {
        topic: 'Tax reform',
        stance:
          "Architect of Indonesia's tax reform agenda, including the controversial VAT rate increases and efforts to broaden the tax base through digitalization",
      },
      {
        topic: 'Debt management',
        stance:
          "Maintains conservative debt management, keeping Indonesia's debt-to-GDP ratio manageable while ensuring access to international capital markets at favorable rates",
      },
      {
        topic: 'Subsidy reform',
        stance:
          'Advocates for better-targeted subsidies, reducing blanket fuel and electricity subsidies in favor of direct cash transfers to the poor',
      },
      {
        topic: 'Transparent budgeting',
        stance:
          'Champion of budget transparency and open fiscal data, using public communication to build trust in government financial management',
      },
    ],
    historicalPositions: [
      {
        period: '2005-2010',
        position: 'Minister of Finance under President Susilo Bambang Yudhoyono',
      },
      { period: '2010-2016', position: 'Managing Director of the World Bank' },
      { period: '2016-2024', position: 'Minister of Finance under President Joko Widodo' },
      {
        period: '2024-present',
        position: 'Minister of Finance under President Prabowo Subianto (retained)',
      },
    ],
    mediaOwnershipConnections: [],
  },
  {
    id: 'id-mahfud-md',
    name: 'Mahfud MD',
    role: 'Former Coordinating Minister for Political, Legal, and Security Affairs; constitutional law expert',
    background:
      "Mohammad Mahfud MD is one of Indonesia's most prominent constitutional law scholars and a figure who has straddled the worlds of academia, the judiciary, and executive politics. He served as Chief Justice of the Constitutional Court (Mahkamah Konstitusi) from 2008 to 2013, where he earned a reputation for principled jurisprudence and defending constitutional integrity. Joko Widodo appointed him as Coordinating Minister for Political, Legal, and Security Affairs in 2019, a powerful portfolio overseeing law enforcement, intelligence, and political coordination. In the cabinet, Mahfud was known for his outspoken style — often making public statements that diverged from the government's preferred messaging, particularly on sensitive issues like corruption, human rights, and democratic governance. His tenure became increasingly fraught as the 2024 election approached. He resigned from the cabinet in early 2024 to become Ganjar Pranowo's vice-presidential running mate on the PDI-P ticket, a departure marked by acrimony. Mahfud publicly criticized the Widodo government's handling of election integrity issues, the controversial Constitutional Court ruling enabling Gibran's candidacy, and what he described as the erosion of democratic institutions. After the AMIN and Ganjar-Mahfud tickets both lost to Prabowo-Gibran, Mahfud has continued as a prominent voice for constitutional integrity and democratic reform.",
    knownRelationships: [
      {
        entityId: 'id-joko-widodo',
        name: 'Joko Widodo',
        relationship:
          "Appointed him as Coordinating Minister in 2019, but the relationship deteriorated sharply; Mahfud's resignation and public criticism of the government's democratic record marked a bitter break",
      },
      {
        entityId: 'id-ganjar-pranowo',
        name: 'Ganjar Pranowo',
        relationship:
          "Vice-presidential running mate on the 2024 PDI-P ticket; their partnership combined Ganjar's populist governance appeal with Mahfud's legal and constitutional authority",
      },
      {
        entityId: 'id-prabowo-subianto',
        name: 'Prabowo Subianto',
        relationship:
          "Rival in the 2024 presidential election; Mahfud has been critical of the Prabowo administration's approach to governance and democratic norms",
      },
      {
        entityId: 'id-megawati-soekarnoputri',
        name: 'Megawati Soekarnoputri',
        relationship:
          "Aligned with Megawati's PDI-P coalition for the 2024 election; shares concerns about political dynasty-building and democratic backsliding",
      },
    ],
    publicStances: [
      {
        topic: 'Constitutional integrity',
        stance:
          "Foremost advocate for upholding the Indonesian constitution as written; deeply critical of the Constitutional Court ruling that bypassed age requirements to enable Gibran's VP candidacy",
      },
      {
        topic: 'Anti-corruption',
        stance:
          'Consistent supporter of strong anti-corruption institutions and enforcement; critical of efforts to weaken the KPK (Corruption Eradication Commission)',
      },
      {
        topic: 'Judicial independence',
        stance:
          'Advocates for the independence of the Constitutional Court and judiciary from political interference, drawing on his experience as former Chief Justice',
      },
      {
        topic: 'Democratic norms',
        stance:
          'Vocal critic of democratic backsliding in Indonesia, including political dynasties, institutional capture, and erosion of checks and balances',
      },
      {
        topic: 'Rule of law',
        stance:
          'Emphasizes the primacy of rule of law over political expediency; has publicly challenged government actions he views as legally questionable',
      },
    ],
    historicalPositions: [
      { period: '1990s-2008', position: 'Constitutional law professor and legal scholar' },
      {
        period: '2008-2013',
        position: 'Chief Justice of the Constitutional Court (Mahkamah Konstitusi)',
      },
      {
        period: '2019-2024',
        position:
          'Coordinating Minister for Political, Legal, and Security Affairs under Joko Widodo',
      },
      {
        period: '2024',
        position:
          'Vice-presidential candidate on the PDI-P ticket with Ganjar Pranowo, finished second',
      },
      {
        period: '2024-present',
        position:
          'Public intellectual and advocate for constitutional reform and democratic governance',
      },
    ],
    mediaOwnershipConnections: [],
  },
];

/**
 * Returns all Indonesian entity profiles in the knowledge base.
 * @returns A readonly array of all entity profiles
 */
export function getEntityProfiles(): readonly EntityProfile[] {
  return INDONESIA_ENTITY_PROFILES;
}

/**
 * Retrieves a single entity profile by its unique identifier.
 * @param id - The entity ID to look up (e.g. "id-prabowo-subianto")
 * @returns The matching entity profile, or undefined if not found
 */
export function getEntityById(id: string): EntityProfile | undefined {
  return INDONESIA_ENTITY_PROFILES.find((entity) => entity.id === id);
}

/**
 * Finds all entities that have a known relationship to the specified entity.
 * This performs a reverse lookup — it returns entities whose `knownRelationships`
 * array contains a reference to the given entityId.
 * @param entityId - The entity ID to search for in relationship references
 * @returns An array of entity profiles that reference the given entityId
 */
export function getEntitiesRelatedTo(entityId: string): EntityProfile[] {
  return INDONESIA_ENTITY_PROFILES.filter((entity) =>
    entity.knownRelationships.some((relationship) => relationship.entityId === entityId)
  );
}
