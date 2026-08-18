/**
 * Universal Text Sanitizer and Deduplication Engine
 * Ensures zero raw HTML entities (&#8217;, &#8220;, etc.), cleans stray numbers and # hashtags from titles and captions,
 * and detects duplicate / near-duplicate stories across the Savage Gentlemen platform.
 */

const NAMED_ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&quot;": '"',
  "&apos;": "'",
  "&#39;": "'",
  "&lt;": "<",
  "&gt;": ">",
  "&nbsp;": " ",
  "&copy;": "©",
  "&reg;": "®",
  "&trade;": "™",
  "&hellip;": "...",
  "&mdash;": "—",
  "&ndash;": "-",
  "&lsquo;": "'",
  "&rsquo;": "'",
  "&ldquo;": '"',
  "&rdquo;": '"',
  "&bull;": "•",
  "&prime;": "'",
  "&Prime;": '"',
};

/**
 * Decodes all HTML entities including named (&quot;, &hellip;),
 * decimal (&#8217;, &#8220;, &#8221;, &#038;), and hex (&#x2019;) entities.
 */
export function decodeHtmlEntities(raw: string | undefined | null): string {
  if (!raw) return "";

  let str = String(raw);

  // Perform multiple passes in case of nested/double-encoded entities (e.g. &amp;#8217;)
  for (let pass = 0; pass < 2; pass++) {
    // 1. Replace decimal entities &#8217;, &#8220;, etc.
    str = str.replace(/&#(\d+);?/g, (_, codeStr) => {
      try {
        const code = parseInt(codeStr, 10);
        if (code >= 0 && code <= 0x10ffff) {
          return String.fromCodePoint(code);
        }
      } catch {}
      return "";
    });

    // 2. Replace hex entities &#x2019;, etc.
    str = str.replace(/&#x([0-9a-fA-F]+);?/gi, (_, hexStr) => {
      try {
        const code = parseInt(hexStr, 16);
        if (code >= 0 && code <= 0x10ffff) {
          return String.fromCodePoint(code);
        }
      } catch {}
      return "";
    });

    // 3. Replace named entities
    for (const [entity, replacement] of Object.entries(NAMED_ENTITIES)) {
      str = str.split(entity).join(replacement);
    }
  }

  // Normalize common curly quotes and typographic characters
  str = str
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2026/g, "...");

  return str;
}

/**
 * Sanitizes article and ad titles:
 * - Decodes all HTML entities
 * - Strips hashtag characters (#) and stray hashtag words
 * - Removes stray number prefixes (e.g., "1. ", "#1 ", "No. 1")
 * - Cleans and trims whitespace
 */
export function cleanTitle(title: string | undefined | null): string {
  if (!title) return "";

  let cleaned = decodeHtmlEntities(title);

  // Remove HTML tags if any leaked in
  cleaned = cleaned.replace(/<\/?[^>]+(>|$)/g, "");

  // Remove hashtags (e.g. #Soca, #Dancehall, #1)
  cleaned = cleaned.replace(/#\w+/g, "");
  cleaned = cleaned.replace(/#/g, "");

  // Remove stray numeric list prefixes at the beginning of the title (e.g. "1. ", "01 - ", "[1] ")
  cleaned = cleaned.replace(/^(\d+[\.\-\)]\s*|\[\d+\]\s*)/, "");

  // Remove double spaces and punctuation anomalies
  cleaned = cleaned.replace(/\s{2,}/g, " ").trim();

  // Normalize quotes and colons
  cleaned = cleaned.replace(/\s*;\s*/g, "; ").replace(/\s*:\s*/g, ": ");

  return cleaned;
}

/**
 * Sanitizes summaries and social captions:
 * - Decodes HTML entities
 * - Removes hashtag symbols (#) and irrelevant hashtag blocks
 * - Strips stray numbering and formatting artifacts
 */
export function cleanCaption(caption: string | undefined | null): string {
  if (!caption) return "";

  let cleaned = decodeHtmlEntities(caption);

  // Remove HTML tags
  cleaned = cleaned.replace(/<\/?[^>]+(>|$)/g, "");

  // Remove all hashtags and # symbols
  cleaned = cleaned.replace(/#\w+/g, "");
  cleaned = cleaned.replace(/#/g, "");

  // Clean trailing punctuation or multiple empty lines
  cleaned = cleaned
    .split("\n")
    .map(line => line.replace(/\s{2,}/g, " ").trim())
    .filter((line, idx, arr) => !(line === "" && arr[idx - 1] === ""))
    .join("\n")
    .trim();

  return cleaned;
}

/**
 * Extracts essential keywords from a title for fuzzy duplicate detection.
 */
export function getTitleFingerprint(title: string): string {
  const STOP_WORDS = new Set([
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of",
    "with", "by", "from", "about", "behind", "meaning", "is", "this", "that", "these",
    "those", "are", "was", "were", "be", "been", "savage", "gentlemen", "exclusive"
  ]);

  const words = cleanTitle(title)
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w));

  return words.sort().join(" ");
}

/**
 * Detects if a new story is a duplicate or near-duplicate of an existing story.
 */
export function isDuplicateStory(
  candidateTitle: string,
  existingTitles: string[],
  threshold: number = 0.65
): boolean {
  const cleanCand = cleanTitle(candidateTitle).toLowerCase();
  if (!cleanCand) return true;

  const candFingerprint = getTitleFingerprint(candidateTitle);
  const candWords = new Set(candFingerprint.split(" ").filter(Boolean));

  for (const existing of existingTitles) {
    const cleanExist = cleanTitle(existing).toLowerCase();
    if (!cleanExist) continue;

    // Exact title match
    if (cleanCand === cleanExist) return true;

    // Substring or prefix match (> 25 characters)
    if (cleanCand.length > 25 && cleanExist.length > 25) {
      const prefixLength = 25;
      if (cleanCand.substring(0, prefixLength) === cleanExist.substring(0, prefixLength)) {
        return true;
      }
    }

    // Jaccard similarity of essential words
    const existFingerprint = getTitleFingerprint(existing);
    const existWords = new Set(existFingerprint.split(" ").filter(Boolean));

    if (candWords.size === 0 || existWords.size === 0) continue;

    let intersectionCount = 0;
    for (const w of candWords) {
      if (existWords.has(w)) intersectionCount++;
    }

    const unionCount = new Set([...candWords, ...existWords]).size;
    const similarity = intersectionCount / unionCount;

    if (similarity >= threshold) {
      return true;
    }
  }

  return false;
}
