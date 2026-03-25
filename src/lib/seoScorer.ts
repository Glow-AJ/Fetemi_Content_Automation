/**
 * Simple SEO scoring engine for the Fetemi app.
 * Calculates a score from 0-100 based on common SEO best practices.
 */

export interface SEOFactors {
  hasPrimaryKeywordInH1: boolean;
  hasPrimaryKeywordInIntro: boolean;
  hasProperHeadingStructure: boolean;
  hasOptimalWordCount: boolean;
  hasSufficientLinks: boolean;
  hasShortParagraphs: boolean;
}

export function calculateSEOScore(content: string, primaryKeyword: string): number {
  if (!content || !primaryKeyword) return 0;

  let score = 0;

  const kw = primaryKeyword.toLowerCase();

  // 1. Primary keyword in H1 (20 pts)
  // Check if first line or bolded text contains keyword
  const firstLine = content.split('\n')[0] || '';
  if (firstLine.toLowerCase().includes(kw)) {
    score += 20;
  }

  // 2. Primary keyword in first 100 words (20 pts)
  const first100Words = content.split(/\s+/).slice(0, 100).join(' ').toLowerCase();
  if (first100Words.includes(kw)) {
    score += 20;
  }

  // 3. Proper Heading Structure (15 pts)
  // Look for markdown headers
  const h2Matches = content.match(/^##\s+.+/gm);

  if (h2Matches && h2Matches.length >= 2) {
    score += 15;
  }

  // 4. Word Count (15 pts)
  const wordCount = content.split(/\s+/).length;
  if (wordCount >= 600 && wordCount <= 1200) {
    score += 15;
  } else if (wordCount > 1200) {
    score += 10;
  }

  // 5. Links (15 pts)
  const linkMatches = content.match(/\[.+\]\(.+\)/g);
  if (linkMatches && linkMatches.length >= 2) {
    score += 15;
  }

  // 6. Short Paragraphs (15 pts)
  const paragraphs = content.split('\n\n');
  const avgParagraphLength = paragraphs.reduce((acc, p) => acc + p.split('.').length, 0) / paragraphs.length;
  if (avgParagraphLength <= 4) {
    score += 15;
  }

  return Math.min(score, 100);
}

export function getSEOBadge(score: number) {
  if (score >= 90) return { label: 'Excellent', color: 'text-secondary', bg: 'bg-secondary/10', border: 'border-secondary/20' };
  if (score >= 70) return { label: 'Good', color: 'text-accent', bg: 'bg-accent/10', border: 'border-accent/20' };
  return { label: 'Needs Work', color: 'text-error', bg: 'bg-error/10', border: 'border-error/20' };
}
