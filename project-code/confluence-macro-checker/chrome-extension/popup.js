// Popup UI logic for Confluence Macro Error Checker

const testBtn = document.getElementById('testBtn');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const exportBtn = document.getElementById('exportBtn');
const statusEl = document.getElementById('status');
const progressEl = document.getElementById('progress');
const resultsEl = document.getElementById('results');
const summaryEl = document.getElementById('summary');
const statsSection = document.getElementById('statsSection');
const resultsSection = document.getElementById('resultsSection');
const totalPagesEl = document.getElementById('totalPages');
const checkedPagesEl = document.getElementById('checkedPages');
const errorPagesEl = document.getElementById('errorPages');
const totalErrorsEl = document.getElementById('totalErrors');

let currentState = {
  isScanning: false,
  results: []
};

// Initialize
initialize();

function initialize() {
  // Set up button listeners
  testBtn.addEventListener('click', handleTest);
  startBtn.addEventListener('click', handleStart);
  stopBtn.addEventListener('click', handleStop);
  exportBtn.addEventListener('click', handleExport);

  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((message) => {
    handleBackgroundMessage(message);
  });

  // Check if a scan is already running when popup opens
  checkCurrentState();
}

async function checkCurrentState() {
  // Add a small delay to ensure service worker has loaded state from storage
  await new Promise(resolve => setTimeout(resolve, 100));

  chrome.runtime.sendMessage({ action: 'getState' }, (state) => {
    if (!state) return;

    console.log('Popup: Received state -', 'isScanning:', state.isScanning, 'results:', state.results.length);

    if (state.isScanning) {
      // Scan is in progress!
      startBtn.style.display = 'none';
      testBtn.style.display = 'none';
      stopBtn.classList.remove('hidden');
      stopBtn.style.display = 'inline-block';

      // Show export button during scan
      exportBtn.classList.remove('hidden');
      exportBtn.style.display = 'inline-block';

      // Show all sections
      statsSection.classList.remove('hidden');
      resultsSection.classList.remove('hidden');

      const current = state.currentPage;
      const total = state.totalPages;

      if (total > 0) {
        statusEl.innerHTML = '<span class="spinner"></span>Scan in progress...';
        progressEl.textContent = `Checking page ${current} of ${total}`;

        // Update stats
        totalPagesEl.textContent = total;
        checkedPagesEl.textContent = state.results.length;
        const errorPages = state.results.filter(r => r.errors.length > 0).length;
        errorPagesEl.textContent = errorPages;
        const totalErrors = state.results.reduce((sum, r) => sum + r.errors.length, 0);
        totalErrorsEl.textContent = totalErrors;

        // Render existing results
        state.results.forEach(result => {
          const status = result.errors.length > 0 ? 'error' : 'success';
          addOrUpdatePageResult(result.page, status, result);
        });

        // Show current page being checked if available
        if (current > 0 && current <= state.pages.length) {
          const currentPage = state.pages[current - 1];
          addOrUpdatePageResult(currentPage, 'checking', null);
        }
      } else {
        statusEl.innerHTML = '<span class="spinner"></span>Fetching Blueprint pages...';
      }
    } else if (state.results && state.results.length > 0) {
      // Scan completed, show results
      exportBtn.classList.remove('hidden');
      exportBtn.style.display = 'inline-block';

      statsSection.classList.remove('hidden');
      resultsSection.classList.remove('hidden');

      const errorPages = state.results.filter(r => r.errors.length > 0).length;
      statusEl.textContent = `Scan complete! Found errors on ${errorPages} of ${state.results.length} pages.`;

      // Update stats
      totalPagesEl.textContent = state.totalPages;
      checkedPagesEl.textContent = state.results.length;
      errorPagesEl.textContent = errorPages;
      const totalErrors = state.results.reduce((sum, r) => sum + r.errors.length, 0);
      totalErrorsEl.textContent = totalErrors;

      // Render results
      state.results.forEach(result => {
        const status = result.errors.length > 0 ? 'error' : 'success';
        addOrUpdatePageResult(result.page, status, result);
      });

      summaryEl.style.display = 'block';
      summaryEl.innerHTML = `<strong>Summary:</strong> Scanned ${state.results.length} pages. Found ${errorPages} page(s) with errors.`;
    }
  });
}

