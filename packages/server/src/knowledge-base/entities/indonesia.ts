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
