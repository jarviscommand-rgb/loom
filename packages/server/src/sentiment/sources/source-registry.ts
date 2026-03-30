// ============================================================
// LOOM — Source Registry
//
// Configurable registry of media sources with lookup, filtering,
// and management capabilities. Sources are loaded from country
// profile modules and can be dynamically added/updated.
// ============================================================

import type { MediaSource, BiasDirection, AudienceType, PoliticalLeaning } from '../types.js';
import { INDONESIA_SOURCES } from './profiles/indonesia.js';

/**
 * Central registry for all media source profiles.
 * Provides lookup, filtering, and CRUD operations.
 */
export class SourceRegistry {
  private sources: Map<string, MediaSource> = new Map();

  constructor() {
    // Load default source profiles
    this.loadCountryProfiles();
  }

  /** Load all pre-configured country profiles. */
  private loadCountryProfiles(): void {
    for (const source of INDONESIA_SOURCES) {
      this.sources.set(source.id, { ...source });
    }
  }

  // --- Lookup ---

  /** Get a source by its unique ID. */
  getById(id: string): MediaSource | undefined {
    return this.sources.get(id);
  }

  /** Get all registered sources. */
  getAll(): MediaSource[] {
    return Array.from(this.sources.values());
  }

  /** Get all active sources (enabled for ingestion). */
  getActive(): MediaSource[] {
    return this.getAll().filter((s) => s.active);
  }

  /** Get sources for a specific country. */
  getByCountry(countryCode: string): MediaSource[] {
    return this.getAll().filter((s) => s.country === countryCode);
  }

  // --- Filtering ---

  /** Filter sources by bias direction. */
  filterByBias(direction: BiasDirection): MediaSource[] {
    return this.getAll().filter((s) => s.biasDirection === direction);
  }

  /** Filter sources by political leaning. */
  filterByLeaning(leaning: PoliticalLeaning): MediaSource[] {
    return this.getAll().filter((s) => s.politicalLeaning === leaning);
  }

  /** Filter sources by audience type. */
  filterByAudience(audience: AudienceType): MediaSource[] {
    return this.getAll().filter((s) => s.audienceTypes.includes(audience));
  }

  /** Filter sources by minimum reliability score. */
  filterByReliability(minScore: number): MediaSource[] {
    return this.getAll().filter((s) => s.reliabilityScore >= minScore);
  }

  /** Filter sources by language. */
  filterByLanguage(language: string): MediaSource[] {
    return this.getAll().filter((s) => s.languages.includes(language));
  }

  // --- Management ---

  /** Add or update a source profile. */
  upsert(source: MediaSource): void {
    this.sources.set(source.id, { ...source });
  }

  /** Remove a source by ID. */
  remove(id: string): boolean {
    return this.sources.delete(id);
  }

  /** Toggle a source's active status. */
  setActive(id: string, active: boolean): boolean {
    const source = this.sources.get(id);
    if (!source) return false;
    source.active = active;
    return true;
  }

  /** Get the total count of registered sources. */
  get count(): number {
    return this.sources.size;
  }

  // --- Signal weight computation ---

  /**
   * Compute the effective signal weight for a source given a context.
   *
   * Key insight: unexpected sentiment is high-signal.
   * - A pro-government source reporting something negative about the government = HIGH signal
   * - A pro-government source reporting something positive about the government = LOW signal (expected)
   * - An independent source = baseline signal
   *
   * @param sourceId - The source to compute weight for
   * @param sentimentDirection - The sentiment direction of the article ('positive' or 'negative')
   * @param aboutGovernment - Whether the article is about government/political figures
   * @returns Effective signal weight (0-5 scale, >1 means amplified, <1 means dampened)
   */
  computeSignalWeight(
    sourceId: string,
    sentimentDirection: 'positive' | 'negative',
    aboutGovernment: boolean
  ): number {
    const source = this.sources.get(sourceId);
    if (!source) return 1.0;

    let biasMultiplier = 1.0;

    if (aboutGovernment) {
      if (source.biasDirection === 'pro-government') {
        // Pro-gov source being positive about gov = expected (dampen)
        // Pro-gov source being negative about gov = unexpected (amplify!)
        biasMultiplier = sentimentDirection === 'positive' ? 0.5 : 2.5;
      } else if (source.biasDirection === 'anti-government') {
        // Anti-gov source being positive about gov = unexpected (amplify!)
        // Anti-gov source being negative about gov = expected (dampen)
        biasMultiplier = sentimentDirection === 'positive' ? 2.5 : 0.5;
      } else {
        // Neutral source = baseline
        biasMultiplier = 1.0;
      }
    }

    return source.reliabilityScore * biasMultiplier * source.signalWeight;
  }
}
