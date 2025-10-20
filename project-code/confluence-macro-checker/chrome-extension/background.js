// Background service worker for Confluence Macro Error Checker

let scanState = {
  isScanning: false,
  currentPage: 0,
  totalPages: 0,
  pages: [],
  results: [],
  shouldStop: false
};

// Initialize: Load scan state from storage when service worker starts
chrome.storage.local.get(['scanState'], (result) => {
  if (result.scanState) {
    scanState = result.scanState;
    console.log('Restored scan state from storage:', scanState.results.length, 'results');
    console.log('Scan was running:', scanState.isScanning);
    console.log('Current page:', scanState.currentPage, 'of', scanState.totalPages);
  }
});

// Helper function to persist scan state to storage
function persistScanState() {
  chrome.storage.local.set({ scanState: scanState });
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'testSinglePage') {
    testSinglePage();
    sendResponse({ started: true });
  } else if (request.action === 'startScan') {
    startScan(request.confluenceUrl);
    sendResponse({ started: true });
  } else if (request.action === 'stopScan') {
    console.log('Stop scan requested');
    scanState.shouldStop = true;
    persistScanState();
    sendResponse({ stopped: true });
  } else if (request.action === 'getState') {
    sendResponse(scanState);
  } else if (request.action === 'exportResults') {
    exportResults();
    sendResponse({ exported: true });
  }
  return true; // Keep channel open for async response
});

async function testSinglePage() {
  console.log('\n' + '='.repeat(60));
  console.log('TEST MODE: Checking Baltimore Ravens page');
  console.log('='.repeat(60) + '\n');

  const testPage = {
    id: '5115838479',
    title: 'Draft Blueprint: Baltimore Ravens',
    url: 'https://seatgeek.atlassian.net/wiki/spaces/cs/pages/5115838479/Draft+Blueprint+Baltimore+Ravens',
    space: 'CS'
  };

  console.log('Opening test page:', testPage.url);
  console.log('Waiting 30 seconds for macros to render...');

  try {
    const result = await checkPage(testPage);

    console.log('\n' + '='.repeat(60));
    console.log('TEST RESULTS');
    console.log('='.repeat(60));
    console.log('Page:', testPage.title);
    console.log('Errors found:', result.errors.length);

    if (result.errors.length > 0) {
      console.log('✓ SUCCESS: Error detection is working!');
      console.log('\nErrors detected:');
      result.errors.forEach((error, i) => {
        console.log(`\n  Error ${i + 1}:`);
        console.log(`    Type: ${error.type}`);
        console.log(`    Message: ${error.message}`);
      });
    } else {
      console.log('⚠ No errors found on test page');
      console.log('This could mean:');
      console.log('  1. The page has no MultiExcerpt Include errors (unlikely based on your feedback)');
      console.log('  2. The error detection logic needs adjustment');
      console.log('  3. The page did not fully load in 30 seconds');
    }
    console.log('\n' + '='.repeat(60) + '\n');

    // Send results to popup
    notifyPopup({
      type: 'testComplete',
      page: testPage,
      errors: result.errors
    });

  } catch (error) {
    console.error('Test failed:', error);
    notifyPopup({
      type: 'testComplete',
      page: testPage,
      errors: [{
        type: 'Test Error',
        message: `Test failed: ${error.message}`
      }]
    });
  }
}

