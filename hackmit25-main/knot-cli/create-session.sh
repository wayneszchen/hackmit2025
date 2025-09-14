#!/bin/bash

# Knot API Session Creation Script
# Usage: ./create-session.sh [external_user_id] [environment]
# Example: ./create-session.sh USER_123 development

set -e

# Default values
EXTERNAL_USER_ID=${1:-"USER_123"}
ENVIRONMENT=${2:-"production"}

# Check required environment variables
if [ -z "$KNOT_CLIENT_ID" ] || [ -z "$KNOT_SECRET" ]; then
    echo "❌ Error: KNOT_CLIENT_ID and KNOT_SECRET environment variables must be set"
    echo "💡 Run: export KNOT_CLIENT_ID='your_client_id'"
    echo "💡 Run: export KNOT_SECRET='your_secret'"
    exit 1
fi

# Set the base URL based on environment
if [ "$ENVIRONMENT" = "development" ]; then
    BASE_URL="https://development.knotapi.com"
    echo "🔧 Using development environment"
elif [ "$ENVIRONMENT" = "production" ]; then
    BASE_URL="https://production.knotapi.com"
    echo "🚀 Using production environment"
else
    echo "❌ Error: Environment must be 'development' or 'production'"
    exit 1
fi

# Build Basic auth
AUTH=$(printf "%s:%s" "$KNOT_CLIENT_ID" "$KNOT_SECRET" | base64)

echo "🔐 Creating TransactionLink session for user: $EXTERNAL_USER_ID"
echo "🌐 Environment: $ENVIRONMENT"
echo "📡 API URL: $BASE_URL"

# Create session
RESPONSE=$(curl -sS -X POST "$BASE_URL/session/create" \
  -H "Authorization: Basic $AUTH" \
  -H "Content-Type: application/json" \
  -d "{\"type\":\"transaction_link\",\"external_user_id\":\"$EXTERNAL_USER_ID\"}")

# Check if jq is available for pretty printing
if command -v jq &> /dev/null; then
    echo "✅ Session created successfully:"
    echo "$RESPONSE" | jq
    SESSION_ID=$(echo "$RESPONSE" | jq -r '.session')
else
    echo "✅ Session created successfully:"
    echo "$RESPONSE"
    # Extract session ID without jq (basic approach)
    SESSION_ID=$(echo "$RESPONSE" | grep -o '"session":"[^"]*"' | cut -d'"' -f4)
fi

echo ""
echo "📋 Session ID: $SESSION_ID"
echo "💡 Use this session ID to initialize the Knot Web SDK"
echo "💡 Sessions are short-lived, so use it quickly!"

# Save session info to a file for later use
echo "{\"session_id\":\"$SESSION_ID\",\"external_user_id\":\"$EXTERNAL_USER_ID\",\"environment\":\"$ENVIRONMENT\",\"created_at\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" > last-session.json
echo "💾 Session details saved to last-session.json"
