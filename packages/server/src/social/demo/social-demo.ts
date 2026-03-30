// ============================================================
// LOOM — Social Media Intelligence Demo Data
//
// Rich demo dataset for Indonesian political context including
// announcements, engagement data, influencer profiles, and
// audience personas.
// ============================================================

import type {
  SocialPlatform,
  EngagementMetrics,
  EngagementPattern,
  EngagementQuality,
  PlatformResponse,
  AnnouncementTracking,
  AudiencePersona,
  InfluencerProfile,
  AudienceSegment,
  SocialImpactScore,
  AmplificationChain,
  AmplificationNode,
} from '../types.js';

// ============================================================
// Helper: build engagement metrics
// ============================================================

/** Create an engagement metrics snapshot. */
function metrics(
  platform: SocialPlatform,
  likes: number,
  shares: number,
  comments: number,
  views: number,
  reach: number,
  timestamp: string
): EngagementMetrics {
  return { platform, likes, shares, comments, views, reachEstimate: reach, timestamp };
}

/** Create a default engagement quality assessment. */
function quality(
  botScore: number,
  realScore: number,
  passiveActive: number,
  supportAdversal: number,
  qualityScore: number
): EngagementQuality {
  return {
    botScore,
    realScore,
    passiveToActiveRatio: passiveActive,
    supportiveToAdversarialRatio: supportAdversal,
    qualityScore,
    stanceBreakdown: {
      supportive: supportAdversal > 1 ? 0.6 : 0.3,
      adversarial: supportAdversal > 1 ? 0.2 : 0.5,
      neutral: 0.2,
    },
  };
}

/** Create a default social impact score. */
function impactScore(
  score: number,
  reach: number,
  engagement: number,
  sentiment: number,
  amplification: number,
  crossPlatform: number,
  summary: string
): SocialImpactScore {
  return {
    score,
    reachScore: reach,
    engagementScore: engagement,
    sentimentScore: sentiment,
    amplificationScore: amplification,
    crossPlatformScore: crossPlatform,
    summary,
  };
}

/** Create a default amplification chain. */
function chain(
  sourceName: string,
  platform: SocialPlatform,
  reach: number,
  velocity: number,
  peakHours: number,
  botRate: number
): AmplificationChain {
  const source: AmplificationNode = {
    nodeId: `src-${sourceName.toLowerCase().replace(/\s/g, '-')}`,
    name: sourceName,
    nodeType: 'source',
    platform,
    audienceSize: Math.floor(reach * 0.01),
    amplifiedAt: '2025-04-15T08:00:00Z',
    engagement: Math.floor(reach * 0.005),
  };
  return {
    source,
    influencers: [],
    massAudience: [],
    totalReach: reach,
    velocityPerHour: velocity,
    timeToPeakHours: peakHours,
    botAmplificationRate: botRate,
  };
}

// ============================================================
// Audience Personas
// ============================================================

