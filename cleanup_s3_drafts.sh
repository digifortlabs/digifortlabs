#!/bin/bash

# S3 Draft Cleanup Script
# Run this on your EC2 instance to clean up draft folders

echo "🧹 S3 Draft Cleanup Script"
echo "=========================="
echo ""

# Navigate to project directory
cd ~/digifortlabs

# Activate virtual environment if exists
if [ -d "backend/venv" ]; then
    source backend/venv/bin/activate
fi

# Load environment variables
if [ -f "backend/.env" ]; then
    export $(cat backend/.env | grep -v '^#' | xargs)
fi

# Run the cleanup script
echo "🚀 Starting cleanup..."
python3 backend/app/scripts/cleanup_s3_drafts.py

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "💡 TIP: You can also manually check your S3 bucket:"
echo "   aws s3 ls s3://$S3_BUCKET_NAME/draft/ --recursive --human-readable --summarize"
echo "   aws s3 ls s3://$S3_BUCKET_NAME/draft_backup/ --recursive --human-readable --summarize"
