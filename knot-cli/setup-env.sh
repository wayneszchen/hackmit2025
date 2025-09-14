#!/bin/bash

# Knot API Environment Setup Script
# This script helps you set up your environment variables and dependencies

echo "🔧 Knot API Environment Setup"
echo "============================="

# Check if .env file exists
if [ -f ".env" ]; then
    echo "📄 Found existing .env file"
    source .env
else
    echo "📝 Creating new .env file"
    touch .env
fi

# Function to prompt for environment variable
prompt_for_env_var() {
    local var_name=$1
    local description=$2
    local current_value=${!var_name}
    
    if [ -n "$current_value" ]; then
        echo "✅ $var_name is already set: ${current_value:0:10}..."
        read -p "   Update? (y/N): " update
        if [[ ! $update =~ ^[Yy]$ ]]; then
            return
        fi
    fi
    
    echo "🔑 $description"
    read -p "   Enter $var_name: " new_value
    
    if [ -n "$new_value" ]; then
        # Update or add to .env file
        if grep -q "^$var_name=" .env; then
            # Update existing
            sed -i '' "s/^$var_name=.*/$var_name=$new_value/" .env
        else
            # Add new
            echo "$var_name=$new_value" >> .env
        fi
        export $var_name="$new_value"
        echo "   ✅ $var_name set successfully"
    else
        echo "   ⚠️  Skipped $var_name"
    fi
}

# Prompt for API credentials
echo ""
echo "🔐 API Credentials Setup"
echo "Get these from your Knot Dashboard → Overview"
prompt_for_env_var "KNOT_CLIENT_ID" "Your Knot API Client ID"
prompt_for_env_var "KNOT_SECRET" "Your Knot API Secret"

# Check for required tools
echo ""
echo "🛠️  Checking Dependencies"

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "✅ Node.js: $NODE_VERSION"
else
    echo "❌ Node.js not found"
    echo "   Install from: https://nodejs.org/"
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo "✅ npm: $NPM_VERSION"
else
    echo "❌ npm not found"
fi

# Check curl
if command -v curl &> /dev/null; then
    echo "✅ curl: available"
else
    echo "❌ curl not found"
fi

# Check jq (optional but recommended)
if command -v jq &> /dev/null; then
    JQ_VERSION=$(jq --version)
    echo "✅ jq: $JQ_VERSION"
else
    echo "⚠️  jq not found (optional but recommended for JSON parsing)"
    echo "   Install with: brew install jq"
fi

# Check ngrok (optional)
if command -v ngrok &> /dev/null; then
    echo "✅ ngrok: available"
else
    echo "⚠️  ngrok not found (needed for webhook testing)"
    echo "   Install with: brew install ngrok"
fi

# Source the .env file for current session
if [ -f ".env" ]; then
    echo ""
    echo "📋 Loading environment variables..."
    source .env
    echo "✅ Environment variables loaded"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Set up webhooks in Knot Dashboard → Webhooks"
echo "2. Run: source .env (to load variables in current shell)"
echo "3. Run: node webhook.js (to start webhook server)"
echo "4. Run: ngrok http 3000 (to expose webhook publicly)"
echo "5. Run: ./create-session.sh (to create a session)"
echo ""
echo "💡 Tip: Add 'source .env' to your shell profile to auto-load variables"
