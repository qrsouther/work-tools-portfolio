/**
 * Represents a status lozenge/badge found on a Confluence page
 */
export interface Lozenge {
  text: string;         // The label/text of the lozenge (e.g., "In Progress", "Complete")
  color: string;        // The color of the lozenge (e.g., "green", "yellow", "blue")
}

/**
 * Aggregated count of lozenges grouped by text and color
 */
export interface LozengeCount {
  text: string;
  color: string;
  count: number;
}

/**
 * Results for a single page
 */
export interface PageLozengeResult {
  pageId: string;
  pageTitle: string;
  lozenges: LozengeCount[];
  totalCount: number;
}

/**
 * Parses Confluence page content to extract status lozenges
 */
export class LozengeParser {
  /**
   * Normalizes lozenge text to consistent casing
   * - TBD and N/A → UPPERCASE
   * - Everything else → Title Case
   */
  private normalizeText(text: string): string {
    const trimmed = text.trim();
    const upper = trimmed.toUpperCase();

    // Special cases: keep as UPPERCASE
    if (upper === 'TBD' || upper === 'N/A') {
      return upper;
    }

    // Everything else: Title Case
    return trimmed
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('-');
  }
  /**
   * Extracts status macros that are children of header elements (h2, h3, h4, etc.)
   * Status lozenges appear as <ac:structured-macro ac:name="status"> in the HTML
   * Only counts lozenges that appear within header tags
   */
  parseLozenges(pageContent: string): Lozenge[] {
    const lozenges: Lozenge[] = [];

    // Find all header elements (h1-h6) in Confluence storage format
    // Headers contain content between opening and closing tags
    const headerRegex = /<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/g;
    let headerMatch;

    while ((headerMatch = headerRegex.exec(pageContent)) !== null) {
      const headerContent = headerMatch[1]; // Content inside the header

      // Find all status macros within this header
      const statusMacroRegex = /<ac:structured-macro[^>]*ac:name="status"[^>]*>[\s\S]*?<\/ac:structured-macro>/g;
      let statusMatch;

      while ((statusMatch = statusMacroRegex.exec(headerContent)) !== null) {
        const statusMacro = statusMatch[0];

        const color = this.extractParameter(statusMacro, 'colour') ||
                      this.extractParameter(statusMacro, 'color') ||
                      'default';
        const text = this.extractParameter(statusMacro, 'title') || 'Unknown';

        lozenges.push({
          text: this.normalizeText(text),
          color: color.toLowerCase().trim()
        });
      }
    }

    return lozenges;
  }

  /**
   * Extracts a parameter value from a status macro
   */
  private extractParameter(macroHtml: string, paramName: string): string | null {
    const paramRegex = new RegExp(
      `<ac:parameter[^>]*ac:name="${paramName}"[^>]*>([^<]*)<\/ac:parameter>`,
      'i'
    );
    const match = macroHtml.match(paramRegex);
    return match ? match[1] : null;
  }

  /**
   * Counts and groups lozenges by their text and color
   */
  countLozenges(lozenges: Lozenge[]): LozengeCount[] {
    // Create a map to group lozenges: "text|color" -> count
    const countMap = new Map<string, LozengeCount>();

    for (const lozenge of lozenges) {
      const key = `${lozenge.text}|${lozenge.color}`;

      if (countMap.has(key)) {
        countMap.get(key)!.count++;
      } else {
        countMap.set(key, {
          text: lozenge.text,
          color: lozenge.color,
          count: 1
        });
      }
    }

    // Convert map to array and sort by count (descending)
    return Array.from(countMap.values())
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Processes a page's content and returns aggregated lozenge counts
   */
  analyzePage(pageId: string, pageTitle: string, pageContent: string): PageLozengeResult {
    const lozenges = this.parseLozenges(pageContent);
    const counts = this.countLozenges(lozenges);

    return {
      pageId,
      pageTitle,
      lozenges: counts,
      totalCount: lozenges.length
    };
  }
}
