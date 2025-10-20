import axios, { AxiosInstance } from 'axios';

export interface ConfluenceConfig {
  baseUrl: string;      // Your Confluence site URL (e.g., "https://yourcompany.atlassian.net")
  email: string;        // Your Atlassian account email
  apiToken: string;     // The API token you'll generate
}

export interface PageContent {
  pageId: string;
  title: string;
  content: string;      // Raw HTML/storage format from Confluence
}

/**
 * Confluence API Client
 * Handles authentication and fetching page content from Confluence Cloud
 */
export class ConfluenceClient {
  private client: AxiosInstance;

  constructor(config: ConfluenceConfig) {
    // Create authenticated HTTP client
    // Confluence uses Basic Auth with email:apiToken encoded in base64
    const auth = Buffer.from(`${config.email}:${config.apiToken}`).toString('base64');

    this.client = axios.create({
      baseURL: config.baseUrl,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Fetches a single Confluence page's content
   * @param pageId - The Confluence page ID (visible in the page URL)
   * @returns Page content in storage format (includes all macros/lozenges)
   */
  async getPageContent(pageId: string): Promise<PageContent> {
    try {
      // Request page with storage format to get raw macro data
      const response = await this.client.get(
        `/wiki/rest/api/content/${pageId}`,
        {
          params: {
            expand: 'body.storage'  // This gives us the raw HTML with status macros
          }
        }
      );

      return {
        pageId: response.data.id,
        title: response.data.title,
        content: response.data.body.storage.value
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to fetch Confluence page ${pageId}: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Fetches multiple pages concurrently (this is where Node's async shines!)
   * @param pageIds - Array of Confluence page IDs
   * @returns Array of page contents
   */
  async getMultiplePages(pageIds: string[]): Promise<PageContent[]> {
    // Promise.all runs all requests in parallel - much faster than sequential
    const promises = pageIds.map(id => this.getPageContent(id));
    return Promise.all(promises);
  }

  /**
   * Searches for pages in a specific space with a title matching the search term
   * @param spaceKey - The Confluence space key (e.g., "cs")
   * @param titleSearch - The text to search for in page titles (e.g., "Blueprint")
   * @returns Array of page IDs matching the search criteria
   */
  async searchPagesByTitle(spaceKey: string, titleSearch: string): Promise<string[]> {
    try {
      const pageIds: string[] = [];
      let start = 0;
      const limit = 100; // Confluence API pagination limit
      let hasMore = true;

      console.log(`🔍 Searching for pages in space "${spaceKey}" with "${titleSearch}" in title...`);

      while (hasMore) {
        // Use CQL (Confluence Query Language) to search
        const cql = `space = "${spaceKey}" AND title ~ "${titleSearch}" AND type = "page"`;

        const response = await this.client.get('/wiki/rest/api/content/search', {
          params: {
            cql: cql,
            limit: limit,
            start: start,
            expand: 'version,status' // Expand status to check if archived
          }
        });

        const results = response.data.results || [];

        // Extract page IDs, excluding archived pages
        for (const result of results) {
          if (result.id) {
            // Check if page is archived (status will be 'archived' for archived pages)
            const isArchived = result.status === 'archived' ||
                              (result.metadata && result.metadata.labels &&
                               result.metadata.labels.some((label: any) => label.name === 'archived'));

            if (!isArchived) {
              pageIds.push(result.id);
              console.log(`  ✓ Found: ${result.title} (ID: ${result.id})`);
            } else {
              console.log(`  ⊗ Skipped (archived): ${result.title} (ID: ${result.id})`);
            }
          }
        }

        // Check if there are more results
        const size = response.data.size || 0;
        start += size;
        hasMore = size === limit; // Continue if we got a full page of results
      }

      console.log(`✓ Found ${pageIds.length} total page(s) matching search criteria\n`);
      return pageIds;

    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to search Confluence: ${error.message}`);
      }
      throw error;
    }
  }
}
