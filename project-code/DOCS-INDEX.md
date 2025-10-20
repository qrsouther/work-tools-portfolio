# Blueprint Tracker - Documentation Index

Complete guide to all documentation for the Blueprint Standard Adherence Master Tracker.

## 📚 Documentation Overview

### Quick Start

| Document | Purpose | Time |
|----------|---------|------|
| **[SUMMARY.md](./SUMMARY.md)** | One-page reference - start here! | 2 min |
| **[README.md](./README.md)** | Complete project documentation | 15 min |
| **[STATUS.md](./STATUS.md)** | Current deployment status & details | 10 min |
| **[ARCHITECTURE.md](./ARCHITECTURE.md)** | Visual diagrams and system architecture | 10 min |

### Setup & Deployment

| Document | Purpose | Audience |
|----------|---------|----------|
| **[QUICKSTART-GCF.md](./QUICKSTART-GCF.md)** | Quick cloud deployment guide | Deployers |
| **[DEPLOYMENT.md](./DEPLOYMENT.md)** | Comprehensive cloud setup | DevOps/Admins |

### Configuration Templates

| File | Purpose |
|------|---------|
| **[.env.example](./.env.example)** | Local environment variables template |
| **[.env.yaml.example](./.env.yaml.example)** | Cloud Functions environment template |
| **[config.example.json](./config.example.json)** | Search configuration template |

## 🎯 Documentation by Use Case

### "I just want to know what this does"
→ Read [SUMMARY.md](./SUMMARY.md) (2 minutes)

### "I need to understand how it's running"
→ Read [STATUS.md](./STATUS.md) (10 minutes)

### "I want to set this up locally"
→ Follow [README.md - Local Development](./README.md#-local-development)

### "I need to deploy to cloud"
→ Follow [QUICKSTART-GCF.md](./QUICKSTART-GCF.md)

### "I need to update the code"
→ Follow [README.md - Cloud Deployment](./README.md#-cloud-deployment)

### "I need to troubleshoot an issue"
→ Check [README.md - Troubleshooting](./README.md#-troubleshooting) or [STATUS.md - Known Issues](./STATUS.md#-known-issues--limitations)

### "I need to change which pages are included"
→ See [README.md - Configuration Reference](./README.md#-configuration-reference)

### "I need to change the schedule"
→ See [README.md - Change Schedule](./README.md#-change-schedule) or [STATUS.md - Update Procedures](./STATUS.md#-update-procedures)

## 📋 Key Information Quick Reference

### Current Deployment

**Status:** ✅ Active and running
**Schedule:** Daily at 9:00 AM Eastern Time
**Project:** blueprint-tracker-475402
**Function:** blueprint-tracker
**URL:** https://us-central1-blueprint-tracker-475402.cloudfunctions.net/blueprint-tracker

### What's Included/Excluded

**Included:**
- All pages in `cs` space with "Blueprint" in title
- Only lozenges within headers (h1-h6)

**Excluded:**
- Pages with "Generic", "Template", "Templates", "Client Summaries"
- Lozenges outside headers

### Key Commands

```bash
# Test manually
curl -X POST https://us-central1-blueprint-tracker-475402.cloudfunctions.net/blueprint-tracker

# View logs
gcloud functions logs read blueprint-tracker --gen2 --region=us-central1 --limit=50

# Redeploy
./deploy.sh
```

## 📊 System Architecture

```
Cloud Scheduler (9 AM ET)
    ↓
Cloud Function (blueprint-tracker)
    ├─ Search Confluence (CQL: space="cs" AND title~"Blueprint")
    ├─ Filter pages (exclude Generic/Templates)
    ├─ Parse lozenges (headers only)
    ├─ Normalize text (Title Case + TBD/N/A)
    └─ Update Google Sheet (individual tabs per team)
```

## 🔗 External Links

- **Cloud Console:** https://console.cloud.google.com/functions/details/us-central1/blueprint-tracker?project=blueprint-tracker-475402
- **Google Sheet:** https://docs.google.com/spreadsheets/d/10D0tNsNAC4cwSvFrd9eSVd0TEgqvkVXW1wVVqdvd1mI/edit
- **Confluence API Docs:** https://developer.atlassian.com/cloud/confluence/rest/
- **Google Sheets API Docs:** https://developers.google.com/sheets/api

## 📝 Document Relationships

```
README.md (main hub)
├── SUMMARY.md (quick reference)
├── STATUS.md (deployment details)
├── DEPLOYMENT.md (cloud setup guide)
├── QUICKSTART-GCF.md (fast deployment)
└── Templates
    ├── .env.example
    ├── .env.yaml.example
    └── config.example.json
```

## 🔄 Maintenance

### Regular Reading Schedule

- **Daily:** None required (fully automated)
- **Weekly:** Review [Google Sheet](https://docs.google.com/spreadsheets/d/10D0tNsNAC4cwSvFrd9eSVd0TEgqvkVXW1wVVqdvd1mI/edit) for data quality
- **Monthly:** Check [STATUS.md](./STATUS.md) for any updates needed
- **Quarterly:** Review [Cloud Console](https://console.cloud.google.com/functions/details/us-central1/blueprint-tracker?project=blueprint-tracker-475402) metrics

### Documentation Updates

Update these documents when:
- **README.md:** Features, configuration, or usage changes
- **STATUS.md:** Deployment changes, new metrics, or procedures
- **SUMMARY.md:** Key facts or commands change
- **DEPLOYMENT.md:** Cloud setup process changes
- **QUICKSTART-GCF.md:** Quick setup steps change

## 🎓 Learning Path

### For New Users
1. Start with [SUMMARY.md](./SUMMARY.md)
2. Read [README.md - What It Does](./README.md#-what-it-does)
3. Check [STATUS.md - Current Status](./STATUS.md#-current-status-active)

### For Developers
1. Read [README.md - Local Development](./README.md#-local-development)
2. Review [README.md - Project Structure](./README.md#-project-structure)
3. Study source code in `src/` directory

### For Operators
1. Read [STATUS.md](./STATUS.md) completely
2. Review [STATUS.md - Update Procedures](./STATUS.md#-update-procedures)
3. Bookmark [STATUS.md - Health Checks](./STATUS.md#-health-checks)

### For Admins
1. Read [DEPLOYMENT.md](./DEPLOYMENT.md) completely
2. Understand [README.md - Security](./README.md#-security)
3. Review [STATUS.md - Monitoring & Alerts](./STATUS.md#-monitoring--alerts)

## 📞 Support Path

1. Check [SUMMARY.md](./SUMMARY.md) for quick reference
2. Check [README.md - Troubleshooting](./README.md#-troubleshooting)
3. Check [STATUS.md - Common Issues](./STATUS.md#-support--escalation)
4. Review logs: `gcloud functions logs read blueprint-tracker --gen2 --region=us-central1`
5. Check [Cloud Console](https://console.cloud.google.com/functions/details/us-central1/blueprint-tracker?project=blueprint-tracker-475402)

---

**Documentation Version:** 1.0
**Last Updated:** October 17, 2025
**Status:** Complete and Current
