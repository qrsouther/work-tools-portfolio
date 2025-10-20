import Resolver from '@forge/resolver';
import api, { route } from '@forge/api';

const resolver = new Resolver();

resolver.define('getLozengeData', async (req) => {
  console.log('Lozenge counter macro called');

  try {
    const contentId = req.context.extension?.content?.id;
    if (!contentId) {
      return { error: 'Could not retrieve page ID', lozenges: {} };
    }

    const response = await api.asApp().requestConfluence(
      route`/wiki/api/v2/pages/${contentId}?body-format=storage`,
      { headers: { 'Accept': 'application/json' } }
    );

    if (!response.ok) {
      return { error: `Failed to fetch page: ${response.status}`, lozenges: {} };
    }

    const data = await response.json();
    const pageContent = data.body?.storage?.value || '';

    console.log('Page content length:', pageContent.length);

    // Match headers that contain lozenges
    const headerRegex = /<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi;

    const lozenges = {};
    let totalCount = 0;
    let headerMatch;
    let headerCount = 0;

    // Find all headers
    while ((headerMatch = headerRegex.exec(pageContent)) !== null) {
      headerCount++;
      const headerContent = headerMatch[1];
      const headerTag = headerMatch[0].match(/<h[1-6]/i)?.[0] || 'unknown';

      console.log(`\nHeader ${headerCount} (${headerTag}):`, headerContent.substring(0, 100));

      // Find all status macros in this header
      const macroRegex = /<ac:structured-macro[^>]*ac:name="status"[^>]*>([\s\S]*?)<\/ac:structured-macro>/gi;
      let macroMatch;

      while ((macroMatch = macroRegex.exec(headerContent)) !== null) {
        const macroContent = macroMatch[1];
        console.log('Found status macro:', macroContent);

        // Extract parameters
        const paramRegex = /<ac:parameter\s+ac:name="(title|colour)"[^>]*>(.*?)<\/ac:parameter>/gi;
        const params = {};
        let paramMatch;

        while ((paramMatch = paramRegex.exec(macroContent)) !== null) {
          params[paramMatch[1]] = paramMatch[2];
        }

        const title = params.title || 'Unknown';
        const colour = params.colour || 'Grey';

        console.log('Parsed lozenge:', { title, colour });

        const key = `${title} (${colour})`;
        lozenges[key] = (lozenges[key] || 0) + 1;
        totalCount++;
      }
    }

    console.log('Total headers found:', headerCount);
    console.log('Total lozenges counted:', totalCount);
    console.log('Lozenge breakdown:', lozenges);

    return {
      lozenges,
      totalCount,
      pageId: contentId,
      debug: {
        headerCount,
        pageContentLength: pageContent.length
      }
    };
  } catch (error) {
    return { error: error.message, lozenges: {} };
  }
});

export const handler = resolver.getDefinitions();
