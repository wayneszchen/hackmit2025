#!/bin/bash

# Knot API Transaction Sync Script
# Usage: ./sync-transactions.sh [merchant_id] [external_user_id] [environment]
# Example: ./sync-transactions.sh 36 USER_123 production

set -e

# Parse arguments
MERCHANT_ID=$1
EXTERNAL_USER_ID=$2
ENVIRONMENT=${3:-"production"}

# Check required arguments
if [ -z "$MERCHANT_ID" ] || [ -z "$EXTERNAL_USER_ID" ]; then
    echo "❌ Error: merchant_id and external_user_id are required"
    echo "💡 Usage: ./sync-transactions.sh [merchant_id] [external_user_id] [environment]"
    echo "💡 Example: ./sync-transactions.sh 36 USER_123 production"
    exit 1
fi

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

echo "📊 Syncing transactions for:"
echo "   👤 User: $EXTERNAL_USER_ID"
echo "   🏪 Merchant ID: $MERCHANT_ID"
echo "   🌐 Environment: $ENVIRONMENT"
echo ""

# Create output directory for transaction data
mkdir -p transactions
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
OUTPUT_DIR="transactions/${EXTERNAL_USER_ID}_${MERCHANT_ID}_${TIMESTAMP}"
mkdir -p "$OUTPUT_DIR"

# Function to make sync request
sync_transactions() {
    local cursor=$1
    local page_num=$2
    
    if [ -z "$cursor" ]; then
        # First page (no cursor)
        PAYLOAD="{\"merchant_id\": $MERCHANT_ID, \"external_user_id\": \"$EXTERNAL_USER_ID\", \"limit\": 100}"
        echo "📄 Fetching page $page_num (first page)..."
    else
        # Subsequent pages (with cursor)
        PAYLOAD="{\"merchant_id\": $MERCHANT_ID, \"external_user_id\": \"$EXTERNAL_USER_ID\", \"cursor\": \"$cursor\", \"limit\": 100}"
        echo "📄 Fetching page $page_num (cursor: ${cursor:0:20}...)..."
    fi
    
    curl -sS -X POST "$BASE_URL/transactions/sync" \
        -H "Authorization: Basic $AUTH" \
        -H "Content-Type: application/json" \
        -d "$PAYLOAD"
}

# Initialize counters
page_num=1
total_transactions=0
cursor=""

# Sync first page
echo "🔄 Starting transaction sync..."
response=$(sync_transactions "" $page_num)
echo "$response" > "$OUTPUT_DIR/page_${page_num}.json"

# Check if jq is available for parsing
if command -v jq &> /dev/null; then
    # Parse response with jq
    transactions_count=$(echo "$response" | jq '.transactions | length')
    cursor=$(echo "$response" | jq -r '.next_cursor // empty')
    
    echo "   ✅ Page $page_num: $transactions_count transactions"
    total_transactions=$((total_transactions + transactions_count))
    
    # Continue paging if there's a next_cursor
    while [ -n "$cursor" ] && [ "$cursor" != "null" ]; do
        page_num=$((page_num + 1))
        response=$(sync_transactions "$cursor" $page_num)
        echo "$response" > "$OUTPUT_DIR/page_${page_num}.json"
        
        transactions_count=$(echo "$response" | jq '.transactions | length')
        cursor=$(echo "$response" | jq -r '.next_cursor // empty')
        
        echo "   ✅ Page $page_num: $transactions_count transactions"
        total_transactions=$((total_transactions + transactions_count))
        
        # Safety check to prevent infinite loops
        if [ $page_num -gt 100 ]; then
            echo "⚠️  Warning: Reached maximum page limit (100). Stopping sync."
            break
        fi
    done
    
    # Combine all transactions into a single file
    echo "🔄 Combining all transactions into a single file..."
    jq -s '[.[].transactions] | flatten' "$OUTPUT_DIR"/page_*.json > "$OUTPUT_DIR/all_transactions.json"
    
else
    echo "⚠️  jq not found - saving raw responses only"
    echo "$response"
    
    # Basic cursor extraction without jq
    cursor=$(echo "$response" | grep -o '"next_cursor":"[^"]*"' | cut -d'"' -f4)
    
    # Continue paging (basic approach without transaction counting)
    while [ -n "$cursor" ] && [ "$cursor" != "null" ]; do
        page_num=$((page_num + 1))
        response=$(sync_transactions "$cursor" $page_num)
        echo "$response" > "$OUTPUT_DIR/page_${page_num}.json"
        
        cursor=$(echo "$response" | grep -o '"next_cursor":"[^"]*"' | cut -d'"' -f4)
        
        echo "   ✅ Page $page_num saved"
        
        # Safety check
        if [ $page_num -gt 100 ]; then
            echo "⚠️  Warning: Reached maximum page limit (100). Stopping sync."
            break
        fi
    done
fi

echo ""
echo "🎉 Transaction sync completed!"
echo "📁 Data saved to: $OUTPUT_DIR"
echo "📊 Total pages: $page_num"

if command -v jq &> /dev/null; then
    echo "📊 Total transactions: $total_transactions"
    echo "💾 Combined file: $OUTPUT_DIR/all_transactions.json"
fi

echo ""
echo "📋 Summary saved to: $OUTPUT_DIR/sync_summary.txt"

# Create summary file
cat > "$OUTPUT_DIR/sync_summary.txt" << EOF
Knot API Transaction Sync Summary
================================
Timestamp: $(date)
User ID: $EXTERNAL_USER_ID
Merchant ID: $MERCHANT_ID
Environment: $ENVIRONMENT
Total Pages: $page_num
$([ command -v jq &> /dev/null ] && echo "Total Transactions: $total_transactions")
Output Directory: $OUTPUT_DIR
EOF
