# Exercise Sync Guide 🔄

## The Problem
Your exercises are currently in the **sandbox environment** (ephemeral) and need to be moved to **production** (persistent) so they don't get lost.

## Solution: 3 Methods to Sync Exercises

### Method 1: Automatic Sync (If API is Working)
```bash
# This will export from sandbox and import to production automatically
npm run sync-exercises
```

### Method 2: Manual Template (Recommended - Always Works)
```bash
# Step 1: Create a template file
npm run create-exercise-template

# Step 2: Edit the generated JSON file with your exercises
# (Open exercises-export/manual-exercises-YYYY-MM-DD.json)

# Step 3: Import to production
npm run import-exercises -- manual-exercises-YYYY-MM-DD.json
```

### Method 3: Get Help Collecting Exercise Data
```bash
# Shows you exactly how to collect your exercise data
npm run create-exercise-template -- --guide
```

## Step-by-Step: Manual Method (Most Reliable)

### Step 1: Collect Your Exercise Data
1. **Go to your sandbox**: `http://localhost:3000/exercises/manage`
2. **For each exercise, note down**:
   - Title
   - Description  
   - Category
   - Question
   - Instructions
   - Required response types (text, image, audio, video, document)
   - Whether any requirements are "OR" (like "text OR image")

### Step 2: Create Template
```bash
npm run create-exercise-template
```
This creates: `exercises-export/manual-exercises-YYYY-MM-DD.json`

### Step 3: Edit Template
Open the JSON file and replace the examples with your actual exercises:

```json
{
  "exercises": [
    {
      "title": "Your Exercise Title",
      "description": "What this exercise is about",
      "category": "self_awareness", // See valid categories in file
      "question": "The main question users answer",
      "instructions": "Detailed instructions for users",
      
      // Response requirements (the new enum format)
      "requireText": "required",        // or "not_required" or "or"
      "requireImage": "not_required",   // or "required" or "or"
      "requireAudio": "not_required",   // or "required" or "or"
      "requireVideo": "not_required",   // or "required" or "or"
      "requireDocument": "not_required", // or "required" or "or"
      
      // Optional settings
      "textPrompt": "Custom prompt for text input",
      "maxTextLength": 1000,
      "allowMultipleImages": false,
      "allowMultipleDocuments": false,
      "allowEditingCompleted": true,
      "isActive": true,
      "order": 1
    }
  ]
}
```

### Step 4: Import to Production
```bash
npm run import-exercises -- manual-exercises-YYYY-MM-DD.json
```

## Understanding the OR Logic

The new system supports three states for each response type:

- **`"not_required"`**: Optional - users can provide this but don't have to
- **`"required"`**: Required - users must provide this  
- **`"or"`**: OR group - users must provide at least one from the OR group

### Examples:

**Text is required, everything else optional:**
```json
{
  "requireText": "required",
  "requireImage": "not_required",
  "requireAudio": "not_required",
  "requireVideo": "not_required", 
  "requireDocument": "not_required"
}
```

**User must provide either text OR image:**
```json
{
  "requireText": "or",
  "requireImage": "or", 
  "requireAudio": "not_required",
  "requireVideo": "not_required",
  "requireDocument": "not_required"
}
```

**Text is required, plus either video OR document:**
```json
{
  "requireText": "required",
  "requireImage": "not_required",
  "requireAudio": "not_required", 
  "requireVideo": "or",
  "requireDocument": "or"
}
```

## Valid Categories

Use one of these for the `category` field:
- `connection_to_nature`
- `habit_formation` 
- `goal_resilience`
- `substance_use`
- `self_compassion`
- `goal_attainment`
- `worry`
- `high_standard_friends`
- `mindfulness_practice`
- `sleep_and_rest`
- `purpose`
- `self_worth`
- `emotional_re_appraisal`
- `perfectionism`
- `achievement_based_identity`
- `self_auditing`
- `purpose_based_identity`
- `connection_and_belonging`
- `tribe`
- `purpose_beyond_self`
- `diet_and_nutrition`
- `goal_pursuit`
- `self_talk`
- `loving_relationships`
- `gratitude`
- `meaning`
- `exercise`
- `self_awareness`
- `vulnerability`
- `rumination`
- `creative_expression`
- `success_comparison`
- `long_term_focus`

## Troubleshooting

### If Automatic Sync Fails
```bash
# The API might not be working - use manual method instead
npm run create-exercise-template
```

### If Import Fails
- Check that your JSON is valid
- Make sure all required fields are present
- Verify category names are from the valid list
- Ensure requirement values are "not_required", "required", or "or"

### Check Available Files
```bash
# List all export files
npm run create-exercise-template -- --list
```

## Quick Commands

| Command | Purpose |
|---------|---------|
| `npm run sync-exercises` | Auto sync (if API works) |
| `npm run create-exercise-template` | Create manual template |
| `npm run create-exercise-template -- --guide` | Show collection guide |
| `npm run import-exercises -- <file>` | Import specific file |
| `npm run create-exercise-template -- --list` | List export files |

## After Syncing

1. **Deploy to production**: `npm run deploy:production`
2. **Test your exercises** in the production environment
3. **Verify the OR logic** is working correctly
4. **Your exercises are now safe!** 🛡️

---

**Your exercises will never be lost again once they're in production!** ✅ 