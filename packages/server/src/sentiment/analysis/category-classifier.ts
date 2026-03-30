// ============================================================
// LOOM — Category Classifier
//
// Classifies articles into event categories using keyword
// matching with Bahasa Indonesia and English support.
// ============================================================

import type { EventCategory } from '../types.js';

/** Keywords for each category (English + Bahasa Indonesia). */
const CATEGORY_KEYWORDS: Record<EventCategory, string[]> = {
  political: [
    'election',
    'president',
    'parliament',
    'coalition',
    'party',
    'minister',
    'cabinet',
    'policy',
    'government',
    'governor',
    'mayor',
    'political',
    'pemilu',
    'presiden',
    'parlemen',
    'koalisi',
    'partai',
    'menteri',
    'kabinet',
    'kebijakan',
    'pemerintah',
    'gubernur',
    'walikota',
    'politik',
    'DPR',
    'MPR',
    'pilkada',
    'prabowo',
    'jokowi',
  ],
  economic: [
    'economy',
    'GDP',
    'inflation',
    'trade',
    'investment',
    'market',
    'stock',
    'bank',
    'currency',
    'rupiah',
    'export',
    'import',
    'fiscal',
    'budget',
    'tax',
    'growth',
    'ekonomi',
    'PDB',
    'inflasi',
    'perdagangan',
    'investasi',
    'pasar',
    'saham',
    'mata uang',
    'ekspor',
    'impor',
    'fiskal',
    'anggaran',
    'pajak',
    'pertumbuhan',
    'IHSG',
    'Bank Indonesia',
    'OJK',
  ],
  regulatory: [
    'regulation',
    'law',
    'legislation',
    'compliance',
    'license',
    'permit',
    'standard',
    'ban',
    'restriction',
    'mandate',
    'decree',
    'ordinance',
    'framework',
    'regulasi',
    'undang-undang',
    'peraturan',
    'izin',
    'larangan',
    'kebijakan',
    'keputusan',
    'perpres',
    'permen',
    'omnibus',
    'cipta kerja',
  ],
  social: [
    'education',
    'health',
    'poverty',
    'welfare',
    'community',
    'culture',
    'religion',
    'minority',
    'rights',
    'protest',
    'demonstration',
    'labor',
    'wage',
    'pendidikan',
    'kesehatan',
    'kemiskinan',
    'kesejahteraan',
    'budaya',
    'agama',
    'hak',
    'demonstrasi',
    'buruh',
    'upah',
    'sosial',
    'masyarakat',
  ],
  technology: [
    'technology',
    'digital',
    'AI',
    'startup',
    'internet',
    'cyber',
    'innovation',
    'data',
    'platform',
    'app',
    'fintech',
    'e-commerce',
    'blockchain',
    'teknologi',
    'digital',
    'inovasi',
    'siber',
    'aplikasi',
    'unicorn',
  ],
  military: [
    'military',
    'defense',
    'army',
    'navy',
    'air force',
    'weapons',
    'security',
    'TNI',
    'militer',
    'pertahanan',
    'tentara',
    'keamanan',
    'senjata',
    'alutsista',
    'Polri',
    'Kopassus',
    'Kostrad',
  ],
  diplomatic: [
    'diplomatic',
    'foreign',
    'bilateral',
    'ASEAN',
    'UN',
    'treaty',
    'ambassador',
    'summit',
    'alliance',
    'sanctions',
    'G20',
    'diplomatik',
    'luar negeri',
    'bilateral',
    'duta besar',
    'KTT',
    'kerjasama',
  ],
  environmental: [
    'environment',
    'climate',
    'forest',
    'pollution',
    'emission',
    'deforestation',
    'flood',
    'earthquake',
    'disaster',
    'conservation',
    'green',
    'carbon',
    'lingkungan',
    'iklim',
    'hutan',
    'polusi',
    'emisi',
    'banjir',
    'gempa',
    'bencana',
    'konservasi',
    'sawit',
    'kebakaran hutan',
  ],
  corruption: [
    'corruption',
    'bribe',
    'embezzle',
    'fraud',
    'scandal',
    'kickback',
    'graft',
    'money laundering',
    'nepotism',
    'abuse of power',
    'korupsi',
    'suap',
    'koruptor',
    'KPK',
    'penggelapan',
    'skandal',
    'pencucian uang',
    'nepotisme',
    'penyalahgunaan',
  ],
  infrastructure: [
    'infrastructure',
    'construction',
    'road',
    'bridge',
    'port',
    'airport',
    'rail',
    'IKN',
    'capital',
    'building',
    'project',
    'toll',
    'infrastruktur',
    'pembangunan',
    'jalan',
    'jembatan',
    'pelabuhan',
    'bandara',
    'kereta',
    'proyek',
    'tol',
    'nusantara',
  ],
  education: [
    'university',
    'school',
    'student',
    'teacher',
    'curriculum',
    'research',
    'scholarship',
    'academic',
    'universitas',
    'sekolah',
    'siswa',
    'guru',
    'kurikulum',
    'penelitian',
    'beasiswa',
    'akademik',
    'kampus',
  ],
  health: [
    'hospital',
    'vaccine',
    'pandemic',
    'disease',
    'medicine',
    'doctor',
    'health',
    'WHO',
    'outbreak',
    'rumah sakit',
    'vaksin',
    'pandemi',
    'penyakit',
    'obat',
    'dokter',
    'kesehatan',
    'BPJS',
    'wabah',
  ],
};

/**
 * Classify an article into an event category.
 * Returns the category with the highest keyword match density.
 *
 * @param title - Article title
 * @param content - Article content
 * @returns Classified category and confidence score
 */
export function classifyCategory(
  title: string,
  content: string
): { category: EventCategory; confidence: number; subcategory?: string } {
  const text = `${title} ${title} ${content}`.toLowerCase(); // title weighted 2x

  const scores: Array<{ category: EventCategory; score: number }> = [];

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS) as Array<
    [EventCategory, string[]]
  >) {
    let hits = 0;
    for (const keyword of keywords) {
      if (text.includes(keyword.toLowerCase())) {
        hits++;
        // Extra weight for title matches
        if (title.toLowerCase().includes(keyword.toLowerCase())) {
          hits += 2;
        }
      }
    }

    scores.push({ category, score: hits });
  }

  scores.sort((a, b) => b.score - a.score);

  const best = scores[0];
  const totalHits = scores.reduce((s, sc) => s + sc.score, 0);

  // Confidence based on how dominant the top category is
  const confidence = totalHits > 0 ? best.score / totalHits : 0.1;

  return {
    category: best.score > 0 ? best.category : 'political', // default fallback
    confidence: Math.min(confidence, 0.95),
  };
}

/**
 * Get all categories with their scores for an article.
 * Useful for multi-label classification.
 */
export function classifyAllCategories(
  title: string,
  content: string
): Array<{ category: EventCategory; score: number }> {
  const text = `${title} ${title} ${content}`.toLowerCase();

  const scores: Array<{ category: EventCategory; score: number }> = [];

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS) as Array<
    [EventCategory, string[]]
  >) {
    let hits = 0;
    for (const keyword of keywords) {
      if (text.includes(keyword.toLowerCase())) {
        hits++;
      }
    }
    if (hits > 0) {
      scores.push({ category, score: hits });
    }
  }

  return scores.sort((a, b) => b.score - a.score);
}