/** Demo audience personas for Indonesian political context. */
export const DEMO_PERSONAS: AudiencePersona[] = [
  {
    id: 'persona-jakarta-millennial',
    name: 'Urban Jakarta Millennial',
    description:
      'Tech-savvy young professional living in Greater Jakarta. Highly active on Twitter and Instagram. ' +
      'Follows politics through memes and infographics. Skeptical of traditional media but influenced by ' +
      'key opinion leaders. Concerned about cost of living, career opportunities, and environmental issues.',
    ageRange: '25-35',
    genderDistribution: '52% male, 48% female',
    incomeLevel: 'Middle class (Rp 8-20 million/month)',
    educationLevel: 'University graduate',
    platforms: ['twitter', 'instagram', 'tiktok'],
    interests: ['technology', 'startups', 'urban lifestyle', 'politics', 'K-pop', 'gaming'],
    followedInfluencers: ['Najwa Shihab', 'Gita Wirjawan', 'Fiersa Besari'],
    politicalLeaning: 'progressive',
    geography: 'Greater Jakarta (Jabodetabek)',
    mediaConsumption: 'Digital-first: Twitter threads, Instagram stories, YouTube podcasts',
    keyConcerns: [
      'Cost of living in Jakarta',
      'Job market and career growth',
      'Environmental sustainability',
      'Government transparency',
      'Digital rights and privacy',
    ],
  },
  {
    id: 'persona-rural-java',
    name: 'Rural Java Conservative',
    description:
      'Middle-aged farmer or small business owner in Central/East Java. Gets news from Facebook groups ' +
      'and WhatsApp chains. Strong religious values, respects traditional authority. Directly affected by ' +
      'agricultural policy and fuel subsidies. Trusts local religious leaders over media commentators.',
    ageRange: '40-60',
    genderDistribution: '60% male, 40% female',
    incomeLevel: 'Lower-middle class (Rp 3-7 million/month)',
    educationLevel: 'High school or pesantren',
    platforms: ['facebook', 'youtube'],
    interests: ['agriculture', 'religion', 'local politics', 'family', 'football'],
    followedInfluencers: ['Local kyai/ulama', 'Ustadz Abdul Somad'],
    politicalLeaning: 'islamic-conservative',
    geography: 'Central and East Java rural areas',
    mediaConsumption: 'Facebook groups, WhatsApp forwards, local TV news, Friday sermons',
    keyConcerns: [
      'Fuel and fertilizer prices',
      'Agricultural subsidies',
      'Islamic values in governance',
      'Land ownership rights',
      'Free school meals program quality',
    ],
  },
  {
    id: 'persona-diaspora-tech',
    name: 'Diaspora Tech Worker',
    description:
      'Indonesian tech professional working in Singapore, Australia, or the US. Follows Indonesian ' +
      'politics from abroad with both nostalgia and critical distance. Active on Twitter and Reddit. ' +
      'Sends remittances home, votes in overseas elections. Compares Indonesian governance to host country.',
    ageRange: '28-45',
    genderDistribution: '55% male, 45% female',
    incomeLevel: 'Upper-middle to high income',
    educationLevel: 'Masters degree or higher',
    platforms: ['twitter', 'reddit', 'youtube'],
    interests: [
      'technology',
      'Indonesian politics',
      'global economics',
      'startup ecosystem',
      'investment',
    ],
    followedInfluencers: ['Gita Wirjawan', 'Faisal Basri', 'Najwa Shihab'],
    politicalLeaning: 'independent',
    geography: 'Singapore, Australia, United States, Europe',
    mediaConsumption: 'English and Indonesian news online, Reddit, Twitter, podcasts',
    keyConcerns: [
      'Democratic backsliding',
      'Investment climate',
      'Tech ecosystem development',
      'Dual citizenship policies',
      'Brain drain vs return opportunities',
    ],
  },
  {
    id: 'persona-gen-z-tiktok',
    name: 'Gen-Z TikTok Native',
    description:
      'Teenager or early-twenties student who consumes almost all content through TikTok and Instagram ' +
      'Reels. Political awareness comes through viral clips and meme culture. First-time or soon-to-be ' +
      'voter. Influenced by entertainment figures who comment on politics.',
    ageRange: '16-24',
    genderDistribution: '48% male, 52% female',
    incomeLevel: 'Student / entry-level (< Rp 5 million/month)',
    educationLevel: 'High school or current university student',
    platforms: ['tiktok', 'instagram', 'youtube'],
    interests: ['music', 'fashion', 'gaming', 'memes', 'social justice', 'K-drama'],
    followedInfluencers: ['Atta Halilintar', 'Deddy Corbuzier', 'Rachel Vennya'],
    politicalLeaning: 'progressive',
    geography: 'Urban areas across Java, Bali, and Sumatra',
    mediaConsumption: 'TikTok FYP, Instagram Reels, YouTube shorts, minimal text-based news',
    keyConcerns: [
      'Education quality and affordability',
      'Job prospects after graduation',
      'Mental health awareness',
      'Social media regulation',
      'Climate change',
    ],
  },
  {
    id: 'persona-military-nationalist',
    name: 'Military-Aligned Nationalist',
    description:
      'Retired military officer, veteran, or strongly nationalist civilian. Supports strong defense ' +
      'posture and national sovereignty. Follows military-aligned media and Facebook groups. Supportive ' +
      'of Prabowo as a former military leader. Skeptical of Western criticism.',
    ageRange: '35-65',
    genderDistribution: '75% male, 25% female',
    incomeLevel: 'Middle class (military pension + side business)',
    educationLevel: 'Military academy or university',
    platforms: ['facebook', 'youtube', 'twitter'],
    interests: ['defense', 'geopolitics', 'national sovereignty', 'military history', 'patriotism'],
    followedInfluencers: ['Military commentators', 'Prabowo official channels'],
    politicalLeaning: 'military-aligned',
    geography: 'Nationwide, concentrated in Java and Sulawesi',
    mediaConsumption: 'Defense news sites, Facebook military groups, YouTube defense channels',
    keyConcerns: [
      'South China Sea sovereignty',
      'Defense modernization budget',
      'National unity and stability',
      'Foreign interference',
      'Veterans welfare',
    ],
  },
  {
    id: 'persona-business-elite',
    name: 'Business Elite & Investor',
    description:
      'Senior business executive, conglomerate heir, or institutional investor. Focused on economic ' +
      'policy, regulatory changes, and market signals. Consumes analysis from Bloomberg, Reuters, and ' +
      'local business press. Politically pragmatic — supports whoever maintains stability.',
    ageRange: '35-60',
    genderDistribution: '70% male, 30% female',
    incomeLevel: 'High income / HNWI',
    educationLevel: 'MBA or advanced degree, often from overseas',
    platforms: ['twitter', 'youtube'],
    interests: [
      'economics',
      'investment',
      'regulation',
      'real estate',
      'commodity markets',
      'golf',
    ],
    followedInfluencers: ['Chatib Basri', 'Gita Wirjawan', 'Faisal Basri'],
    politicalLeaning: 'centrist',
    geography: 'Jakarta, Surabaya, Singapore',
    mediaConsumption: 'Bloomberg, Reuters, Kontan, CNBC Indonesia, private WhatsApp groups',
    keyConcerns: [
      'Rupiah stability',
      'Tax policy changes',
      'Regulatory predictability',
      'Infrastructure investment returns',
      'IKN business opportunities',
    ],
  },
];

