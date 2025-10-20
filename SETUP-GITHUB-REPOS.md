# Setup Guide: Push All Projects to GitHub

This guide will help you push all your work project folders to GitHub as individual repositories, so that all links in your portfolio website work correctly.

## Current Status

✅ **Already on GitHub:**
- `blueprint-standard-adherence-thermometers`

❌ **Need to be pushed to GitHub:**
- `blueprint-standard-adherence-master-tracker`
- `blueprint-standards-chart-custom-ui-react`
- `confluence-json-editor`
- `confluence-macro-checker`
- `lozenge-donut-chart-v2-claude-code`

## Option 1: Automated Setup (Recommended)

### Step 1: Get a GitHub Personal Access Token

1. Go to: https://github.com/settings/tokens/new
2. Token name: `Create Repos Token`
3. Expiration: 30 days (or your preference)
4. Select scopes:
   - ✅ **repo** (Full control of private repositories)
5. Click "Generate token"
6. **Copy the token immediately** (you won't see it again!)

### Step 2: Create the Repositories

```bash
cd "/Users/quinnsouther/Documents/Code projects/work-tools-portfolio"

# Set your GitHub token
export GITHUB_TOKEN='your_token_paste_it_here'

# Create all repositories
./create-github-repos.sh
```

### Step 3: Push All Projects

```bash
# Push all projects to their repositories
./push-all-projects.sh
```

### Step 4: Clean Up

```bash
# Remove the token from your environment (for security)
unset GITHUB_TOKEN
```

## Option 2: Manual Setup

If you prefer to create repositories manually:

### For Each Project

#### 1. Create Repository on GitHub

Go to https://github.com/new and create each repository with these exact names:

1. `blueprint-standard-adherence-master-tracker`
2. `blueprint-standards-chart-custom-ui-react`
3. `confluence-json-editor`
4. `confluence-macro-checker`
5. `lozenge-donut-chart-v2-claude-code`

**Important:**
- ✅ Set as **Public**
- ❌ Do NOT initialize with README
- ❌ Do NOT add .gitignore
- ❌ Do NOT add license

#### 2. Push Each Project

After creating all repositories, run:

```bash
cd "/Users/quinnsouther/Documents/Code projects/work-tools-portfolio"
./push-all-projects.sh
```

## Verification

After pushing, verify all links work:

1. **Blueprint Standard Adherence Master Tracker**
   - https://github.com/qrsouther/blueprint-standard-adherence-master-tracker

2. **Blueprint Standards Chart Custom UI React**
   - https://github.com/qrsouther/blueprint-standards-chart-custom-ui-react

3. **Confluence JSON Editor**
   - https://github.com/qrsouther/confluence-json-editor

4. **Confluence Macro Checker**
   - https://github.com/qrsouther/confluence-macro-checker

5. **Lozenge Donut Chart v2 Claude Code**
   - https://github.com/qrsouther/lozenge-donut-chart-v2-claude-code

## What These Scripts Do

### `create-github-repos.sh`
- Uses GitHub API to create repositories
- Sets appropriate descriptions
- Configures repos as public with issues enabled

### `push-all-projects.sh`
- Initializes git in each project (if not already done)
- Creates appropriate .gitignore files
- Excludes sensitive files (credentials, tokens)
- Commits all project files
- Pushes to GitHub

## Troubleshooting

### "Repository not found" errors
- Make sure you've created the repositories on GitHub first
- Check that repository names match exactly (case-sensitive)

### "Permission denied" errors
- Check that your GitHub token has `repo` scope
- Make sure token hasn't expired
- Verify you're authenticated: `git config --global user.name`

### Files with credentials getting committed
- The .gitignore automatically excludes:
  - `*.json` (except package.json, manifest.json, tsconfig.json)
  - `*credentials*.json`
  - `*token*.txt`
  - `.env` files
  - `chrome_profile/` directories

### Need to update after pushing
If you need to make changes after initial push:

```bash
cd "/Users/quinnsouther/Documents/Code projects/your-project-name"
git add .
git commit -m "Update project files"
git push
```

## Security Notes

- ✅ Scripts automatically exclude credential files
- ✅ API tokens are stored in memory only (environment variable)
- ✅ .gitignore files prevent accidental credential commits
- ⚠️ Remember to unset GITHUB_TOKEN after use
- ⚠️ Revoke the Personal Access Token after setup if you won't need it again

## Next Steps

After all projects are on GitHub:

1. Visit your portfolio: https://qrsouther.github.io/work-tools-portfolio/
2. Click each project link to verify it works
3. Check that all GitHub repository pages display correctly
4. Add repository topics/tags on GitHub for better discoverability
