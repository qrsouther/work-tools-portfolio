#!/bin/bash

# Script to push all project directories to GitHub as individual repositories
# This ensures all links in the work-tools-portfolio site point to valid repos

set -e

GITHUB_USER="qrsouther"
BASE_DIR="/Users/quinnsouther/Documents/Code projects"

# Array of projects to push
PROJECTS=(
    "blueprint-standard-adherence-master-tracker"
    "blueprint-standard-adherence-thermometers"
    "blueprint-standards-chart-custom-ui-react"
    "confluence-json-editor"
    "confluence-macro-checker"
    "lozenge-donut-chart-v2-claude-code"
)

echo "=========================================="
echo "Pushing All Projects to GitHub"
echo "=========================================="
echo ""

for project in "${PROJECTS[@]}"; do
    echo "----------------------------------------"
    echo "Processing: $project"
    echo "----------------------------------------"

    PROJECT_DIR="$BASE_DIR/$project"

    if [ ! -d "$PROJECT_DIR" ]; then
        echo "❌ Directory not found: $PROJECT_DIR"
        continue
    fi

    cd "$PROJECT_DIR"

    # Initialize git if not already initialized
    if [ ! -d ".git" ]; then
        echo "📦 Initializing git repository..."
        git init
        git branch -M main
    fi

    # Add .gitignore if it doesn't exist
    if [ ! -f ".gitignore" ]; then
        echo "📝 Creating .gitignore..."
        cat > .gitignore << 'EOF'
# Dependencies
node_modules/
package-lock.json

# Environment variables
.env
.env.local
.env.*.local
*.json
!package.json
!manifest.json
!tsconfig.json

# Build outputs
dist/
build/
*.log

# OS files
.DS_Store
.AppleDouble
.LSOverride

# IDE
.vscode/
.idea/
*.swp
*.swo

# Chrome profile data
chrome_profile/

# Credentials
*credentials*.json
*token*.txt
EOF
    fi

    # Stage all files
    echo "📦 Staging files..."
    git add .

    # Check if there are changes to commit
    if git diff --staged --quiet; then
        echo "✅ No changes to commit"
    else
        echo "💾 Creating commit..."
        git commit -m "Add project files

This project is part of the work-tools-portfolio showcase.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
    fi

    # Check if remote exists
    if git remote | grep -q origin; then
        echo "🔗 Remote 'origin' already exists"
    else
        echo "🔗 Adding remote..."
        git remote add origin "https://github.com/$GITHUB_USER/$project.git"
    fi

    echo "🚀 Pushing to GitHub..."
    # Try to push, if it fails, the repo may not exist on GitHub
    if git push -u origin main 2>&1 | tee /tmp/git-push-output.txt; then
        echo "✅ Successfully pushed $project"
    else
        if grep -q "Repository not found" /tmp/git-push-output.txt || grep -q "does not appear to be a git repository" /tmp/git-push-output.txt; then
            echo "⚠️  Repository does not exist on GitHub yet"
            echo "   Please create it at: https://github.com/new"
            echo "   Repository name: $project"
            echo "   Then run: cd \"$PROJECT_DIR\" && git push -u origin main"
        else
            echo "❌ Failed to push $project"
            cat /tmp/git-push-output.txt
        fi
    fi

    echo ""
done

echo "=========================================="
echo "✅ All projects processed!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. For any repos that don't exist on GitHub yet, create them at:"
echo "   https://github.com/new"
echo "2. Use the repository names exactly as shown above"
echo "3. Set them as PUBLIC repositories"
echo "4. Do NOT initialize with README (we already have files)"
echo ""
