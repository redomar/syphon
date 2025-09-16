#!/bin/bash

# =============================================================================
# DOKPLOY/DOCKER CLEANUP SCRIPT FOR SYPHON DEPLOYMENT
# =============================================================================
# This script helps free up disk space on the deployment server
# Run this before deployment if you encounter ENOSPC errors

echo "🧹 Starting Docker cleanup process..."

# Remove unused Docker images
echo "📦 Cleaning up unused Docker images..."
docker image prune -a -f

# Remove unused volumes
echo "💾 Cleaning up unused volumes..."
docker volume prune -f

# Remove unused networks
echo "🌐 Cleaning up unused networks..."
docker network prune -f

# Remove build cache
echo "🔧 Cleaning up Docker build cache..."
docker builder prune -a -f

# Remove stopped containers
echo "🗑️ Removing stopped containers..."
docker container prune -f

# Show disk usage
echo "💽 Current disk usage:"
df -h

# Show Docker disk usage
echo "🐳 Docker disk usage:"
docker system df

echo "✅ Cleanup completed!"
echo ""
echo "📋 To run this script on your Dokploy server:"
echo "   1. SSH into your server"
echo "   2. Run: curl -fsSL https://raw.githubusercontent.com/redomar/syphon/develop/deployment/cleanup.sh | bash"
echo "   3. Or copy this script and run it manually"
echo ""
echo "⚠️  If you still get ENOSPC errors:"
echo "   - Check available disk space with 'df -h'"
echo "   - Consider upgrading server storage"
echo "   - Remove old application containers manually"