// ============================================================
// Influencer Profiles
// ============================================================

/** Demo influencer profiles for Indonesian social media landscape. */
export const DEMO_INFLUENCERS: InfluencerProfile[] = [
  {
    id: 'inf-najwa',
    name: 'Najwa Shihab',
    platform: 'youtube',
    followerCount: 28_000_000,
    engagementRate: 0.045,
    politicalLeaning: 'independent',
    audienceType: 'urban-middle',
    amplificationScore: 92,
    contentCategories: ['politics', 'investigative journalism', 'interviews'],
    verified: true,
    geography: 'Nationwide Indonesia',
  },
  {
    id: 'inf-deddy',
    name: 'Deddy Corbuzier',
    platform: 'youtube',
    followerCount: 22_000_000,
    engagementRate: 0.038,
    politicalLeaning: 'centrist',
    audienceType: 'urban-middle',
    amplificationScore: 85,
    contentCategories: ['entertainment', 'politics', 'lifestyle', 'interviews'],
    verified: true,
    geography: 'Nationwide Indonesia',
  },
  {
    id: 'inf-atta',
    name: 'Atta Halilintar',
    platform: 'tiktok',
    followerCount: 35_000_000,
    engagementRate: 0.052,
    politicalLeaning: 'pro-government',
    audienceType: 'youth-digital',
    amplificationScore: 78,
    contentCategories: ['entertainment', 'lifestyle', 'family'],
    verified: true,
    geography: 'Nationwide Indonesia, Malaysia',
  },
  {
    id: 'inf-gita',
    name: 'Gita Wirjawan',
    platform: 'twitter',
    followerCount: 1_200_000,
    engagementRate: 0.062,
    politicalLeaning: 'independent',
    audienceType: 'elite-policy',
    amplificationScore: 88,
    contentCategories: ['economics', 'policy', 'geopolitics', 'education'],
    verified: true,
    geography: 'Indonesia, Singapore, Global',
  },
  {
    id: 'inf-tirto',
    name: 'Tirto.id',
    platform: 'instagram',
    followerCount: 4_500_000,
    engagementRate: 0.035,
    politicalLeaning: 'independent',
    audienceType: 'urban-middle',
    amplificationScore: 75,
    contentCategories: ['infographics', 'data journalism', 'politics', 'explainers'],
    verified: true,
    geography: 'Indonesia',
  },
  {
    id: 'inf-pandji',
    name: 'Pandji Pragiwaksono',
    platform: 'twitter',
    followerCount: 2_800_000,
    engagementRate: 0.041,
    politicalLeaning: 'progressive',
    audienceType: 'urban-middle',
    amplificationScore: 70,
    contentCategories: ['comedy', 'politics', 'social commentary'],
    verified: true,
    geography: 'Jakarta, Nationwide',
  },
  {
    id: 'inf-uas',
    name: 'Ustadz Abdul Somad',
    platform: 'facebook',
    followerCount: 12_000_000,
    engagementRate: 0.055,
    politicalLeaning: 'islamic-conservative',
    audienceType: 'rural-mass',
    amplificationScore: 82,
    contentCategories: ['religion', 'politics', 'social values'],
    verified: true,
    geography: 'Sumatra, Java, Kalimantan',
  },
  {
    id: 'inf-chatib',
    name: 'Chatib Basri',
    platform: 'twitter',
    followerCount: 680_000,
    engagementRate: 0.048,
    politicalLeaning: 'centrist',
    audienceType: 'elite-policy',
    amplificationScore: 80,
    contentCategories: ['economics', 'fiscal policy', 'market analysis'],
    verified: true,
    geography: 'Indonesia, Singapore',
  },
];

// ============================================================
// Audience Segments
// ============================================================

