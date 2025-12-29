# Hebrew Questionnaire Setup Guide

This guide explains how to save the comprehensive Hebrew questionnaire for teaching children with disorders to your MongoDB database.

## Questionnaire Overview

**Title:** שאלון הוראה לילדים עם הפרעות  
**Description:** שאלון מקיף לבחינת שיטות הוראה והתנהגות כלפי ילדים עם הפרעות למידה והתנהגות

### Structure:
- **13 Question Groups** covering different aspects of teaching children with disorders
- **15 Total Questions** with detailed Hebrew options
- **All questions are graphable** for comprehensive analytics
- **5-point rating scale** for each question (1-5)

### Question Groups:
1. **היבטים התנהגותיים** - Behavioral Aspects
2. **התנהגות רגשית** - Emotional Behavior
3. **קושי אקדמי** - Academic Difficulties
4. **רמת מרץ** - Energy Level
5. **אסטרטגיות הוראה** - Teaching Strategies
6. **רגישות חיצונית** - External Sensitivity
7. **ניהול חברון** - Social Management
8. **יכולות למידה** - Learning Abilities (2 questions)
9. **הרגלי עבודה** - Work Habits
10. **מוטוריקה** - Motor Skills
11. **עצמאות** - Independence
12. **מעבר בין פעילויות** - Activity Transitions
13. **הגדרה אישית** - Personal Definition

## How to Save the Questionnaire

### Method 1: Using the Web Interface (Recommended)

1. **Start your application:**
   ```bash
   cd my-app
   npm run dev
   ```

2. **Run the helper script:**
   - **Windows PowerShell:**
     ```powershell
     .\scripts\save-hebrew-questionnaire.ps1
     ```
   - **Bash/Linux/macOS:**
     ```bash
     ./scripts/save-hebrew-questionnaire.sh
     ```

3. **In the browser:**
   - Navigate to: `http://localhost:5173/layout/save-hebrew-questionnaire`
   - Log in as an **Admin** user
   - Click **"בדוק תקינות השאלון"** to validate the questionnaire
   - Click **"שמור שאלון למסד הנתונים"** to save it to MongoDB

### Method 2: Direct Navigation

1. Make sure your application is running on `http://localhost:5173`
2. Log in as an Admin user
3. Navigate directly to: `http://localhost:5173/layout/save-hebrew-questionnaire`
4. Follow the on-screen instructions

## Files Involved

- **`SaveHebrewQuestionnaire.tsx`** - React component with UI for saving
- **`hebrewQuestionnaireData.ts`** - Complete questionnaire data and conversion utilities
- **`hebrew_questionnaire_data.json`** - Original JSON structure
- **`questionnaireApi.ts`** - API service for questionnaire operations

## Technical Details

### Data Structure
The questionnaire uses the enhanced `FormNode` structure with:
- Hierarchical groups and questions
- Graphable properties for analytics
- Hebrew RTL text support
- 5-point rating scales
- Comprehensive metadata

### API Integration
- **Validation:** Validates structure before saving
- **Creation:** Saves to MongoDB via `/api/questionnaires/templates`
- **Analytics:** All questions configured for graphable analytics

### Color Coding
- **נמוך (Low):** 1-2 points - Red (#ef4444)
- **בינוני (Medium):** 3 points - Yellow (#fbbf24)
- **גבוה (High):** 4-5 points - Green (#10b981)

## Troubleshooting

### Common Issues:

1. **"Cannot access page"**
   - Ensure you're logged in as an Admin user
   - Check that the application is running on port 5173

2. **"Failed to save questionnaire"**
   - Check MongoDB connection
   - Verify form-service is running on port 4003
   - Check server logs for detailed errors

3. **"Validation failed"**
   - Check console for detailed validation errors
   - Ensure all question structures are properly formatted

### Verification

After successful save, you can verify by:
1. Going to the Questionnaires list page
2. Checking MongoDB directly for the new questionnaire document
3. Trying to fill out the form with a student

## Next Steps

After saving the questionnaire:
1. **Test filling it out** with a student
2. **Review analytics** to ensure graphs display correctly
3. **Create form submissions** to test the full workflow
4. **Export/analyze data** using the built-in analytics features

---

**Note:** This questionnaire is specifically designed for Hebrew speakers and includes comprehensive assessment criteria for teaching children with learning and behavioral disorders.
