// Content script that runs on Confluence pages to detect macro errors

(function() {
  'use strict';

  console.log('Content script: Starting error detection');
  console.log('Content script: Will wait 30 seconds for macros to render, then check for errors');

  // Simple approach: Wait 30 seconds after page load, then check for errors
  setTimeout(() => {
    console.log('Content script: 30 seconds elapsed, checking for errors...');

    const errors = detectMacroErrors();

    console.log(`Content script: Detected ${errors.length} errors`);
    if (errors.length > 0) {
      errors.forEach((error, i) => {
        console.log(`  Error ${i + 1}: ${error.type} - ${error.message.substring(0, 100)}`);
      });
    }

    // Send errors back to background script
    try {
      if (chrome.runtime && chrome.runtime.id) {
        chrome.runtime.sendMessage({
          action: 'errorsDetected',
          errors: errors
        });
      } else {
        console.log('Content script: Extension context invalidated (extension was reloaded). Skipping message send.');
      }
    } catch (e) {
      console.log('Content script: Could not send message to background (extension may have been reloaded)');
    }
  }, 30000); // Wait exactly 30 seconds

  function detectMacroErrors() {
    console.log('Content script: detectMacroErrors() called');
    console.log('Content script: Page URL:', window.location.href);
    console.log('Content script: Page title:', document.title);

    const errors = [];

    // PRIMARY CHECK: Look for Confluence error icons
    // These appear when macros fail to render
    console.log('Content script: Checking for Confluence error icons...');

    const errorIcons = document.querySelectorAll('.aui-iconfont-error.confluence-information-macro-icon');
    console.log(`Content script: Found ${errorIcons.length} error icon(s)`);

    if (errorIcons.length > 0) {
      errorIcons.forEach((icon, index) => {
        console.log(`  Error icon ${index + 1}:`);

        // Try to get the parent element or container with the error message
        let errorContainer = icon.closest('.confluence-information-macro');
        if (!errorContainer) {
          errorContainer = icon.closest('div');
        }
        if (!errorContainer) {
          errorContainer = icon.parentElement;
        }

        if (errorContainer) {
          const errorText = errorContainer.textContent.trim();
          console.log(`    Container classes: ${errorContainer.className}`);
          console.log(`    Error text: "${errorText.substring(0, 200)}..."`);

          if (errorText && errorText.length > 0) {
            // Check if this error is already captured
            if (!errors.some(e => e.message === errorText)) {
              errors.push({
                type: 'Macro Rendering Error',
                message: errorText,
                source: 'error-icon'
              });
              console.log(`    ✓ Added error from icon`);
            }
          }
        } else {
          console.log(`    ⚠ Could not find error container for icon`);
        }
      });
    }

    // SECONDARY CHECK: Look for common error selectors
    console.log('Content script: Checking standard error selectors...');

    const errorSelectors = [
      'div.error',
      'div.confluence-macro-error',
      'div.macro-error',
      'div.aui-message-error',
      'div.confluence-error',
      'span.error',
      '.aui-message.error',
      '.confluence-information-macro.confluence-information-macro-warning',
      '.confluence-information-macro.confluence-information-macro-error'
    ];

    for (const selector of errorSelectors) {
      try {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          console.log(`  Found ${elements.length} element(s) matching "${selector}"`);
        }

        for (const element of elements) {
          const errorText = element.textContent.trim();
          if (!errorText || errorText.length === 0) continue;

          console.log(`    Text: "${errorText.substring(0, 150)}..."`);

          // Check if this error is already captured
          if (!errors.some(e => e.message === errorText)) {
            errors.push({
              type: 'Macro Rendering Error',
              message: errorText,
              selector: selector
            });
            console.log(`    ✓ Added error from ${selector}`);
          }
        }
      } catch (e) {
        console.error('Error checking selector:', selector, e);
      }
    }

    // TERTIARY CHECK: Search body text for error keywords
    console.log('Content script: Checking body text for error keywords...');

    const bodyText = document.body.textContent || '';
    const lowerBodyText = bodyText.toLowerCase();

    const errorKeywords = [
      'page lookup error',
      'macro lookup error',
      'lookup error'
    ];

    for (const keyword of errorKeywords) {
      if (lowerBodyText.includes(keyword.toLowerCase())) {
        console.log(`  ✓ Found "${keyword}" in body text!`);

        // Extract surrounding context
        const regex = new RegExp(`.{0,200}${escapeRegExp(keyword)}.{0,200}`, 'gi');
        const matches = bodyText.match(regex);

        if (matches) {
          console.log(`    Found ${matches.length} match(es)`);
          for (const match of matches) {
            const trimmedMatch = match.trim();

            // Avoid duplicates
            const isDuplicate = errors.some(e =>
              e.message.includes(trimmedMatch) ||
              trimmedMatch.includes(e.message) ||
              e.message === trimmedMatch
            );

            if (!isDuplicate && trimmedMatch.length > 10) {
              console.log(`    ✓ Adding error from body text`);
              errors.push({
                type: 'Macro Error Text',
                message: trimmedMatch,
                keyword: keyword
              });
            }
          }
        }
      }
    }

    console.log(`Content script: ========================================`);
    console.log(`Content script: FINAL RESULT: ${errors.length} errors found`);
    if (errors.length > 0) {
      errors.forEach((error, i) => {
        console.log(`  Error ${i+1}: [${error.type}] ${error.message.substring(0, 100)}...`);
      });
    }
    console.log(`Content script: ========================================`);

    return errors;
  }

  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
})();
