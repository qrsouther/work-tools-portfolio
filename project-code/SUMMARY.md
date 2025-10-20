# Blueprint Tracker - Quick Reference

One-page summary of the automated Blueprint Standard Adherence Master Tracker.

## ⚡ Status: ACTIVE & AUTOMATED

**Runs automatically every day at 9:00 AM Eastern Time**

## 📊 What It Does

Scans Confluence `cs` space for pages with "Blueprint" in title → Counts lozenges in headers → Updates Google Sheet with individual tabs per team.

## 🎯 Scope

### ✅ Included
- All pages in `cs` space with "Blueprint" in title
- Only lozenges within header elements (h1-h6)
- ~70 team Blueprint pages

### ❌ Excluded
- Pages with "Generic" in title
- Pages with "Template" or "Templates" in title
- Pages with "Client Summaries" in title
- "What are Blueprint MultiExcerpts" page
- "Best Practice Templates" page
- Lozenges outside of headers (body text, tables)

## 🔧 Key Configuration

| Setting | Value |
|---------|-------|
| **Confluence Space** | `cs` |
| **Search Query** | `space = "cs" AND title ~ "Blueprint"` |
| **Schedule** | Daily at 9:00 AM ET |
| **Cloud Project** | blueprint-tracker-475402 |
| **Function Name** | blueprint-tracker |
| **Google Sheet ID** | 10D0tNsNAC4cwSvFrd9eSVd0TEgqvkVXW1wVVqdvd1mI |

## 📋 Output

Each team gets its own sheet tab with columns:
- Page ID
- Page Title
- Lozenge Text (normalized to Title Case, except TBD/N/A)
- Lozenge Color
- Count
- Last Updated (timestamp)

## 🚀 Quick Commands

### Test Manually
```bash
curl -X POST https://us-central1-blueprint-tracker-475402.cloudfunctions.net/blueprint-tracker
```

### View Logs
```bash
gcloud functions logs read blueprint-tracker --gen2 --region=us-central1 --limit=50
```

### Check Status
```bash
gcloud scheduler jobs describe blueprint-tracker-daily --location=us-central1
```

### Redeploy
```bash
npm run build
./deploy.sh
```

## 📊 Performance

- **Pages Processed:** ~70
- **Lozenges Counted:** ~4,900
- **Execution Time:** ~2-3 minutes
- **Cost:** $0/month (free tier)

## 🔗 Important Links

- **Function:** https://console.cloud.google.com/functions/details/us-central1/blueprint-tracker?project=blueprint-tracker-475402
- **Google Sheet:** https://docs.google.com/spreadsheets/d/10D0tNsNAC4cwSvFrd9eSVd0TEgqvkVXW1wVVqdvd1mI/edit
- **Scheduler:** Cloud Console → Cloud Scheduler → blueprint-tracker-daily

## 📖 Documentation

- [README.md](./README.md) - Complete documentation
- [STATUS.md](./STATUS.md) - Detailed deployment status
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment guide
- [QUICKSTART-GCF.md](./QUICKSTART-GCF.md) - Quick setup guide

## 🐛 Common Issues

| Problem | Solution |
|---------|----------|
| Not running | Check scheduler is enabled |
| OAuth error | Run `npm run auth` then update secret |
| Missing pages | Check exclusion filters |
| Wrong counts | Verify only counting headers |

---

**Last Updated:** October 17, 2025
