#!/usr/bin/env python3
"""
Retry Failed Pages Script

This script reads a previous scan's JSON results and retries any pages
that failed with browser errors or other transient issues.
"""

import json
import argparse
from confluence_macro_checker import ConfluenceMacroChecker


def load_previous_results(json_file: str) -> list:
    """Load previous scan results from JSON file."""
    with open(json_file, 'r') as f:
        return json.load(f)


def extract_failed_pages(results: list) -> list:
    """
    Extract pages that failed due to browser/transient errors.

    Returns a list of unique page dictionaries with id, title, url, and space.
    """
    failed_pages = {}

    # Error types that indicate transient failures worth retrying
    transient_error_types = [
        'Browser Error',
        'Unexpected Error',
        'JavaScript Error',  # Sometimes these are transient
    ]

    for error in results:
        error_type = error.get('error_type', '')

        # Only retry transient errors (not actual macro errors we found)
        if error_type in transient_error_types:
            page_url = error.get('page_url')
            page_title = error.get('page_title')

            # Use URL as key to avoid duplicates
            if page_url and page_url not in failed_pages:
                failed_pages[page_url] = {
                    'title': page_title,
                    'url': page_url,
                    # We don't have id or space from error results, so we'll need to search
                }

    return list(failed_pages.values())


def main():
    """Main execution function."""
    parser = argparse.ArgumentParser(
        description='Retry Confluence pages that failed with browser errors'
    )
    parser.add_argument(
        '--previous-results',
        required=True,
        help='Path to the JSON file from the previous scan (e.g., blueprint_errors.json)'
    )
    parser.add_argument(
        '--confluence-url',
        required=True,
        help='Base URL of your Confluence instance'
    )
    parser.add_argument(
        '--username',
        required=True,
        help='Your Confluence username/email'
    )
    parser.add_argument(
        '--api-token',
        required=True,
        help='Your Confluence API token'
    )
    parser.add_argument(
        '--google-credentials',
        required=True,
        help='Path to Google service account credentials JSON file'
    )
    parser.add_argument(
        '--output-json',
        help='Output JSON file for retry results (default: retry_results.json)',
        default='retry_results.json'
    )
    parser.add_argument(
        '--sheet-name',
        help='Name for the Google Sheet (default: "Confluence Retry Results")',
        default='Confluence Retry Results'
    )

    args = parser.parse_args()

    print("\n" + "="*60)
    print("CONFLUENCE MACRO CHECKER - RETRY FAILED PAGES")
    print("="*60 + "\n")

    # Load previous results
    print(f"Loading previous results from: {args.previous_results}")
    try:
        previous_results = load_previous_results(args.previous_results)
        print(f"  ✓ Loaded {len(previous_results)} error(s) from previous scan\n")
    except FileNotFoundError:
        print(f"  ✗ Error: Could not find file '{args.previous_results}'")
        return
    except json.JSONDecodeError:
        print(f"  ✗ Error: Invalid JSON in '{args.previous_results}'")
        return

    # Extract pages that need retry
    failed_pages = extract_failed_pages(previous_results)

    if not failed_pages:
        print("✓ No pages need to be retried!")
        print("  All errors from the previous scan were actual macro errors,")
        print("  not transient browser/connection issues.\n")
        return

    print(f"Found {len(failed_pages)} page(s) that need to be retried:")
    for page in failed_pages:
        print(f"  - {page['title']}")
    print()

    # Initialize checker
    checker = ConfluenceMacroChecker(
        args.confluence_url,
        args.username,
        args.api_token
    )

    # Retry each failed page
    print(f"Retrying {len(failed_pages)} page(s)...\n")
    retry_errors = []

    for page in failed_pages:
        errors = checker.detect_macro_errors(page)
        retry_errors.extend(errors)

    # Export results
    print(f"\n{'='*60}")
    print(f"RETRY SUMMARY")
    print(f"{'='*60}")
    print(f"Pages retried: {len(failed_pages)}")
    print(f"Errors found on retry: {len(retry_errors)}")
    print(f"{'='*60}\n")

    if retry_errors:
        # Save to JSON
        with open(args.output_json, 'w') as f:
            json.dump(retry_errors, f, indent=2)
        print(f"✓ Saved retry results to: {args.output_json}")

        # Export to Google Sheets
        try:
            from confluence_macro_checker import GoogleSheetsExporter
            exporter = GoogleSheetsExporter(args.google_credentials)
            exporter.export_to_sheet(retry_errors, args.sheet_name)
        except Exception as e:
            print(f"\n⚠️  Failed to export to Google Sheets: {str(e)[:200]}")
    else:
        print("✓ All retried pages passed! No errors found on retry.\n")


if __name__ == '__main__':
    main()
