// ============================================================
// LOOM — Indonesian Sentiment Demo Data
//
// Rich demo dataset covering the Prabowo administration's first
// months, IKN development, economic policy, and regional geopolitics.
// Designed to showcase source-weighted sentiment analysis.
// ============================================================

import type { ArticleInput } from '../sentiment-engine.js';

/**
 * Demo articles simulating Indonesian news coverage across multiple
 * sources with different biases and perspectives.
 *
 * Covers: Prabowo's first 100 days, IKN (new capital), economic reforms,
 * South China Sea tensions, anti-corruption developments, and tech policy.
 */
export const INDONESIA_DEMO_ARTICLES: ArticleInput[] = [
  // ============================================================
  // PRABOWO ADMINISTRATION — First 100 Days
  // ============================================================

  // Pro-government source — positive framing (expected → low signal)
  {
    title: 'Prabowo Marks 100 Days with Strong Approval Ratings',
    content:
      'President Prabowo Subianto celebrated his first 100 days in office with approval ratings ' +
      'exceeding 70%, according to multiple polling agencies. The government highlighted achievements ' +
      'in defense modernization, the free school meals program reaching 15 million students, and ' +
      'progress on the Nusantara capital city project. "This is a strong mandate from the people," ' +
      'said the Presidential spokesperson. Economic growth held steady at 5.1%, and foreign investment ' +
      'commitments reached $12 billion for the quarter. The cabinet reshuffle successfully brought in ' +
      'technocrats for key economic ministries.',
    sourceId: 'antara',
    publishedAt: '2025-04-15T08:00:00Z',
    language: 'id',
  },

  // Independent/opposition source — positive framing (unexpected → HIGH signal!)
  {
    title: "Prabowo's Free Meal Program Shows Early Promise, Though Questions Remain",
    content:
      "An independent audit of the government's flagship free school meals program found that " +
      'nutrition levels among participating students improved measurably in the first three months. ' +
      "Stunting indicators showed a 2.3% improvement in pilot districts. However, Tempo's investigation " +
      'found procurement irregularities in three provinces and concerns about vendor selection processes. ' +
      "Education ministry officials defended the program's progress while acknowledging the need for " +
      'stronger oversight. The program budget of Rp 71 trillion represents the largest social spending ' +
      'commitment in Indonesian history.',
    sourceId: 'tempo',
    publishedAt: '2025-04-16T10:00:00Z',
    language: 'id',
  },

  // Critical investigative source
  {
    title: "Behind the Numbers: What Prabowo's 100-Day Report Card Leaves Out",
    content:
      'While the government celebrates strong approval ratings, several key metrics paint a more ' +
      'nuanced picture. The rupiah weakened 4.2% against the dollar since inauguration. ' +
      'The promised "immediate food self-sufficiency" program has stalled due to land reform ' +
      'complications. Defense spending increased 22% while education and health budgets grew only 3%. ' +
      'Critics warn that the concentration of power in the presidency, with Prabowo appointing ' +
      'military allies to civilian posts, risks democratic backsliding. Civil society organizations ' +
      'report increased pressure on media and NGOs.',
    sourceId: 'tempo',
    publishedAt: '2025-04-17T06:00:00Z',
    language: 'id',
  },

  // Mass market digital — neutral
  {
    title: 'Makan Gratis: Ini Menu dan Jadwal Program Makan Bergizi di Sekolah Anda',
    content:
      'Program makan bergizi gratis yang diluncurkan Presiden Prabowo Subianto telah menjangkau ' +
      '15 juta siswa di seluruh Indonesia. Menu harian mencakup nasi, protein (ayam/ikan/telur), ' +
      'sayuran, dan buah. Berikut jadwal dan menu lengkap untuk minggu depan di wilayah Jakarta, ' +
      'Surabaya, Medan, dan Makassar. Orangtua murid di Bekasi mengaku senang dengan program ini. ' +
      '"Anak saya sekarang semangat pergi ke sekolah," kata Ibu Siti, wali murid SDN 5.',
    sourceId: 'detik',
    publishedAt: '2025-04-18T09:00:00Z',
    language: 'id',
  },

  // English-language international audience
  {
    title: 'Indonesia Under Prabowo: Defense Hawks Rise as Reformers Worry',
    content:
      "Three months into the Prabowo presidency, Indonesia's foreign policy has taken a notably more " +
      'assertive turn. The new government has announced a $125 billion defense procurement plan, the ' +
      'largest in Southeast Asian history, including fighter jets from France and submarines from South Korea. ' +
      'The diplomatic corps is concerned about the appointment of former military officers to ambassadorial ' +
      'positions in key capitals. Human rights groups have flagged the rehabilitation of military figures ' +
      "linked to past abuses. However, Prabowo's recent address at the UN General Assembly was praised " +
      'for its pragmatic tone on climate and South-South cooperation.',
    sourceId: 'jakarta-post',
    publishedAt: '2025-04-19T07:00:00Z',
    language: 'en',
  },

  // ============================================================
  // IKN (NUSANTARA CAPITAL) — Development Progress
  // ============================================================

  {
    title: 'IKN Phase 1 Construction 67% Complete, Government Claims On Track',
    content:
      'The Nusantara Capital Authority reported that Phase 1 construction of the new capital city ' +
      'is 67% complete, with the Presidential Palace, core government complex, and main transportation ' +
      'corridor nearing completion. "We are confident that the first batch of government ministries ' +
      'will relocate by Q3 2025," said the IKN Authority chief. Investment commitments from Japanese, ' +
      'Korean, and Middle Eastern developers total $28 billion. However, infrastructure contractors ' +
      'privately express concerns about payment delays.',
    sourceId: 'antara',
    publishedAt: '2025-03-20T08:00:00Z',
    language: 'id',
  },

  {
    title: 'Tempo Investigation: IKN Environmental Impact Far Worse Than Official Reports',
    content:
      'A six-month investigation by Tempo reveals that deforestation around the IKN site has ' +
      'exceeded government estimates by 340%. Satellite imagery shows 12,000 hectares of Borneo ' +
      'rainforest cleared beyond the original project footprint, including habitat for endangered ' +
      'orangutans. Water quality in the Mahakam river delta has deteriorated significantly. Indigenous ' +
      'Balik communities report losing access to ancestral lands without adequate compensation. ' +
      'The Environmental Ministry dismissed the findings as "methodologically flawed" but declined ' +
      'to provide their own satellite data. This investigation raises serious questions about the ' +
      "environmental cost of Indonesia's most ambitious infrastructure project.",
    sourceId: 'tempo',
    publishedAt: '2025-03-25T06:00:00Z',
    language: 'id',
  },

  {
    title: 'Softbank, Hyundai Confirm Major IKN Investments in Smart City Tech',
    content:
      'Softbank Vision Fund and Hyundai Motor Group announced combined investments of $3.2 billion ' +
      "in Nusantara's smart city infrastructure. The partnership will deploy autonomous shuttles, " +
      'AI-powered traffic management, and a city-wide IoT sensor network. "Nusantara will be the ' +
      'most digitally integrated capital city in the world," said the IKN Digital Director. The ' +
      'investment signals growing international confidence in the project despite persistent domestic ' +
      "skepticism about timelines and costs. Indonesia's digital economy grew 20% last year, reaching " +
      '$82 billion in gross merchandise value.',
    sourceId: 'cnn-indonesia',
    publishedAt: '2025-04-01T10:00:00Z',
    language: 'id',
  },

  // ============================================================
  // ECONOMIC POLICY
  // ============================================================

  {
    title: 'Bank Indonesia Holds Rate Steady as Rupiah Stabilizes',
    content:
      'Bank Indonesia held its benchmark interest rate at 6.25% for the third consecutive month, ' +
      'citing stabilizing inflation at 2.8% and improved current account balance. The rupiah traded ' +
      'at Rp 15,850 per dollar, recovering from its recent low of Rp 16,200. Governor Perry Warjiyo ' +
      'noted that foreign reserve buffers remain "ample" at $142 billion. However, the central bank ' +
      "warned about external risks from potential US tariff escalation and China's economic slowdown. " +
      'Consumer confidence index rose to 128.5, the highest in 18 months.',
    sourceId: 'kompas',
    publishedAt: '2025-04-10T09:00:00Z',
    language: 'id',
  },

  {
    title: "Indonesia's Sovereign Wealth Fund Posts Record Returns",
    content:
      'The Indonesia Investment Authority (INA) reported a 15.3% return on its managed assets in ' +
      '2024, with total assets under management reaching $26 billion. Key wins included nickel ' +
      'downstream processing facilities, digital infrastructure partnerships, and a landmark deal ' +
      "to co-invest with Abu Dhabi's ADQ in renewable energy. The fund's success has attracted " +
      "attention from global institutional investors seeking exposure to Indonesia's growth story. " +
      'INA plans to reach $100 billion in AUM by 2030.',
    sourceId: 'jakarta-post',
    publishedAt: '2025-04-05T08:00:00Z',
    language: 'en',
  },

  {
    title: 'Harga Beras Naik 12% — Petani Untung, Konsumen Mengeluh',
    content:
      'Harga beras premium di pasar Jakarta melonjak 12% dalam sebulan terakhir, mencapai ' +
      'Rp 16.500 per kilogram. Kementerian Perdagangan menyebut kenaikan disebabkan musim ' +
      'kemarau panjang dan kenaikan biaya distribusi. Sementara petani di Jawa Barat mengaku ' +
      'diuntungkan, konsumen urban mengeluh biaya hidup yang terus meningkat. "Ini sudah terlalu ' +
      'mahal untuk keluarga kecil," kata warga Tangerang. Program stabilisasi harga pemerintah ' +
      'dinilai lambat merespons. Inflasi makanan menjadi concern utama bagi Bank Indonesia.',
    sourceId: 'tribunnews',
    publishedAt: '2025-04-08T07:00:00Z',
    language: 'id',
  },

  // ============================================================
  // SOUTH CHINA SEA / GEOPOLITICS
  // ============================================================

  {
    title: 'Indonesia Scrambles Jets After Chinese Coast Guard Incursion Near Natuna',
    content:
      'The Indonesian Air Force scrambled F-16 fighter jets after Chinese Coast Guard vessels ' +
      "entered Indonesia's exclusive economic zone near the Natuna Islands for the third time this " +
      'year. TNI Commander General Agus Subiyanto described the incursion as "unacceptable" and ' +
      "announced enhanced naval patrols in the area. China's Foreign Ministry maintained that the " +
      'waters fall within its "traditional fishing grounds." The incident comes weeks after Indonesia ' +
      'signed a $4.5 billion defense deal with France for Rafale fighters, widely seen as a signal ' +
      "of Jakarta's determination to defend its maritime sovereignty.",
    sourceId: 'kompas',
    publishedAt: '2025-04-12T05:00:00Z',
    language: 'id',
  },

  {
    title:
      'Prabowo\'s "Active-Active" Diplomacy: Walking the Tightrope Between Beijing and Washington',
    content:
      'President Prabowo\'s foreign policy doctrine of "active-active" diplomacy — maintaining strong ' +
      'ties with both the US and China — faces its biggest test. Washington is pushing for Indonesia ' +
      'to join its Indo-Pacific security architecture, while Beijing offers $15 billion in Belt and Road ' +
      "infrastructure loans. Indonesia's nickel processing industry, which supplies 50% of global " +
      'production, makes the country a critical player in both the EV supply chain and great power ' +
      'competition. Analysts warn that the window for true non-alignment is narrowing as US-China ' +
      "tensions escalate. ASEAN's unity is tested as member states diverge on South China Sea policies.",
    sourceId: 'jakarta-post',
    publishedAt: '2025-04-20T08:00:00Z',
    language: 'en',
  },

  // ============================================================
  // ANTI-CORRUPTION / GOVERNANCE
  // ============================================================

  {
    title: 'KPK Under Fire: Anti-Corruption Body Quietly Drops Investigation Into Cabinet Member',
    content:
      'The Corruption Eradication Commission (KPK) has quietly terminated its investigation into ' +
      'allegations of procurement fraud involving a senior cabinet minister, Tempo has learned. ' +
      'The case, which involved a Rp 2.3 trillion infrastructure contract, was shelved after what ' +
      'sources describe as "pressure from above." KPK leadership appointed under the new administration ' +
      'has been criticized by anti-corruption activists for a noticeable decline in high-profile ' +
      'prosecutions. Indonesia Corruption Watch reported a 45% drop in investigations targeting ' +
      'politically connected figures since the change in government. "The KPK is being systematically ' +
      'defanged," warned ICW coordinator Adnan Topan.',
    sourceId: 'tempo',
    publishedAt: '2025-04-22T06:00:00Z',
    language: 'id',
  },

  {
    title: 'Pemerintah Bentuk Satgas Anti-Mafia Tanah untuk Lindungi Investasi',
    content:
      'Presiden Prabowo membentuk Satuan Tugas Anti-Mafia Tanah untuk mengatasi sengketa lahan ' +
      'yang menghambat investasi. Tim ini akan dipimpin langsung oleh Kementerian ATR/BPN dengan ' +
      'dukungan TNI dan Polri. "Investor harus merasa aman," kata Menteri ATR. Langkah ini disambut ' +
      'positif oleh asosiasi pengembang properti. Namun, koalisi masyarakat adat mengkhawatirkan ' +
      'satgas ini akan digunakan untuk memaksa pembebasan tanah adat demi kepentingan korporasi. ' +
      'BPN melaporkan 12.000 sengketa tanah aktif di seluruh Indonesia.',
    sourceId: 'media-indonesia',
    publishedAt: '2025-04-23T09:00:00Z',
    language: 'id',
  },

  // ============================================================
  // DIGITAL ECONOMY / TECH
  // ============================================================

  {
    title:
      "GoTo Group Reports First-Ever Annual Profit, Signaling Maturation of Indonesia's Tech Sector",
    content:
      "GoTo Group, Indonesia's largest tech company, reported its first annual profit of $48 million " +
      "for fiscal year 2024, a landmark moment for Southeast Asia's startup ecosystem. Revenue grew " +
      "28% to $2.1 billion, driven by ride-hailing, e-commerce, and fintech divisions. The company's " +
      'GoPay financial services arm now processes $35 billion in annual transactions. "This proves ' +
      'the Indonesian digital economy model works," said CEO Patrick Walujo. The IHSG composite index ' +
      'rose 2.3% on the news. Analysts predict Indonesia will produce its first $100 billion tech ' +
      'company by 2028.',
    sourceId: 'kompas',
    publishedAt: '2025-04-14T08:00:00Z',
    language: 'id',
  },

  {
    title: 'Pemerintah Wajibkan Data Center Lokal untuk Semua Platform Digital',
    content:
      'Kementerian Komunikasi dan Informatika (Kominfo) menerbitkan regulasi baru yang mewajibkan ' +
      'seluruh platform digital dengan lebih dari 1 juta pengguna Indonesia untuk menyimpan data ' +
      'pengguna di data center lokal mulai 2026. Google, Meta, dan TikTok diberikan waktu 12 bulan ' +
      'untuk comply. Industri tech global mengecam kebijakan ini sebagai "data protectionism" yang ' +
      'akan menaikkan biaya operasi. Di sisi lain, perusahaan data center lokal seperti DCI Indonesia ' +
      'dan EdgeConneX menyambut regulasi ini sebagai peluang pertumbuhan. Kominfo berdalih kedaulatan ' +
      'data dan keamanan nasional.',
    sourceId: 'kumparan',
    publishedAt: '2025-04-25T10:00:00Z',
    language: 'id',
  },

  // ============================================================
  // ISLAMIC / SOCIAL ISSUES
  // ============================================================

  {
    title: 'MUI Tolak RUU Perlindungan Pekerja Rumah Tangga, Sebut Bertentangan dengan Nilai Islam',
    content:
      'Majelis Ulama Indonesia (MUI) mengeluarkan fatwa menolak beberapa pasal dalam RUU Perlindungan ' +
      'Pekerja Rumah Tangga yang sedang dibahas di DPR. MUI menilai ketentuan tentang jam kerja dan ' +
      'upah minimum untuk pekerja domestik "bertentangan dengan konsep kekeluargaan dalam Islam." ' +
      'Aktivis hak buruh dan organisasi perempuan menolak keras posisi MUI. "Ini bukan soal agama, ' +
      'ini soal eksploitasi," kata koordinator Jaringan Nasional Advokasi PRT. Indonesia memiliki ' +
      'sekitar 10 juta pekerja rumah tangga, mayoritas perempuan, yang hingga kini tidak memiliki ' +
      'perlindungan hukum yang memadai.',
    sourceId: 'republika',
    publishedAt: '2025-04-21T07:00:00Z',
    language: 'id',
  },

  // ============================================================
  // ENVIRONMENTAL / DISASTER
  // ============================================================

  {
    title: 'Banjir Besar di Semarang: 50.000 Warga Mengungsi, Gubernur Minta Bantuan Pusat',
    content:
      'Banjir dahsyat melanda Kota Semarang dan sekitarnya setelah hujan deras selama 72 jam. ' +
      'Sedikitnya 50.000 warga mengungsi, 12 orang meninggal, dan kerugian material diperkirakan ' +
      'mencapai Rp 3 triliun. Gubernur Jawa Tengah meminta bantuan dana darurat dari pemerintah pusat. ' +
      'BPBD mencatat ini sebagai bencana banjir terparah di Semarang dalam 20 tahun. Aktivis ' +
      'lingkungan menunjuk pembangunan masif di daerah resapan air sebagai penyebab utama. ' +
      '"Ini bukan bencana alam, ini bencana kebijakan," kata Walhi Jawa Tengah.',
    sourceId: 'detik',
    publishedAt: '2025-03-28T05:00:00Z',
    language: 'id',
  },

  // ============================================================
  // DEFENSE / MILITARY
  // ============================================================

  {
    title: 'Indonesia Signs Historic $7.1B Defense Deal Package with France and South Korea',
    content:
      'Indonesia finalized a landmark defense procurement package worth $7.1 billion, including ' +
      "42 Rafale fighter jets from France's Dassault Aviation and 3 Chang Bogo-class submarines " +
      "from South Korea's Hyundai Heavy Industries. The deal includes technology transfer agreements " +
      'and local production components at PT Dirgantara Indonesia and PT PAL. President Prabowo, who ' +
      'personally negotiated the terms, called it "a new era for Indonesian defense sovereignty." ' +
      'The deal makes Indonesia the largest defense buyer in Southeast Asia. Critics argue the money ' +
      'would be better spent on education and healthcare. Defense analysts note the strategic ' +
      'significance of Rafale capabilities for South China Sea patrol operations.',
    sourceId: 'jakarta-post',
    publishedAt: '2025-04-03T07:00:00Z',
    language: 'en',
  },

  // Additional articles for depth
  {
    title: 'Menteri Keuangan: Defisit APBN Masih Terkendali di 2,4% PDB',
    content:
      'Menteri Keuangan Sri Mulyani Indrawati menyatakan defisit APBN 2025 masih terkendali di ' +
      'level 2,4% dari PDB, di bawah batas konstitusional 3%. Belanja negara meningkat signifikan ' +
      'karena program makan bergizi gratis dan modernisasi pertahanan, namun penerimaan pajak juga ' +
      'tumbuh 8,2% berkat reformasi administrasi perpajakan. Rating sovereign Indonesia dipertahankan ' +
      'di BBB oleh Fitch dan S&P. "Fiskal kita sehat," kata Sri Mulyani dalam konferensi pers.',
    sourceId: 'kompas',
    publishedAt: '2025-04-11T08:00:00Z',
    language: 'id',
  },

  {
    title: 'Jokowi Diam Soal Kebijakan Prabowo, Publik Bertanya-tanya',
    content:
      'Mantan Presiden Joko Widodo tetap diam mengenai berbagai kebijakan kontroversial pemerintahan ' +
      'Prabowo, meskipun putranya Gibran menjabat sebagai Wakil Presiden. Pengamat politik menilai ' +
      'sikap diam Jokowi bisa ditafsirkan sebagai dukungan implisit atau strategi politik jangka panjang. ' +
      '"Jokowi sedang menunggu momen yang tepat," kata pengamat dari CSIS. Sementara itu, basis ' +
      'pendukung Jokowi mulai terpecah antara yang mendukung koalisi Prabowo-Gibran dan yang kritis ' +
      'terhadap arah baru pemerintahan.',
    sourceId: 'kumparan',
    publishedAt: '2025-04-24T09:00:00Z',
    language: 'id',
  },

  {
    title: 'Rupiah Tembus Rp 16.000: BI Intervensi, Pasar Tetap Gelisah',
    content:
      'Rupiah melemah tajam menembus level Rp 16.000 per dolar AS untuk pertama kalinya sejak ' +
      'pandemi COVID-19. Bank Indonesia melakukan intervensi di pasar spot dan NDF namun tekanan ' +
      'jual tetap kuat. Analis menunjuk kombinasi penguatan dolar global, defisit neraca berjalan ' +
      'yang melebar, dan ketidakpastian kebijakan fiskal sebagai penyebab utama. IHSG anjlok 3,2% ' +
      'dalam sehari, menghapus Rp 180 triliun kapitalisasi pasar. Asosiasi importir memperingatkan ' +
      'kenaikan harga barang impor yang akan memicu inflasi lebih lanjut.',
    sourceId: 'kompas',
    publishedAt: '2025-04-26T06:00:00Z',
    language: 'id',
  },
];