async function handleTest() {
  // Clear previous results
  resultsEl.innerHTML = '';
  summaryEl.style.display = 'none';

  // Send test request to background
  chrome.runtime.sendMessage({
    action: 'testSinglePage'
  });

  // Update UI
  testBtn.disabled = true;
  startBtn.disabled = true;
  statusEl.innerHTML = '<span class="spinner"></span>Testing Baltimore Ravens page...';
  progressEl.textContent = 'Opening page and waiting 30 seconds for macros to render...';
}

async function handleStart() {
  // Get current Confluence URL
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const currentTab = tabs[0];

  if (!currentTab.url.includes('atlassian.net/wiki')) {
    alert('Please navigate to a Confluence page first!');
    return;
  }

  const confluenceUrl = new URL(currentTab.url).origin;

  // Clear previous results
  resultsEl.innerHTML = '';
  summaryEl.style.display = 'none';
  currentState.results = [];

  // Start the scan
  chrome.runtime.sendMessage({
    action: 'startScan',
    confluenceUrl: confluenceUrl
  });

  // Update UI
  startBtn.style.display = 'none';
  stopBtn.style.display = 'inline-block';
  exportBtn.style.display = 'inline-block'; // Show export button during scan
  exportBtn.classList.remove('hidden');
  statusEl.innerHTML = '<span class="spinner"></span>Initializing scan...';
  currentState.isScanning = true;
}

function handleStop() {
  chrome.runtime.sendMessage({ action: 'stopScan' });
  statusEl.textContent = 'Stopping scan...';
  stopBtn.disabled = true;
}

function handleExport() {
  chrome.runtime.sendMessage({ action: 'exportResults' });
}

function handleBackgroundMessage(message) {
  switch (message.type) {
    case 'testComplete':
      testBtn.disabled = false;
      startBtn.disabled = false;

      // Show results section for test
      resultsSection.classList.remove('hidden');

      if (message.errors.length > 0) {
        statusEl.textContent = `✓ Test successful! Found ${message.errors.length} error(s)`;
        statusEl.style.color = '#00875a';

        // Show the error
        addOrUpdatePageResult(message.page, 'error', {
          page: message.page,
          errors: message.errors
        });

        summaryEl.style.display = 'block';
        summaryEl.innerHTML = `<strong>Test Result:</strong> The error detection is working! Found macro errors on the test page.`;
      } else {
        statusEl.textContent = '⚠ Test result: No errors found';
        statusEl.style.color = '#de350b';

        addOrUpdatePageResult(message.page, 'success', {
          page: message.page,
          errors: []
        });

        summaryEl.style.display = 'block';
        summaryEl.innerHTML = `<strong>Test Result:</strong> No macro errors detected. Either the page is clean or the detection needs adjustment.`;
      }
      progressEl.textContent = '';
      break;

    case 'scanStarted':
      statusEl.innerHTML = '<span class="spinner"></span>Fetching Blueprint pages...';
      exportBtn.style.display = 'inline-block';
      exportBtn.classList.remove('hidden');
      break;

    case 'fetchingPages':
      statusEl.innerHTML = '<span class="spinner"></span>' + message.message;
      break;

    case 'pagesFound':
      statusEl.innerHTML = '<span class="spinner"></span>Found ' + message.count + ' Blueprint pages';
      progressEl.textContent = 'Preparing to scan...';
      statsSection.classList.remove('hidden');
      resultsSection.classList.remove('hidden');
      exportBtn.style.display = 'inline-block';
      exportBtn.classList.remove('hidden');
      break;

    case 'checkingPage':
      const page = message.page;
      statusEl.innerHTML = '<span class="spinner"></span>Scanning pages...';
      progressEl.textContent = `Checking ${message.current} of ${message.total}: ${page.title}`;

      // Ensure stats section is visible
      statsSection.classList.remove('hidden');
      resultsSection.classList.remove('hidden');

      // Update total pages stat
      totalPagesEl.textContent = message.total;

      // Add/update page in UI as "checking"
      addOrUpdatePageResult(page, 'checking', null);
      break;

    case 'pageChecked':
      const result = message.result;
      currentState.results.push(result);

      // Update stats
      checkedPagesEl.textContent = currentState.results.length;
      const errorPages = currentState.results.filter(r => r.errors && r.errors.length > 0).length;
      errorPagesEl.textContent = errorPages;
      const totalErrors = currentState.results.reduce((sum, r) => sum + (r.errors ? r.errors.length : 0), 0);
      totalErrorsEl.textContent = totalErrors;

      // Update page in UI with result
      const hasErrors = result.errors && result.errors.length > 0;
      addOrUpdatePageResult(result.page, hasErrors ? 'error' : 'success', result);
      break;

    case 'scanComplete':
      currentState.isScanning = false;
      startBtn.style.display = 'inline-block';
      stopBtn.style.display = 'none';
      exportBtn.style.display = 'inline-block';

      statusEl.textContent = 'Scan complete!';
      progressEl.textContent = '';

      // Show summary
      showSummary(message.totalPages, message.pagesWithErrors);
      break;

    case 'scanStopped':
      currentState.isScanning = false;
      startBtn.style.display = 'inline-block';
      stopBtn.style.display = 'none';
      stopBtn.disabled = false;
      exportBtn.style.display = 'inline-block';

      statusEl.textContent = 'Scan stopped by user';
      progressEl.textContent = '';
      break;

    case 'scanError':
      currentState.isScanning = false;
      startBtn.style.display = 'inline-block';
      stopBtn.style.display = 'none';
      stopBtn.disabled = false;

      statusEl.textContent = 'Error: ' + message.error;
      progressEl.textContent = '';
      break;

    case 'exportSuccess':
      console.log('Export successful:', message.filename);
      statusEl.textContent = `✓ Exported ${message.count} pages with errors`;
      statusEl.style.color = '#00875a';
      setTimeout(() => {
        statusEl.style.color = '';
        if (currentState.isScanning) {
          statusEl.innerHTML = '<span class="spinner"></span>Scanning pages...';
        }
      }, 3000);
      break;

    case 'exportError':
      console.error('Export failed:', message.error);
      statusEl.textContent = '⚠ Export failed: ' + message.error;
      statusEl.style.color = '#de350b';
      setTimeout(() => {
        statusEl.style.color = '';
        if (currentState.isScanning) {
          statusEl.innerHTML = '<span class="spinner"></span>Scanning pages...';
        }
      }, 3000);
      break;
  }
}