async function startScan(confluenceUrl) {
  scanState.isScanning = true;
  scanState.shouldStop = false;
  scanState.currentPage = 0;
  scanState.results = [];

  // Notify popup that scan is starting
  notifyPopup({ type: 'scanStarted' });

  try {
    // Fetch all Blueprint pages using Confluence REST API
    const pages = await fetchBlueprintPages(confluenceUrl);

    // Sort pages alphabetically by title
    pages.sort((a, b) => a.title.localeCompare(b.title));
    console.log('Sorted pages alphabetically by title');

    scanState.pages = pages;
    scanState.totalPages = pages.length;

    notifyPopup({ type: 'pagesFound', count: pages.length });

    console.log(`\n${'='.repeat(60)}`);
    console.log(`Starting scan of ${pages.length} Blueprint pages`);
    console.log(`Estimated time: ${Math.round(pages.length * 35 / 60)} minutes`);
    console.log(`${'='.repeat(60)}\n`);

    // Scan each page
    for (let i = 0; i < pages.length; i++) {
      if (scanState.shouldStop) {
        console.log('Stop requested, ending scan...');
        scanState.isScanning = false;
        persistScanState();
        notifyPopup({ type: 'scanStopped' });
        return; // Exit the function completely
      }

      scanState.currentPage = i + 1;
      const page = pages[i];

      console.log(`[${i + 1}/${pages.length}] Checking: ${page.title}`);

      notifyPopup({
        type: 'checkingPage',
        page: page,
        current: i + 1,
        total: pages.length
      });

      // Check this page for errors
      const result = await checkPage(page);
      scanState.results.push(result);

      // Persist results after each page
      persistScanState();

      if (result.errors.length > 0) {
        console.log(`  ⚠️  Found ${result.errors.length} error(s) (${result.duration}s)`);
      } else {
        console.log(`  ✓ No errors (${result.duration}s)`);
      }

      notifyPopup({
        type: 'pageChecked',
        result: result,
        current: i + 1,
        total: pages.length
      });
    }

    // Scan complete
    scanState.isScanning = false;
    const errorCount = scanState.results.filter(r => r.errors.length > 0).length;
    const totalErrors = scanState.results.reduce((sum, r) => sum + r.errors.length, 0);

    // Persist final state
    persistScanState();

    notifyPopup({
      type: 'scanComplete',
      totalPages: pages.length,
      pagesWithErrors: errorCount
    });

    // Auto-export results
    exportResults();

    // Show browser notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icon128.png',
      title: 'Confluence Scan Complete',
      message: `Scanned ${pages.length} pages. Found ${totalErrors} MultiExcerpt errors on ${errorCount} pages.`,
      priority: 2
    });

    console.log(`Scan complete: ${pages.length} pages, ${errorCount} with errors, ${totalErrors} total errors`);

  } catch (error) {
    scanState.isScanning = false;
    notifyPopup({ type: 'scanError', error: error.message });

    // Show error notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icon128.png',
      title: 'Confluence Scan Error',
      message: error.message,
      priority: 2
    });
  }
}

