#!/bin/bash

# Script to save Hebrew questionnaire to MongoDB
# This script opens the browser to the save questionnaire page

echo "🚀 Opening Save Hebrew Questionnaire page..."
echo "📋 Make sure your application is running on http://localhost:5173"
echo "🔐 You need to be logged in as an Admin user"
echo ""

# Try to open the URL in the default browser
if command -v start &> /dev/null; then
    # Windows
    start "http://localhost:5173/layout/save-hebrew-questionnaire"
elif command -v open &> /dev/null; then
    # macOS
    open "http://localhost:5173/layout/save-hebrew-questionnaire"
elif command -v xdg-open &> /dev/null; then
    # Linux
    xdg-open "http://localhost:5173/layout/save-hebrew-questionnaire"
else
    echo "Please open your browser and navigate to:"
    echo "http://localhost:5173/layout/save-hebrew-questionnaire"
fi

echo ""
echo "📝 Instructions:"
echo "1. Log in as an Admin user"
echo "2. Click 'בדוק תקינות השאלון' to validate the questionnaire"
echo "3. Click 'שמור שאלון למסד הנתונים' to save it to MongoDB"
echo "4. The questionnaire will be saved with all 13 groups and questions"