function addOrUpdatePageResult(page, status, result) {
  const pageId = 'page-' + page.id;
  let pageEl = document.getElementById(pageId);

  if (!pageEl) {
    pageEl = document.createElement('div');
    pageEl.id = pageId;
    pageEl.className = 'page-result';
    resultsEl.appendChild(pageEl);
  }

  // Update class
  pageEl.className = 'page-result ' + status;

  // Build content
  let content = `
    <div class="page-title">
      <a href="${page.url}" target="_blank">${escapeHtml(page.title)}</a>
    </div>
  `;

  if (status === 'checking') {
    content += '<div class="page-status">Checking for errors...</div>';
  } else if (status === 'success') {
    const duration = result && result.duration ? ` (${result.duration}s)` : '';
    content += `<div class="page-status success">✓ No errors found${duration}</div>`;
  } else if (status === 'error' && result) {
    const errorCount = result.errors.length;
    const duration = result.duration ? ` (${result.duration}s)` : '';
    content += `<div class="page-status error">⚠️ Found ${errorCount} error(s)${duration}</div>`;

    // Show error details
    for (const error of result.errors) {
      content += `
        <div class="error-details">
          <strong>${escapeHtml(error.type || 'Error')}:</strong><br>
          ${escapeHtml(error.message).substring(0, 300)}
          ${error.message.length > 300 ? '...' : ''}
        </div>
      `;
    }
  }

  pageEl.innerHTML = content;

  // Scroll to bottom to show latest result
  resultsEl.scrollTop = resultsEl.scrollHeight;
}

function showSummary(totalPages, pagesWithErrors) {
  summaryEl.style.display = 'block';
  summaryEl.innerHTML = `
    <strong>Summary:</strong> Scanned ${totalPages} pages.
    Found ${pagesWithErrors} page(s) with errors.
  `;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