async function fetchBlueprintPages(confluenceUrl) {
  const pages = [];
  const pageIdsSeen = new Set(); // Track page IDs to avoid duplicates
  let start = 0;
  const limit = 50;

  console.log('Starting to fetch Blueprint pages...');

  while (true) {
    // Use the content endpoint which has better pagination support
    // Then filter results client-side for "Blueprint" in title
    const url = `${confluenceUrl}/wiki/rest/api/content?spaceKey=CS&type=page&start=${start}&limit=${limit}&expand=space`;

    console.log(`Fetching pages ${start} to ${start + limit}...`);
    console.log(`Request URL: ${url}`);
    notifyPopup({
      type: 'fetchingPages',
      message: `Fetching pages... Found ${pages.length} so far`
    });

    const response = await fetch(url, {
      credentials: 'include' // Use browser's cookies
    });

    if (!response.ok) {
      console.error(`Failed to fetch pages: ${response.status} ${response.statusText}`);
      throw new Error(`Failed to fetch pages: ${response.statusText}`);
    }

    const data = await response.json();
    const results = data.results || [];

    console.log(`Got ${results.length} pages in this batch`);
    console.log(`API response - size: ${data.size}, limit: ${data.limit}, start: ${data.start}`);

    if (results.length === 0) {
      console.log('No results in this batch, stopping pagination');
      break;
    }

    let newPagesFound = 0;
    for (const page of results) {
      // Skip if we've already seen this page ID
      if (pageIdsSeen.has(page.id)) {
        continue;
      }

      // Filter client-side: only include pages with "Blueprint" in title
      if (!page.title.toLowerCase().includes('blueprint')) {
        continue;
      }

      pageIdsSeen.add(page.id);
      pages.push({
        id: page.id,
        title: page.title,
        url: `${confluenceUrl}/wiki${page._links.webui}`,
        space: page.space.name
      });
      newPagesFound++;
    }

    const filteredOut = results.length - newPagesFound - (results.filter(r => pageIdsSeen.has(r.id) && r.id !== pageIdsSeen.values().next().value).length);
    console.log(`Added ${newPagesFound} Blueprint pages (filtered out ${filteredOut} non-Blueprint pages)`);
    console.log(`Total Blueprint pages collected so far: ${pages.length}`);

    notifyPopup({
      type: 'fetchingPages',
      message: `Fetching pages... Found ${pages.length} so far`
    });

    // Check if we should continue pagination
    // The API returns fewer results than requested when we've reached the end
    if (results.length < limit) {
      console.log(`Reached end of results (got ${results.length} results, expected ${limit})`);
      break;
    }

    // Continue even if no Blueprint pages were found in this batch
    // (there might be more Blueprint pages in the next batch)
    start += limit;
    console.log(`Continuing to next batch (start=${start})`);

    // Small delay to avoid overwhelming the API
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log(`Finished fetching. Total pages found: ${pages.length}`);
  return pages;
}

async function checkPage(page) {
  return new Promise(async (resolve) => {
    const startTime = Date.now();

    // Create a new tab to load the page
    const tab = await chrome.tabs.create({
      url: page.url,
      active: false // Open in background
    });

    // Set up a listener for messages from content script
    const messageListener = (message, sender) => {
      // Check if message is from our tab and is the errorsDetected action
      if (sender.tab && sender.tab.id === tab.id && message.action === 'errorsDetected') {
        chrome.runtime.onMessage.removeListener(messageListener);

        const duration = ((Date.now() - startTime) / 1000).toFixed(1);

        // Close the tab after checking
        chrome.tabs.remove(tab.id);

        resolve({
          page: page,
          errors: message.errors,
          checked: true,
          duration: duration
        });
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);

    // Set timeout in case page doesn't respond
    // Content script waits 30s, so we need at least 40s for page load + content execution
    setTimeout(() => {
      chrome.runtime.onMessage.removeListener(messageListener);
      chrome.tabs.remove(tab.id).catch(() => {});
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      resolve({
        page: page,
        errors: [],
        checked: false,
        timeout: true,
        duration: duration
      });
    }, 60000); // 60 second timeout (30s wait + 30s buffer for load/execution)
  });
}

function notifyPopup(message) {
  // Send message to popup if it's open
  chrome.runtime.sendMessage(message).catch(() => {
    // Popup might be closed, ignore error
  });
}

function exportResults() {
  console.log('='.repeat(60));
  console.log('exportResults() called');
  console.log('Current results count:', scanState.results.length);

  const resultsWithErrors = scanState.results.filter(r => r.errors.length > 0);
  console.log('Pages with errors:', resultsWithErrors.length);

  // Create detailed export with summary
  const exportData = {
    scan_date: new Date().toISOString(),
    summary: {
      total_pages_scanned: scanState.results.length,
      pages_with_errors: resultsWithErrors.length,
      total_errors_found: scanState.results.reduce((sum, r) => sum + r.errors.length, 0)
    },
    pages_with_errors: resultsWithErrors.map(r => ({
      page_title: r.page.title,
      page_url: r.page.url,
      space: r.page.space,
      error_count: r.errors.length,
      errors: r.errors
    }))
  };

  console.log('Created export data:', JSON.stringify(exportData.summary));

  // Convert to data URL (URL.createObjectURL is not available in service workers)
  const jsonString = JSON.stringify(exportData, null, 2);
  const dataUrl = 'data:application/json;charset=utf-8,' + encodeURIComponent(jsonString);

  console.log('Created data URL (length:', dataUrl.length, ')');

  // Generate filename with timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
  const filename = `confluence_multiexcerpt_errors_${timestamp}.json`;

  console.log('Attempting download with filename:', filename);

  chrome.downloads.download({
    url: dataUrl,
    filename: filename,
    saveAs: false // Auto-download without prompting
  }, (downloadId) => {
    if (chrome.runtime.lastError) {
      console.error('Download failed:', chrome.runtime.lastError);

      // Try to notify popup of error
      notifyPopup({
        type: 'exportError',
        error: chrome.runtime.lastError.message
      });
    } else {
      console.log(`✓ Download started successfully! Download ID: ${downloadId}`);
      console.log(`✓ Exported ${resultsWithErrors.length} pages with errors to ${filename}`);

      // Notify popup of success
      notifyPopup({
        type: 'exportSuccess',
        filename: filename,
        count: resultsWithErrors.length
      });
    }
  });

  console.log('='.repeat(60));
}
