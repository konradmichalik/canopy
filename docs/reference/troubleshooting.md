---
title: Troubleshooting
description: Common issues and solutions
---

# Troubleshooting

Solutions for common problems when using Canopy.

## Connection Issues

### "CORS error" or "Network error"

**Web version only:**
- Ensure the CORS proxy is running (`cd proxy && npm start`)
- Verify the proxy URL is correctly entered (`http://localhost:3001/jira`)
- Check that `JIRA_BASE_URL` environment variable is set correctly

**Using the online version:**
- The [Vercel-hosted version](https://jira-canopy.vercel.app) requires a CORS proxy
- Consider using the desktop app for direct connections

### "401 Unauthorized"

- **Jira Cloud:** Verify you're using your email address (not username)
- **Jira Cloud:** Ensure the API token is correct and not expired
- **Jira Server:** Check if your PAT has expired
- **All:** Verify your account has access to the Jira projects

### "403 Forbidden"

- Your account lacks permissions for the requested resources
- Check project-level permissions in Jira
- Verify the JQL query only accesses projects you have access to

### "Connection timeout"

- Check if your Jira instance is accessible
- Verify firewall rules allow connections
- Try accessing Jira directly in your browser first
- For corporate networks: check VPN requirements

## Desktop App Issues

### "App is damaged" (macOS)

Remove the quarantine attribute:
```bash
xattr -cr /Applications/Canopy.app
```

Or right-click the app, select "Open", and confirm.

### CORS errors in desktop app

If CORS errors occur despite using Tauri:
1. Verify the app is running in Tauri (not in browser)
2. Restart the app completely
3. Check `src-tauri/capabilities/default.json` for HTTP permissions

### Build fails: "linker `cc` not found"

**macOS:**
```bash
xcode-select --install
```

**Linux:**
```bash
sudo apt install build-essential
```

### Build fails: "webkit2gtk not found"

**Linux:**
```bash
sudo apt install libwebkit2gtk-4.1-dev
```

## Query Issues

### "No issues found"

- Verify the JQL syntax is correct
- Test the query directly in Jira
- Check if filters are hiding results
- Ensure you have access to the queried projects

### "JQL syntax error"

Common mistakes:
- Missing quotes around values with spaces
- Using `=` instead of `~` for text search
- Invalid field names

**Examples:**
```sql
-- Wrong
project = My Project

-- Correct
project = "My Project"
```

### Issues missing from hierarchy

- Parent issues might not match the JQL query
- Check if Epic Link field is configured (Server instances)
- Verify parent-child links exist in Jira

## Performance Issues

### Slow loading

- Reduce the JQL result set size
- Add filters to limit results (e.g., `sprint in openSprints()`)
- Check network connection speed
- Disable unused fields in Settings

### Browser becomes unresponsive

- Query returns too many issues (1000+)
- Add more restrictive JQL conditions
- Use pagination or limit results

## Data Issues

### Settings lost after browser update

- Check if localStorage was cleared
- Use Export/Import to backup settings
- Consider using the desktop app for persistent storage

### Queries not syncing between devices

- Canopy stores data locally only
- Use Export/Import to transfer settings
- Settings are per-browser, per-profile

## Getting Help

If your issue isn't covered here:

1. Check [GitHub Issues](https://github.com/konradmichalik/canopy/issues)
2. Enable Debug Mode (Settings) and check browser console
3. Open a new issue with:
   - Browser/OS version
   - Jira version (Cloud/Server)
   - Steps to reproduce
   - Console error messages