/** Demo audience segments. */
export const DEMO_SEGMENTS: AudienceSegment[] = [
  {
    id: 'seg-urban-digital',
    name: 'Urban Digital Natives',
    description: 'Young urban Indonesians who are highly active on social media',
    estimatedSize: 45_000_000,
    shareOfAudience: 0.28,
    politicalLeaning: 'progressive',
    geography: 'Jakarta, Bandung, Surabaya, Medan',
    audienceType: 'urban-middle',
    influenceLevel: 'mid-tier',
    primaryPlatforms: ['twitter', 'instagram', 'tiktok'],
    engagementRate: 0.045,
  },
  {
    id: 'seg-rural-traditional',
    name: 'Rural Traditional Voters',
    description: 'Older rural population with traditional media consumption',
    estimatedSize: 65_000_000,
    shareOfAudience: 0.4,
    politicalLeaning: 'islamic-conservative',
    geography: 'Central Java, East Java, rural Sumatra',
    audienceType: 'rural-mass',
    influenceLevel: 'macro',
    primaryPlatforms: ['facebook', 'youtube'],
    engagementRate: 0.015,
  },
  {
    id: 'seg-elite-policy',
    name: 'Policy & Business Elite',
    description: 'Decision-makers, investors, and policy analysts',
    estimatedSize: 2_000_000,
    shareOfAudience: 0.012,
    politicalLeaning: 'centrist',
    geography: 'Jakarta, Singapore',
    audienceType: 'elite-policy',
    influenceLevel: 'mega',
    primaryPlatforms: ['twitter', 'youtube'],
    engagementRate: 0.065,
  },
  {
    id: 'seg-diaspora',
    name: 'Indonesian Diaspora',
    description: 'Indonesians living and working abroad',
    estimatedSize: 8_000_000,
    shareOfAudience: 0.05,
    politicalLeaning: 'independent',
    geography: 'Singapore, Australia, USA, Europe, Middle East',
    audienceType: 'diaspora',
    influenceLevel: 'mid-tier',
    primaryPlatforms: ['twitter', 'reddit', 'youtube'],
    engagementRate: 0.035,
  },
  {
    id: 'seg-gen-z',
    name: 'Gen-Z First-Time Voters',
    description: 'Young Indonesians who are first-time or soon-to-be voters',
    estimatedSize: 30_000_000,
    shareOfAudience: 0.18,
    politicalLeaning: 'progressive',
    geography: 'Urban areas nationwide',
    audienceType: 'youth-digital',
    influenceLevel: 'mid-tier',
    primaryPlatforms: ['tiktok', 'instagram'],
    engagementRate: 0.055,
  },
];

// ============================================================
// Demo Announcements
// ============================================================

/** Build a full platform response for an announcement. */
function platformResponse(
  platform: SocialPlatform,
  likes: number,
  shares: number,
  comments: number,
  views: number,
  sentiment: number,
  hashtags: string[],
  talkingPoints: string[],
  botScore: number
): PlatformResponse {
  return {
    platform,
    totalEngagement: metrics(
      platform,
      likes,
      shares,
      comments,
      views,
      views * 0.6,
      '2025-04-15T12:00:00Z'
    ),
    sentimentScore: sentiment,
    topHashtags: hashtags,
    talkingPoints,
    quality: quality(
      botScore,
      1 - botScore,
      likes / Math.max(comments + shares, 1),
      sentiment > 0 ? 1.5 : 0.7,
      (1 - botScore) * 100
    ),
  };
}

/** Build a default engagement pattern. */
function engagementPattern(
  type: EngagementPattern['type'],
  peakValue: number,
  peakTimestamp: string,
  decayRate: number,
  viralCoeff: number
): EngagementPattern {
  return {
    type,
    confidence: 0.85,
    peakValue,
    peakTimestamp,
    decayRate,
    halfLifeHours: decayRate > 0 ? Math.log(2) / decayRate : 48,
    viralCoefficient: viralCoeff,
    timeSeries: [],
  };
}

