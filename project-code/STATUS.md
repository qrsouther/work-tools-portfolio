# Blueprint Tracker - Deployment Status

**Last Updated:** October 17, 2025

## 🟢 Current Status: ACTIVE

The Blueprint Standard Adherence Master Tracker is fully deployed and running automatically in production.

## 📊 Deployment Details

### Cloud Infrastructure

| Component | Value |
|-----------|-------|
| **Platform** | Google Cloud Functions (Gen 2) |
| **Project ID** | blueprint-tracker-475402 |
| **Project Number** | 701841318363 |
| **Function Name** | blueprint-tracker |
| **Region** | us-central1 |
| **Runtime** | Node.js 20 |
| **Memory** | 512 MB |
| **Timeout** | 540 seconds (9 minutes) |
| **Status** | Active |

### URLs

- **Function URL:** https://us-central1-blueprint-tracker-475402.cloudfunctions.net/blueprint-tracker
- **Cloud Console:** https://console.cloud.google.com/functions/details/us-central1/blueprint-tracker?project=blueprint-tracker-475402
- **Logs:** https://console.cloud.google.com/logs/query?project=blueprint-tracker-475402

### Automated Schedule

| Setting | Value |
|---------|-------|
| **Schedule Name** | blueprint-tracker-daily |
| **Frequency** | Daily |
| **Time** | 9:00 AM Eastern Time |
| **Cron Expression** | `0 9 * * *` |
| **Time Zone** | America/New_York |
| **Status** | Enabled |

## 🔧 Configuration

### Search Parameters

- **Confluence Space:** `cs`
- **Search Term:** `Blueprint`
- **CQL Query:** `space = "cs" AND title ~ "Blueprint"`

### Page Filtering

**✅ Included:**
- All pages with "Blueprint" in title from the `cs` space

**❌ Excluded:**
Pages containing these terms in their title:
- `Generic`
- `Template`
- `Templates`
- `Client Summaries`
- `What are Blueprint MultiExcerpts`
- `Best Practice Templates`

### Lozenge Counting Rules

**✅ Counted:**
- Lozenges within header elements (h1, h2, h3, h4, h5, h6)

**❌ Not Counted:**
- Lozenges in body text
- Lozenges in tables
- Lozenges in other non-header locations

### Text Normalization

**Title Case (default):**
- Examples: "Standard", "Semi-Standard", "Non-Standard", "Bespoke"

**UPPERCASE (exceptions):**
- "TBD"
- "N/A"

**Preserved Variations (for data quality tracking):**
- "Semi Standard" (no hyphen)
- "Na" (typo)
- "Semi- Standard" (extra space)
- etc.

## 📈 Current Statistics

### Last Run Summary

- **Pages Found:** ~85 total
- **Pages Excluded:** ~15
- **Pages Processed:** ~70
- **Total Lozenges:** ~4,900
- **Execution Time:** ~2-3 minutes
- **Sheet Tabs Created:** ~70
- **API Calls:** ~150 per run

### Resource Usage

- **Confluence API Calls:** ~85 per run
- **Google Sheets API Calls:** ~70 per run
- **Rate Limiting:** 1.5 seconds between sheet writes
- **Network Data:** ~10-15 MB per run
- **Cloud Build Time:** ~2-3 minutes (on code changes)

### Cost Analysis

- **Cloud Functions:** $0/month (within 2M invocations free tier)
- **Cloud Scheduler:** $0/month (first 3 jobs free)
- **Cloud Build:** $0/month (120 build-minutes/day free)
- **Secret Manager:** $0/month (first 6 operations free)
- **Cloud Run:** $0/month (included with Cloud Functions)

**Total Monthly Cost:** $0 (fully within free tier)

## 🔐 Security Configuration

### Secrets Management

| Secret | Location | Access |
|--------|----------|--------|
| **OAuth Token** | Secret Manager: `google-oauth-token` | Service Account: `701841318363-compute@developer.gserviceaccount.com` |
| **Environment Variables** | Cloud Functions Environment | Encrypted at rest |

### Permissions

- Service account: `701841318363-compute@developer.gserviceaccount.com`
- Role: `roles/secretmanager.secretAccessor` on `google-oauth-token`
- OAuth scopes: Google Sheets API (read/write)

### Authentication

- **Confluence:** Basic Auth (API Token)
- **Google Sheets:** OAuth 2.0 (Desktop app flow)
- **Cloud Function:** Allow unauthenticated (triggered by Cloud Scheduler)

## 🚦 Health Checks

### How to Verify System Health

**1. Check Function Status:**
```bash
gcloud functions describe blueprint-tracker --gen2 --region=us-central1 --format="value(state)"
```
Expected: `ACTIVE`

**2. Check Scheduler Status:**
```bash
gcloud scheduler jobs describe blueprint-tracker-daily --location=us-central1 --format="value(state)"
```
Expected: `ENABLED`

**3. Manual Trigger Test:**
```bash
curl -X POST https://us-central1-blueprint-tracker-475402.cloudfunctions.net/blueprint-tracker
```
Expected: `{"status":"success",...}`

**4. View Recent Logs:**
```bash
gcloud functions logs read blueprint-tracker --gen2 --region=us-central1 --limit=50
```

**5. Check Google Sheet:**
Visit: https://docs.google.com/spreadsheets/d/10D0tNsNAC4cwSvFrd9eSVd0TEgqvkVXW1wVVqdvd1mI/edit
- Verify "Last Updated" timestamps are recent
- Verify ~70 team tabs exist
- Verify no Generic/Template tabs exist

## 🔄 Update Procedures

### To Update Code

