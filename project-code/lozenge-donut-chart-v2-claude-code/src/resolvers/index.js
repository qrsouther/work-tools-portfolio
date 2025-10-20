import Resolver from '@forge/resolver';
import api, { route } from '@forge/api';

const resolver = new Resolver();

resolver.define('getLozengeData', async (req) => {
  console.log('Lozenge counter macro called');
  console.log('Request context:', JSON.stringify(req.context, null, 2));

  try {
    const contentId = req.context.extension?.content?.id;

    if (!contentId) {
      console.error('No content ID found in context');
      return {
        error: 'Could not retrieve page ID',
        lozenges: {}
      };
    }

    console.log(`Fetching content for page ID: ${contentId}`);

    // Fetch the page content
    const response = await api.asApp().requestConfluence(
      route`/wiki/api/v2/pages/${contentId}?body-format=storage`,
      {
        headers: {
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      console.error('Failed to fetch page content:', response.status, response.statusText);
      return {
        error: `Failed to fetch page: ${response.status}`,
        lozenges: {}
      };
    }

    const data = await response.json();
    console.log('Page data retrieved successfully');

    const pageContent = data.body?.storage?.value || '';
    console.log('Page content length:', pageContent.length);

    // Count lozenges using regex
    const lozengeRegex = /<ac:structured-macro[^>]*ac:name="status"[^>]*>[\s\S]*?<ac:parameter\s+ac:name="(?:title|colour)"[^>]*>(.*?)<\/ac:parameter>[\s\S]*?<ac:parameter\s+ac:name="(?:colour|title)"[^>]*>(.*?)<\/ac:parameter>[\s\S]*?<\/ac:structured-macro>/gi;

    const lozenges = {};
    let match;
    let totalCount = 0;

    while ((match = lozengeRegex.exec(pageContent)) !== null) {
      const param1 = match[1];
      const param2 = match[2];

      // Determine which is title and which is colour
      const title = ['Grey', 'Red', 'Yellow', 'Green', 'Blue'].includes(param1) ? param2 : param1;
      const colour = ['Grey', 'Red', 'Yellow', 'Green', 'Blue'].includes(param1) ? param1 : param2;

      const key = `${title} (${colour})`;
      lozenges[key] = (lozenges[key] || 0) + 1;
      totalCount++;
    }

    console.log('Lozenges found:', lozenges);
    console.log('Total count:', totalCount);

    return {
      lozenges,
      totalCount,
      pageId: contentId
    };

  } catch (error) {
    console.error('Error in lozenge counter:', error);
    return {
      error: error.message,
      lozenges: {}
    };
  }
});

export const handler = resolver.getDefinitions();
