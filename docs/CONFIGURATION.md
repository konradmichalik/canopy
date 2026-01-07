# ⚙️ Configuration

This guide covers how to configure Canopy to connect to your Jira instance.

## ☁️ Jira Cloud

### Creating an API Token

1. Go to [Atlassian Account Settings](https://id.atlassian.com/manage-profile/security/api-tokens)
2. Click **Create API token**
3. Enter a label (e.g., "Canopy")
4. Copy the generated token

### Connection Settings

| Setting | Value |
|---------|-------|
| **Instance Type** | Jira Cloud |
| **Jira URL** | `https://your-domain.atlassian.net` |
| **Email** | Your Atlassian account email |
| **API Token** | The token you created above |

## 🖥️ Jira Server / Data Center

### Creating a Personal Access Token (PAT)

1. Go to your Jira profile settings
2. Navigate to **Personal Access Tokens**
3. Click **Create token**
4. Set a name and expiration date
5. Copy the generated token

### Connection Settings

| Setting | Value |
|---------|-------|
| **Instance Type** | Jira Server |
| **Jira URL** | `https://jira.your-company.com` |
| **Username** | Your Jira username |
| **Token/Password** | PAT or your password |

> **Note:** Using a Personal Access Token is recommended over username/password for better security.

## 🔄 CORS Proxy Configuration

If using the included proxy server:

| Setting | Value |
|---------|-------|
| **Proxy URL** | `http://localhost:3001/jira` |

See [Installation Guide](INSTALLATION.md#cors-proxy) for proxy setup instructions.

## 💾 Data Storage

All configuration is stored in your browser's localStorage:

| Data | Storage Key | Description |
|------|-------------|-------------|
| Connection | `canopy_connection` | Jira URL, credentials, instance type |
| Queries | `canopy_jql_queries` | Saved JQL queries with titles and colors |
| Filters | `canopy_filters` | Active filter states per query |
| Theme | `canopy_theme` | Light/dark/system preference |
| Color Theme | `canopy_color_theme` | Accent color preference |
| Display Density | `canopy_display_density` | Comfortable/compact view |
| Field Config | `canopy_field_config` | Visible fields on issue cards |
| Sort Config | `canopy_sort_config` | Sort field and direction |

## 📤 Import/Export

You can backup and transfer your configuration:

### Export

1. Click the **Settings** icon in the header
2. Select **Export Configuration**
3. Save the JSON file

### Import

1. Click the **Settings** icon in the header
2. Select **Import Configuration**
3. Choose your JSON backup file

The export includes:
- Saved JQL queries
- Filter states
- Display preferences
- Theme settings

> **Note:** Connection credentials are NOT included in exports for security reasons.

## 🗑️ Clearing Data

To reset all settings:

1. Click the **Settings** icon
2. Select **Clear All Data**
3. Confirm the action

This removes all localStorage data and returns Canopy to its initial state.
