#!/bin/bash
# Script to generate a secure JWT secret
# Run this script and copy the output to your .env files

echo "==================================="
echo "🔐 JWT Secret Generator"
echo "==================================="
echo ""
echo "Generated JWT Secret (copy this to your .env files):"
echo ""

# Generate a secure random string using openssl
if command -v openssl &> /dev/null; then
    JWT_SECRET=$(openssl rand -base64 32)
    echo "JWT_SECRET=$JWT_SECRET"
else
    echo "OpenSSL not found. Please install OpenSSL or use an online generator."
    echo "Alternative: Use this website: https://generate-random.org/api-key-generator?count=1&length=32&type=mixed-numbers"
fi

echo ""
echo "==================================="
echo "💾 Save this secret securely!"
echo "⚠️  Never commit this to git!"
echo "==================================="
