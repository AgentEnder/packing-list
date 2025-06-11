#!/bin/bash

# Run sync flow end-to-end tests
# This script runs only the sync-related tests with proper configuration

echo "🚀 Starting Sync Flow E2E Tests"
echo "================================"

# Check if Supabase is running
if ! curl -s http://127.0.0.1:54321/health > /dev/null; then
    echo "❌ Supabase local instance not running on port 54321"
    echo "   Please start Supabase with: cd packages/supabase && supabase start"
    exit 1
fi

echo "✅ Supabase local instance detected"

# Set environment variables for tests
export VITE_SUPABASE_URL="http://127.0.0.1:54321"
export VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"

echo "🧪 Running sync flow tests..."
echo ""

# Run the sync tests specifically
npx playwright test sync-flow.spec.ts --project=chromium

# Check if tests passed
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ All sync tests passed!"
else
    echo ""
    echo "❌ Some sync tests failed"
    exit 1
fi 