#!/bin/bash

# Script to create GitHub repositories using curl and GitHub API
# Requires a GitHub Personal Access Token

set -e

GITHUB_USER="qrsouther"
GITHUB_API="https://api.github.com"

# Check if GitHub token is set
if [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ Error: GITHUB_TOKEN environment variable not set"
    echo ""
    echo "To create GitHub repos, you need a Personal Access Token:"
    echo ""
    echo "1. Go to: https://github.com/settings/tokens/new"
    echo "2. Give it a name like 'Create Repos Token'"
    echo "3. Select scopes: 'repo' (Full control of private repositories)"
    echo "4. Click 'Generate token'"
    echo "5. Copy the token"
    echo "6. Run: export GITHUB_TOKEN='your_token_here'"
    echo "7. Then run this script again"
    echo ""
    echo "Alternatively, you can manually create each repository at:"
    echo "https://github.com/new"
    echo ""
    echo "Repository names needed:"
    echo "  - blueprint-standard-adherence-master-tracker"
    echo "  - blueprint-standards-chart-custom-ui-react"
    echo "  - confluence-json-editor"
    echo "  - confluence-macro-checker"
    echo "  - lozenge-donut-chart-v2-claude-code"
    echo ""
    echo "After creating them, run the push script:"
    echo "./push-all-projects.sh"
    exit 1
fi

# Array of projects to create (excluding thermometers which already exists)
PROJECTS=(
    "blueprint-standard-adherence-master-tracker:Automated Google Cloud Function that scans Confluence Blueprint pages for status lozenges and tracks them in Google Sheets"
    "blueprint-standards-chart-custom-ui-react:Atlassian Forge confluence macro with custom UI for displaying Blueprint standard adherence data"
    "confluence-json-editor:Chrome extension for editing Confluence page content via REST API"
    "confluence-macro-checker:Comprehensive macro error detection system with Python CLI and Chrome extension"
    "lozenge-donut-chart-v2-claude-code:Atlassian Forge UI Kit component for creating donut chart visualizations with lozenge status indicators"
)

echo "=========================================="
echo "Creating GitHub Repositories"
echo "=========================================="
echo ""

for project_info in "${PROJECTS[@]}"; do
    # Split name and description
    IFS=':' read -r repo_name repo_description <<< "$project_info"

    echo "----------------------------------------"
    echo "Creating: $repo_name"
    echo "----------------------------------------"

    # Check if repo already exists
    if curl -s -H "Authorization: token $GITHUB_TOKEN" \
        "$GITHUB_API/repos/$GITHUB_USER/$repo_name" | grep -q '"name"'; then
        echo "✅ Repository already exists: $repo_name"
        echo ""
        continue
    fi

    # Create the repository
    response=$(curl -s -X POST \
        -H "Authorization: token $GITHUB_TOKEN" \
        -H "Accept: application/vnd.github.v3+json" \
        "$GITHUB_API/user/repos" \
        -d "{
            \"name\": \"$repo_name\",
            \"description\": \"$repo_description\",
            \"private\": false,
            \"has_issues\": true,
            \"has_projects\": false,
            \"has_wiki\": false
        }")

    if echo "$response" | grep -q '"full_name"'; then
        echo "✅ Successfully created: $repo_name"
        echo "   URL: https://github.com/$GITHUB_USER/$repo_name"
    else
        echo "❌ Failed to create: $repo_name"
        echo "   Response: $response"
    fi

    echo ""
done

echo "=========================================="
echo "✅ Repository creation complete!"
echo "=========================================="
echo ""
echo "Next step: Push code to repositories"
echo "./push-all-projects.sh"
echo ""