/** Demo announcements for Indonesian political context. */
export const DEMO_ANNOUNCEMENTS: AnnouncementTracking[] = [
  // 1. Cabinet Reshuffle
  {
    id: 'ann-cabinet-reshuffle',
    entityId: 'entity-prabowo',
    entityName: 'Prabowo Subianto',
    title: 'Prabowo Announces Major Cabinet Reshuffle',
    description:
      'President Prabowo reshuffles 6 cabinet positions, replacing underperforming ministers ' +
      'with technocrats. Key changes include new Finance Minister and Trade Minister.',
    announcedAt: '2025-04-10T06:00:00Z',
    platforms: ['twitter', 'instagram', 'tiktok', 'facebook', 'youtube'],
    platformResponses: [
      platformResponse(
        'twitter',
        45000,
        18000,
        12000,
        2500000,
        0.3,
        ['#Reshuffle2025', '#KabinetBaru', '#Prabowo'],
        ['Technocrat appointments show seriousness', 'Finally replacing dead weight'],
        0.12
      ),
      platformResponse(
        'instagram',
        120000,
        8000,
        5500,
        3200000,
        0.4,
        ['#KabinetPrabowo', '#IndonesiaMaju'],
        ['Visual explainers of new cabinet', 'Profile cards of new ministers'],
        0.08
      ),
      platformResponse(
        'tiktok',
        250000,
        35000,
        22000,
        8500000,
        0.2,
        ['#reshuffle', '#kabinet', '#prabowo'],
        ['Memes about fired ministers', 'Hot takes on new appointments'],
        0.15
      ),
      platformResponse(
        'facebook',
        85000,
        25000,
        18000,
        1800000,
        0.5,
        ['Kabinet Baru', 'Prabowo'],
        ['Community debate on choices', 'Religious leader opinions'],
        0.2
      ),
      platformResponse(
        'youtube',
        35000,
        4000,
        8000,
        4200000,
        0.35,
        ['cabinet reshuffle analysis'],
        ['Long-form analysis videos', 'Live reaction streams'],
        0.05
      ),
    ],
    engagementPattern: engagementPattern('spike-decay', 850000, '2025-04-10T14:00:00Z', 0.08, 0.85),
    impactScore: impactScore(
      78,
      85,
      72,
      65,
      80,
      90,
      'High-impact political event with strong cross-platform engagement'
    ),
    amplificationChain: chain('Presidential Palace', 'twitter', 12000000, 1500000, 8, 0.12),
    tags: ['politics', 'cabinet', 'prabowo', 'governance'],
  },
  // 2. Free School Meals Expansion
  {
    id: 'ann-free-meals',
    entityId: 'entity-prabowo',
    entityName: 'Prabowo Subianto',
    title: 'Free School Meals Program Expanded to 20 Million Students',
    description:
      'The flagship Makan Bergizi Gratis program reaches a new milestone, expanding from 15M to 20M ' +
      'students. Budget increased to Rp 95 trillion with new oversight mechanisms.',
    announcedAt: '2025-04-12T07:00:00Z',
    platforms: ['twitter', 'instagram', 'tiktok', 'facebook', 'youtube'],
    platformResponses: [
      platformResponse(
        'twitter',
        38000,
        15000,
        9500,
        1800000,
        0.5,
        ['#MakanGratis', '#AnakSehat', '#MBG'],
        ['Budget concerns vs nutrition gains', 'Procurement transparency demands'],
        0.1
      ),
      platformResponse(
        'instagram',
        180000,
        12000,
        7000,
        4500000,
        0.6,
        ['#MakanBergizi', '#IndonesiaSehat'],
        ['Before/after student health photos', 'Infographics on program reach'],
        0.06
      ),
      platformResponse(
        'tiktok',
        320000,
        45000,
        28000,
        12000000,
        0.55,
        ['#makangratis', '#sekolah'],
        ['Student reaction videos', 'Teachers showing meal quality'],
        0.08
      ),
      platformResponse(
        'facebook',
        95000,
        30000,
        22000,
        2200000,
        0.65,
        ['Makan Bergizi Gratis'],
        ['Parent testimonials', 'Local community impact stories'],
        0.15
      ),
      platformResponse(
        'youtube',
        28000,
        3500,
        6500,
        3800000,
        0.5,
        ['free meals program review'],
        ['Documentary-style coverage', 'Nutrition expert analysis'],
        0.04
      ),
    ],
    engagementPattern: engagementPattern('sustained', 650000, '2025-04-13T10:00:00Z', 0.03, 0.7),
    impactScore: impactScore(
      82,
      90,
      78,
      70,
      75,
      88,
      'Sustained positive engagement driven by human interest content'
    ),
    amplificationChain: chain('Ministry of Education', 'instagram', 15000000, 1200000, 12, 0.08),
    tags: ['social-program', 'education', 'nutrition', 'prabowo'],
  },
  // 3. IKN Nusantara Update
  {
    id: 'ann-ikn-update',
    entityId: 'entity-ikn',
    entityName: 'IKN Nusantara',
    title: 'IKN Nusantara Phase 2 Construction Begins with $15B Investment',
    description:
      'Phase 2 of the new capital city project officially launches with confirmed $15 billion in ' +
      'investment commitments from domestic and international partners.',
    announcedAt: '2025-04-05T08:00:00Z',
    platforms: ['twitter', 'instagram', 'facebook', 'youtube'],
    platformResponses: [
      platformResponse(
        'twitter',
        32000,
        14000,
        11000,
        2100000,
        -0.1,
        ['#IKN', '#Nusantara', '#IbuKotaBaru'],
        ['Cost overrun concerns', 'Environmental impact debate', 'Investor confidence signals'],
        0.18
      ),
      platformResponse(
        'instagram',
        85000,
        6000,
        4500,
        2800000,
        0.3,
        ['#IKNNusantara', '#IndonesiaBaru'],
        ['Construction progress photos', 'Architectural renders'],
        0.07
      ),
      platformResponse(
        'facebook',
        65000,
        20000,
        15000,
        1500000,
        -0.2,
        ['IKN', 'Ibu Kota Baru'],
        ['Debate on necessity vs priorities', 'Environmental concerns from Kalimantan residents'],
        0.22
      ),
      platformResponse(
        'youtube',
        22000,
        3000,
        7500,
        5200000,
        0.1,
        ['IKN construction update'],
        ['Drone footage of construction', 'Expert debates on feasibility'],
        0.05
      ),
    ],
    engagementPattern: engagementPattern('slow-burn', 420000, '2025-04-08T16:00:00Z', 0.02, 0.5),
    impactScore: impactScore(
      65,
      70,
      60,
      45,
      55,
      72,
      'Polarizing topic with sustained debate and mixed sentiment'
    ),
    amplificationChain: chain('IKN Authority', 'twitter', 8000000, 800000, 18, 0.18),
    tags: ['infrastructure', 'IKN', 'investment', 'development'],
  },
  // 4. Rupiah Crisis Response
  {
    id: 'ann-rupiah-policy',
    entityId: 'entity-bi',
    entityName: 'Bank Indonesia',
    title: 'Bank Indonesia Announces Emergency Measures to Stabilize Rupiah',
    description:
      'Bank Indonesia raises interest rates by 50bps and announces $5B intervention package ' +
      'as rupiah hits 16,800/USD. Markets react with cautious optimism.',
    announcedAt: '2025-04-08T04:00:00Z',
    platforms: ['twitter', 'facebook', 'youtube'],
    platformResponses: [
      platformResponse(
        'twitter',
        28000,
        12000,
        8500,
        1600000,
        -0.3,
        ['#Rupiah', '#BankIndonesia', '#KrisisEkonomi'],
        ['Interest rate impact on mortgages', 'Comparison to 1998 crisis', 'Investor flight risk'],
        0.08
      ),
      platformResponse(
        'facebook',
        45000,
        18000,
        14000,
        1200000,
        -0.4,
        ['Rupiah Melemah', 'BI'],
        ['Small business impact stories', 'Import cost concerns'],
        0.12
      ),
      platformResponse(
        'youtube',
        18000,
        2500,
        5500,
        3500000,
        -0.15,
        ['rupiah analysis', 'ekonomi Indonesia'],
        ['Economist explainer videos', 'Historical comparison analysis'],
        0.04
      ),
    ],
    engagementPattern: engagementPattern('spike-decay', 380000, '2025-04-08T10:00:00Z', 0.12, 0.6),
    impactScore: impactScore(
      72,
      65,
      70,
      80,
      68,
      55,
      'High sentiment intensity with fear-driven engagement spike'
    ),
    amplificationChain: chain('Bank Indonesia', 'twitter', 6000000, 1800000, 4, 0.08),
    tags: ['economics', 'currency', 'monetary-policy', 'crisis'],
  },
  // 5. South China Sea Incident
  {
    id: 'ann-scs-incident',
    entityId: 'entity-tni',
    entityName: 'TNI (Indonesian Military)',
    title: 'Indonesian Navy Confronts Chinese Coast Guard Near Natuna Islands',
    description:
      "TNI naval vessels intercept Chinese Coast Guard ships in Indonesia's EEZ near Natuna " +
      'Islands. Defense Minister calls it a "firm but measured response."',
    announcedAt: '2025-04-03T05:00:00Z',
    platforms: ['twitter', 'facebook', 'youtube', 'tiktok'],
    platformResponses: [
      platformResponse(
        'twitter',
        85000,
        42000,
        25000,
        5500000,
        0.6,
        ['#Natuna', '#NKRI', '#LautKitaSemua'],
        ['National sovereignty pride', 'Military strength display', 'ASEAN response'],
        0.25
      ),
      platformResponse(
        'facebook',
        120000,
        55000,
        35000,
        3200000,
        0.7,
        ['Natuna', 'NKRI Harga Mati'],
        ['Patriotic sentiment', 'Veterans group support', 'Boycott China calls'],
        0.3
      ),
      platformResponse(
        'youtube',
        45000,
        8000,
        12000,
        7800000,
        0.5,
        ['Natuna confrontation', 'Indonesian navy'],
        ['Naval footage analysis', 'Geopolitical expert commentary'],
        0.06
      ),
      platformResponse(
        'tiktok',
        380000,
        65000,
        40000,
        15000000,
        0.65,
        ['#natuna', '#TNI', '#NKRI'],
        ['Patriotic edits with military footage', 'Reaction videos', 'Historical context clips'],
        0.2
      ),
    ],
    engagementPattern: engagementPattern('viral-loop', 1200000, '2025-04-03T18:00:00Z', 0.05, 1.8),
    impactScore: impactScore(
      91,
      95,
      88,
      85,
      92,
      82,
      'Viral patriotic content with extremely high amplification and cross-platform spread'
    ),
    amplificationChain: chain('Ministry of Defense', 'twitter', 25000000, 3500000, 6, 0.25),
    tags: ['defense', 'geopolitics', 'sovereignty', 'china', 'natuna'],
  },
  // 6. Anti-Corruption Crackdown
  {
    id: 'ann-kpk-raid',
    entityId: 'entity-kpk',
    entityName: 'KPK (Anti-Corruption Commission)',
    title: 'KPK Arrests Provincial Governor in Major Corruption Sting',
    description:
      'KPK arrests the Governor of a major province along with 5 officials in a Rp 300 billion ' +
      'infrastructure procurement corruption case.',
    announcedAt: '2025-04-14T03:00:00Z',
    platforms: ['twitter', 'instagram', 'tiktok', 'facebook'],
    platformResponses: [
      platformResponse(
        'twitter',
        55000,
        28000,
        18000,
        3200000,
        0.4,
        ['#KPK', '#TangkapKoruptor', '#Korupsi'],
        ['Celebration of arrest', 'Demands for more action', 'Political connections analysis'],
        0.1
      ),
      platformResponse(
        'instagram',
        95000,
        9000,
        6000,
        2800000,
        0.5,
        ['#KPK', '#LawanKorupsi'],
        ['Infographic of corruption network', 'Timeline of investigation'],
        0.05
      ),
      platformResponse(
        'tiktok',
        200000,
        30000,
        18000,
        7500000,
        0.45,
        ['#kpk', '#koruptor', '#tangkap'],
        ['Arrest footage reactions', 'Satirical commentary'],
        0.12
      ),
      platformResponse(
        'facebook',
        75000,
        22000,
        16000,
        1600000,
        0.55,
        ['KPK', 'Tangkap Koruptor'],
        ['Community celebration', 'Demands for local reform'],
        0.18
      ),
    ],
    engagementPattern: engagementPattern('spike-decay', 750000, '2025-04-14T12:00:00Z', 0.06, 1.2),
    impactScore: impactScore(
      76,
      80,
      74,
      72,
      70,
      78,
      'Strong positive engagement with anti-corruption sentiment driving shares'
    ),
    amplificationChain: chain('KPK Official', 'twitter', 10000000, 2000000, 5, 0.1),
    tags: ['corruption', 'governance', 'law-enforcement', 'kpk'],
  },
  // 7. Tech Regulation
  {
    id: 'ann-digital-tax',
    entityId: 'entity-kominfo',
    entityName: 'Kominfo',
    title: 'Indonesia Announces New Digital Services Tax and Platform Regulations',
    description:
      'Ministry of Communication announces 10% digital services tax on foreign platforms and ' +
      'mandatory local data storage requirements effective Q3 2025.',
    announcedAt: '2025-04-01T07:00:00Z',
    platforms: ['twitter', 'reddit'],
    platformResponses: [
      platformResponse(
        'twitter',
        22000,
        10000,
        8000,
        1400000,
        -0.35,
        ['#PajakDigital', '#Kominfo', '#InternetBebas'],
        ['VPN usage concerns', 'Impact on startup ecosystem', 'Free speech implications'],
        0.08
      ),
      platformResponse(
        'reddit',
        8000,
        3500,
        6000,
        450000,
        -0.5,
        ['digital tax Indonesia', 'Kominfo'],
        [
          'Technical analysis of data localization',
          'Comparison with India/EU approaches',
          'Startup founder perspectives',
        ],
        0.03
      ),
    ],
    engagementPattern: engagementPattern('slow-burn', 180000, '2025-04-03T14:00:00Z', 0.015, 0.4),
    impactScore: impactScore(
      55,
      45,
      60,
      70,
      40,
      35,
      'Niche but intense negative engagement from tech community'
    ),
    amplificationChain: chain('Kominfo', 'twitter', 3000000, 300000, 24, 0.08),
    tags: ['technology', 'regulation', 'taxation', 'digital'],
  },
  // 8. Environmental Disaster
  {
    id: 'ann-kalimantan-fires',
    entityId: 'entity-klhk',
    entityName: 'KLHK (Environment Ministry)',
    title: 'Kalimantan Forest Fires Reach Emergency Levels, Government Deploys Military',
    description:
      'Forest fires in East Kalimantan reach critical levels, triggering haze across Borneo. ' +
      'Government deploys 5,000 military personnel and 20 water-bombing aircraft.',
    announcedAt: '2025-04-07T06:00:00Z',
    platforms: ['twitter', 'instagram', 'tiktok', 'facebook', 'youtube'],
    platformResponses: [
      platformResponse(
        'twitter',
        65000,
        30000,
        20000,
        3800000,
        -0.6,
        ['#KebakaranHutan', '#Haze', '#Kalimantan'],
        ['Government response criticism', 'Palm oil industry blame', 'Health impact reports'],
        0.08
      ),
      platformResponse(
        'instagram',
        140000,
        15000,
        9000,
        4200000,
        -0.4,
        ['#SaveKalimantan', '#StopBurning'],
        ['Dramatic fire photos', 'Wildlife impact images', 'Air quality data'],
        0.05
      ),
      platformResponse(
        'tiktok',
        280000,
        40000,
        25000,
        11000000,
        -0.3,
        ['#kebakaranhutan', '#kalimantan', '#haze'],
        ['Ground-level footage from locals', 'Animal rescue videos'],
        0.07
      ),
      platformResponse(
        'facebook',
        90000,
        35000,
        28000,
        2000000,
        -0.5,
        ['Kebakaran Hutan Kalimantan'],
        ['Local community distress', 'Donation drive organization'],
        0.12
      ),
      platformResponse(
        'youtube',
        32000,
        5000,
        9500,
        5800000,
        -0.35,
        ['Kalimantan fires documentary'],
        ['Drone footage of devastation', 'Expert interviews on causes'],
        0.04
      ),
    ],
    engagementPattern: engagementPattern('sustained', 950000, '2025-04-09T12:00:00Z', 0.025, 1.1),
    impactScore: impactScore(
      85,
      88,
      82,
      78,
      80,
      90,
      'Sustained high engagement with strong emotional content driving cross-platform virality'
    ),
    amplificationChain: chain('Local journalists', 'twitter', 18000000, 1500000, 10, 0.08),
    tags: ['environment', 'disaster', 'kalimantan', 'haze', 'military'],
  },
  // 9. Infrastructure Milestone
  {
    id: 'ann-mrt-extension',
    entityId: 'entity-jakarta',
    entityName: 'DKI Jakarta',
    title: 'Jakarta MRT Phase 3 Extension Approved with Japanese Funding',
    description:
      'Jakarta MRT Phase 3 connecting Kota Tua to Ancol receives green light with ¥200 billion ' +
      'Japanese ODA loan. Expected completion by 2028.',
    announcedAt: '2025-04-11T09:00:00Z',
    platforms: ['twitter', 'instagram', 'facebook'],
    platformResponses: [
      platformResponse(
        'twitter',
        18000,
        7000,
        4500,
        900000,
        0.6,
        ['#MRTJakarta', '#TransportasiPublik'],
        ['Route analysis threads', 'Property value impact discussion'],
        0.06
      ),
      platformResponse(
        'instagram',
        55000,
        4000,
        2800,
        1800000,
        0.65,
        ['#MRTJakarta', '#JakartaMaju'],
        ['Route map infographics', 'Station design renders'],
        0.04
      ),
      platformResponse(
        'facebook',
        35000,
        10000,
        6000,
        800000,
        0.55,
        ['MRT Jakarta Phase 3'],
        ['Commuter excitement', 'Comparison with other cities'],
        0.1
      ),
    ],
    engagementPattern: engagementPattern('slow-burn', 150000, '2025-04-12T14:00:00Z', 0.02, 0.35),
    impactScore: impactScore(
      52,
      48,
      55,
      70,
      35,
      50,
      'Moderate positive engagement concentrated in Jakarta audience'
    ),
    amplificationChain: chain('DKI Jakarta Gov', 'instagram', 4000000, 350000, 16, 0.06),
    tags: ['infrastructure', 'transport', 'jakarta', 'japan'],
  },
  // 10. Religious Controversy
  {
    id: 'ann-dress-code',
    entityId: 'entity-kemendikbud',
    entityName: 'Ministry of Education',
    title: 'Education Ministry Reverses Mandatory Hijab Policy in Public Schools',
    description:
      'Ministry issues circular banning mandatory religious dress codes in public schools, ' +
      'sparking fierce debate between progressive and conservative groups.',
    announcedAt: '2025-04-13T05:00:00Z',
    platforms: ['twitter', 'instagram', 'tiktok', 'facebook', 'youtube'],
    platformResponses: [
      platformResponse(
        'twitter',
        95000,
        55000,
        45000,
        6200000,
        0.1,
        ['#KebebasanBeragama', '#HijabBukanPaksaan', '#SekolahNegeri'],
        [
          'Constitutional rights arguments',
          'Religious freedom debate',
          'Pluralism vs conservative values',
        ],
        0.15
      ),
      platformResponse(
        'instagram',
        110000,
        8500,
        7000,
        3500000,
        0.2,
        ['#Toleransi', '#BhinekaTunggalIka'],
        ['Pro-tolerance infographics', 'Counter-arguments from both sides'],
        0.06
      ),
      platformResponse(
        'tiktok',
        350000,
        60000,
        42000,
        14000000,
        -0.1,
        ['#hijab', '#sekolah', '#toleransi'],
        ['Heated debate duets', 'Personal story shares from both sides'],
        0.18
      ),
      platformResponse(
        'facebook',
        130000,
        45000,
        38000,
        2800000,
        -0.4,
        ['Hijab Sekolah', 'Kebebasan Beragama'],
        ['Religious community backlash', 'Conservative group mobilization'],
        0.25
      ),
      platformResponse(
        'youtube',
        40000,
        6000,
        15000,
        5500000,
        0.05,
        ['hijab school policy debate'],
        ['Panel discussions', 'Street interview reactions'],
        0.05
      ),
    ],
    engagementPattern: engagementPattern('viral-loop', 1100000, '2025-04-13T16:00:00Z', 0.04, 2.1),
    impactScore: impactScore(
      89,
      92,
      85,
      90,
      88,
      85,
      'Extremely polarizing content with viral spread and high adversarial engagement'
    ),
    amplificationChain: chain('Ministry of Education', 'twitter', 22000000, 4000000, 4, 0.2),
    tags: ['religion', 'education', 'culture-war', 'policy'],
  },
];