```bash
# 1. Make changes locally
# 2. Test locally
npm run build && npm start

# 3. Deploy to cloud
./deploy.sh

# 4. Verify deployment
curl -X POST https://us-central1-blueprint-tracker-475402.cloudfunctions.net/blueprint-tracker
```

### To Update Schedule

```bash
# Change time
gcloud scheduler jobs update http blueprint-tracker-daily \
  --location=us-central1 \
  --schedule="0 17 * * *"  # Example: 5 PM

# Change timezone
gcloud scheduler jobs update http blueprint-tracker-daily \
  --location=us-central1 \
  --time-zone="America/Los_Angeles"
```

### To Update Environment Variables

```bash
# 1. Edit .env.yaml
nano .env.yaml

# 2. Redeploy
./deploy.sh
```

### To Update OAuth Token

```bash
# 1. Generate new token locally
npm run auth

# 2. Upload to Secret Manager
gcloud secrets versions add google-oauth-token --data-file=.google-token.json

# 3. Restart function (automatic on next trigger)
```

### To Update Exclusion Rules

Edit these files:
- `src/index.ts` - Lines 64-71 (page filtering)
- `src/googleSheets.ts` - Lines 168-175 (sheet deletion)

Then redeploy:
```bash
npm run build
./deploy.sh
```

## 📊 Monitoring & Alerts

### Key Metrics to Monitor

1. **Function Execution Count**
   - Expected: ~30 per month (1 per day)
   - View: Cloud Console → Cloud Functions → Metrics

2. **Function Error Rate**
   - Expected: 0%
   - Alert if: >0%

3. **Function Execution Time**
   - Expected: 2-3 minutes
   - Alert if: >5 minutes

4. **Google Sheet Updates**
   - Expected: Daily at 9 AM ET
   - Verify: Check "Last Updated" column

5. **API Quota Usage**
   - Confluence: Well under limits
   - Google Sheets: ~70 writes per run (limit: 60/minute with 1.5s delays)

### How to Set Up Alerts

```bash
# Create alert policy for function failures
gcloud alpha monitoring policies create \
  --notification-channels=YOUR_CHANNEL_ID \
  --display-name="Blueprint Tracker Failures" \
  --condition-display-name="Function Error Rate" \
  --condition-threshold-value=0.01 \
  --condition-threshold-duration=60s
```

## 🐛 Known Issues & Limitations

### Current Limitations

1. **Processing Time:** Takes ~2-3 minutes per run (acceptable)
2. **Rate Limiting:** 1.5 second delays between writes (necessary for API quotas)
3. **Cold Start:** First run after idle may take +10 seconds (negligible)
4. **OAuth Token Expiry:** Needs manual refresh every ~6 months (acceptable)

### Known Data Quality Issues

These are intentionally preserved for visibility:
- Some pages use "Semi Standard" instead of "Semi-Standard"
- Some pages use "Na" instead of "N/A"
- Some pages use variations like "Semi- Standard"

These variations help identify which teams need to update their documentation.

## 📞 Support & Escalation

### For Issues

1. **Check Status:** Review this document
2. **Check Logs:** `gcloud functions logs read blueprint-tracker --gen2 --region=us-central1`
3. **Test Manually:** `curl -X POST https://us-central1-blueprint-tracker-475402.cloudfunctions.net/blueprint-tracker`
4. **Review Docs:** [README.md](./README.md), [DEPLOYMENT.md](./DEPLOYMENT.md)

### Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Function not running | Check scheduler: `gcloud scheduler jobs describe blueprint-tracker-daily --location=us-central1` |
| OAuth errors | Refresh token: `npm run auth` then update secret |
| Timeout errors | Increase timeout: `--timeout=900s` in deploy.sh |
| Rate limit errors | Already mitigated with 1.5s delays |
| Build failures | Check `tsconfig.json` and `src/` are not ignored |

## 🗓️ Maintenance Schedule

### Regular Tasks

- **Daily:** Automatic execution at 9 AM ET (no action needed)
- **Weekly:** Review Google Sheet for data quality issues
- **Monthly:** Check Cloud Console for any alerts or warnings
- **Quarterly:** Review logs for performance optimization opportunities
- **Bi-annually:** Refresh OAuth token if expired

### Backup & Recovery

- **Configuration Files:** All in git repository
- **Environment Variables:** Documented in `.env.yaml.example`
- **OAuth Token:** Can be regenerated anytime with `npm run auth`
- **Cloud Function:** Can be redeployed from source in minutes

## 📅 Change Log

### October 17, 2025 - Initial Deployment
- ✅ Deployed to Google Cloud Functions
- ✅ Set up Cloud Scheduler (daily at 9 AM ET)
- ✅ Configured Secret Manager for OAuth token
- ✅ Tested successfully with 70 pages
- ✅ Documentation completed

### Features Implemented
- Dynamic page discovery via CQL search
- Smart filtering (Generic, Templates, Client Summaries)
- Header-only lozenge counting
- Case normalization (Title Case + TBD/N/A exceptions)
- Individual sheet tabs per team
- Rate limiting for API quotas
- Automated scheduling

## 🎯 Future Enhancements (Potential)

### Possible Improvements

1. **Email Notifications:** Send summary email after each run
2. **Slack Integration:** Post updates to Slack channel
3. **Historical Tracking:** Keep historical data instead of overwriting
4. **Data Validation Alerts:** Notify when finding non-standard labels
5. **Performance Dashboard:** Real-time metrics visualization
6. **Multi-Region Deployment:** Redundancy for higher availability
7. **Custom Reporting:** Generate PDF/HTML reports

These are not planned but could be implemented if needed.

---

**Document Maintained By:** Blueprint Tracker System
**Last Review:** October 17, 2025
**Next Review:** December 17, 2025
