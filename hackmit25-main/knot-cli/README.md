# Knot API Terminal Cookbook

A complete terminal-only implementation for working with the Knot API to create TransactionLink sessions, receive webhooks, and sync transaction data.

## 🚀 Quick Start

1. **Setup environment and dependencies:**
   ```bash
   ./setup-env.sh
   ```

2. **Start the webhook server:**
   ```bash
   node webhook.js
   ```

3. **In a new terminal, expose webhook publicly:**
   ```bash
   ngrok http 3000
   ```

4. **Create a session:**
   ```bash
   ./create-session.sh USER_123 production
   ```

5. **When webhook fires, sync transactions:**
   ```bash
   ./sync-transactions.sh 36 USER_123 production
   ```

## 📁 Project Structure

```
knot-cli/
├── README.md              # This file
├── setup-env.sh          # Environment setup script
├── webhook.js            # Webhook server
├── create-session.sh     # Session creation script
├── sync-transactions.sh  # Transaction sync script
├── package.json          # Node.js dependencies
├── .env                  # Environment variables (created by setup)
├── last-session.json     # Last created session info
└── transactions/         # Transaction data output directory
```

## 🔧 Prerequisites

### Required Tools
- **Node.js & npm** - For running the webhook server
- **curl** - For API requests (usually pre-installed)
- **bash** - For running scripts (usually pre-installed)

### Optional but Recommended
- **jq** - For JSON parsing and pretty printing
  ```bash
  brew install jq  # macOS
  # or
  apt-get install jq  # Linux
  ```
- **ngrok** - For exposing local webhook publicly
  ```bash
  brew install ngrok  # macOS
  ```

### API Credentials
Get these from your [Knot Dashboard](https://dashboard.knotapi.com):
1. Go to **Dashboard → Overview**
2. Copy your `client_id` and `secret`
3. Set up webhook URL in **Dashboard → Webhooks**

## 🛠️ Setup Instructions

### 1. Environment Setup
Run the setup script to configure your environment:
```bash
./setup-env.sh
```

This will:
- Prompt for your Knot API credentials
- Create a `.env` file
- Check for required dependencies
- Provide next steps

### 2. Load Environment Variables
```bash
source .env
```

Or set them manually:
```bash
export KNOT_CLIENT_ID="your_client_id"
export KNOT_SECRET="your_secret"
```

## 📡 Webhook Setup

### 1. Start Webhook Server
```bash
node webhook.js
```

The server will listen on `http://localhost:3000/webhooks/knot`

### 2. Expose Webhook Publicly
In a new terminal:
```bash
ngrok http 3000
```

Copy the `https://` URL (e.g., `https://abc123.ngrok.io`)

### 3. Configure in Knot Dashboard
1. Go to **Dashboard → Webhooks**
2. Add your ngrok URL: `https://abc123.ngrok.io/webhooks/knot`
3. Save the configuration

## 🔐 Session Management

### Create a Session
```bash
./create-session.sh [external_user_id] [environment]
```

**Examples:**
```bash
# Production environment (default)
./create-session.sh USER_123

# Development environment
./create-session.sh USER_123 development

# Custom user ID
./create-session.sh CUSTOMER_456 production
```

**Output:**
- Session ID for SDK initialization
- Session details saved to `last-session.json`

## 📊 Transaction Syncing

### Automatic (Webhook-Triggered)
When a user completes account linking, Knot sends a `NEW_TRANSACTIONS_AVAILABLE` webhook. The webhook server will log:
```json
{
  "event": "NEW_TRANSACTIONS_AVAILABLE",
  "external_user_id": "USER_123",
  "merchant": {
    "id": 36,
    "name": "Uber Eats"
  }
}
```

Use these details to sync transactions:
```bash
./sync-transactions.sh 36 USER_123 production
```

### Manual Sync
```bash
./sync-transactions.sh [merchant_id] [external_user_id] [environment]
```

**Examples:**
```bash
# Sync Uber Eats transactions
./sync-transactions.sh 36 USER_123 production

# Development environment
./sync-transactions.sh 36 USER_123 development
```

### Output
- Individual page files: `transactions/USER_123_36_timestamp/page_N.json`
- Combined file: `transactions/USER_123_36_timestamp/all_transactions.json`
- Summary: `transactions/USER_123_36_timestamp/sync_summary.txt`

## 🧪 Testing

### Test Webhook Locally
Simulate a webhook event:
```bash
curl -X POST http://localhost:3000/webhooks/knot \
  -H "Content-Type: application/json" \
  -d '{
    "event": "NEW_TRANSACTIONS_AVAILABLE",
    "external_user_id": "USER_123",
    "merchant": {
      "id": 36,
      "name": "Uber Eats"
    }
  }'
```

### Development Environment
The development environment generates ~205 test transactions when you complete a link, making it perfect for testing the full flow.

## 🌐 Environment Configuration

### Production
- **Base URL:** `https://production.knotapi.com`
- **Use for:** Real merchant connections
- **Default environment**

### Development
- **Base URL:** `https://development.knotapi.com`
- **Use for:** Testing with mock data
- **Generates sample transactions**

## 📋 Common Workflows

### Complete Flow (Terminal Only)
1. **Setup (one-time):**
   ```bash
   ./setup-env.sh
   source .env
   ```

2. **Start services:**
   ```bash
   # Terminal 1: Webhook server
   node webhook.js
   
   # Terminal 2: Expose publicly
   ngrok http 3000
   ```

3. **Create session:**
   ```bash
   ./create-session.sh USER_123 production
   ```

4. **Wait for webhook, then sync:**
   ```bash
   # When webhook fires with merchant_id 36
   ./sync-transactions.sh 36 USER_123 production
   ```

### Development Testing
```bash
# Use development environment for testing
./create-session.sh TEST_USER development
# Complete link in browser/app
# Webhook will fire automatically
./sync-transactions.sh [merchant_id] TEST_USER development
```

## 🔍 Troubleshooting

### Common Issues

**"KNOT_CLIENT_ID and KNOT_SECRET environment variables must be set"**
- Run `./setup-env.sh` or manually export variables
- Ensure `.env` file exists and run `source .env`

**Webhook not receiving events**
- Check ngrok is running and URL is correct in Dashboard
- Verify webhook server is running on port 3000
- Check Knot Dashboard webhook configuration

**Session creation fails**
- Verify API credentials are correct
- Check network connectivity
- Ensure environment (development/production) is correct

**No transactions returned**
- Verify merchant_id and external_user_id are correct
- Check that user has completed account linking
- Ensure webhook event was received first

### Debug Mode
Add debug output to scripts:
```bash
# Enable verbose curl output
export CURL_VERBOSE="-v"

# Check environment variables
env | grep KNOT
```

## 📚 API Reference

### Endpoints Used
- `POST /session/create` - Create TransactionLink session
- `POST /transactions/sync` - Sync transaction data

### Authentication
- **Method:** HTTP Basic Auth
- **Format:** `client_id:secret` (base64 encoded)
- **Header:** `Authorization: Basic [encoded_credentials]`

### Webhook Events
- `NEW_TRANSACTIONS_AVAILABLE` - New transactions ready
- `UPDATED_TRANSACTIONS_AVAILABLE` - Existing transactions updated

## 🔗 Useful Links

- [Knot API Documentation](https://docs.knotapi.com)
- [Knot Dashboard](https://dashboard.knotapi.com)
- [Web SDK Documentation](https://docs.knotapi.com/web-sdk)
- [ngrok Documentation](https://ngrok.com/docs)

## 📄 License

This project is provided as-is for educational and development purposes.
