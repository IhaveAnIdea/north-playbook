#!/usr/bin/env node

/**
 * Manual Exercise Export Helper
 * Creates templates and guides for manually exporting exercises
 */

const fs = require('fs');
const path = require('path');

// Create exercises-export directory if it doesn't exist
const exportDir = path.join(__dirname, '..', 'exercises-export');
if (!fs.existsSync(exportDir)) {
  fs.mkdirSync(exportDir, { recursive: true });
}

function createManualExportTemplate() {
  console.log('📝 Creating manual exercise export template...');
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  const templatePath = path.join(exportDir, `manual-exercises-${timestamp}.json`);
  
  const template = {
    metadata: {
      timestamp: new Date().toISOString(),
      source: 'manual-sandbox',
      target: 'production',
      instructions: [
        "1. Copy your exercises from the sandbox UI into the 'exercises' array below",
        "2. Make sure each exercise has all required fields",
        "3. Save this file and run: npm run import-exercises -- manual-exercises-YYYY-MM-DD.json"
      ]
    },
    exercises: [
      {
        title: "Example: Self-Reflection Exercise",
        description: "A sample exercise to show the format",
        category: "self_awareness",
        question: "What are three things you learned about yourself today?",
        instructions: "Take 5-10 minutes to reflect on your day. Write down specific examples and insights.",
        
        // Response requirements - use the new enum format
        requireText: "required",        // "not_required", "required", or "or"
        requireImage: "not_required",   // "not_required", "required", or "or"  
        requireAudio: "not_required",   // "not_required", "required", or "or"
        requireVideo: "not_required",   // "not_required", "required", or "or"
        requireDocument: "not_required", // "not_required", "required", or "or"
        
        // Optional settings
        textPrompt: "Describe your insights here...",
        maxTextLength: 1000,
        allowMultipleImages: false,
        allowMultipleDocuments: false,
        allowEditingCompleted: true,
        isActive: true,
        order: 1
      },
      {
        title: "Example: Media OR Exercise", 
        description: "Example showing OR logic - user needs either image OR video",
        category: "creative_expression",
        question: "Share a moment from your day through media",
        instructions: "Choose to either upload a photo OR record a short video that captures something meaningful from your day.",
        
        // OR logic example - user must provide either image OR video
        requireText: "not_required",
        requireImage: "or",           // This creates an OR group
        requireAudio: "not_required", 
        requireVideo: "or",           // This creates an OR group with image
        requireDocument: "not_required",
        
        textPrompt: "Optional: Add a caption or description",
        maxTextLength: 500,
        allowMultipleImages: true,
        allowMultipleDocuments: false,
        allowEditingCompleted: true,
        isActive: true,
        order: 2
      }
      // Add your actual exercises here...
    ],
    
    // Valid categories for reference
    validCategories: [
      "connection_to_nature", "habit_formation", "goal_resilience", 
      "substance_use", "self_compassion", "goal_attainment", "worry",
      "high_standard_friends", "mindfulness_practice", "sleep_and_rest",
      "purpose", "self_worth", "emotional_re_appraisal", "perfectionism",
      "achievement_based_identity", "self_auditing", "purpose_based_identity",
      "connection_and_belonging", "tribe", "purpose_beyond_self",
      "diet_and_nutrition", "goal_pursuit", "self_talk", "loving_relationships",
      "gratitude", "meaning", "exercise", "self_awareness", "vulnerability",
      "rumination", "creative_expression", "success_comparison", "long_term_focus"
    ]
  };
  
  fs.writeFileSync(templatePath, JSON.stringify(template, null, 2));
  
  console.log(`✅ Created manual export template:`);
  console.log(`📁 ${templatePath}`);
  console.log('\n📋 Next steps:');
  console.log('1. Open the file in your editor');
  console.log('2. Replace the example exercises with your actual exercises');
  console.log('3. Make sure to use the correct category names and requirement types');
  console.log('4. Save the file');
  console.log(`5. Run: npm run import-exercises -- ${path.basename(templatePath)}`);
  
  return templatePath;
}

function showExerciseCollectionGuide() {
  console.log('📋 How to collect your exercises from the sandbox:\n');
  
  console.log('🔍 Method 1: From the UI');
  console.log('1. Go to http://localhost:3000/exercises/manage');
  console.log('2. Take screenshots or copy the exercise details');
  console.log('3. For each exercise, note down:');
  console.log('   - Title');
  console.log('   - Description'); 
  console.log('   - Category');
  console.log('   - Question');
  console.log('   - Instructions');
  console.log('   - Required response types (text, image, audio, video, document)');
  console.log('   - Whether any are OR requirements\n');
  
  console.log('🔍 Method 2: From Browser Developer Tools');
  console.log('1. Go to http://localhost:3000/exercises/manage');
  console.log('2. Open Developer Tools (F12)');
  console.log('3. Go to Network tab');
  console.log('4. Refresh the page');
  console.log('5. Look for the /api/exercises request');
  console.log('6. Copy the response data\n');
  
  console.log('🔍 Method 3: Direct Database Query (if you have access)');
  console.log('1. Access your AWS console');
  console.log('2. Go to DynamoDB');
  console.log('3. Find the Exercise table');
  console.log('4. Export the items\n');
  
  console.log('💡 Once you have the exercise data:');
  console.log('1. Run: npm run create-exercise-template');
  console.log('2. Edit the generated JSON file');
  console.log('3. Run: npm run import-exercises -- <filename>');
}

// List existing export files
function listExports() {
  if (!fs.existsSync(exportDir)) {
    console.log('📁 No exports directory found');
    return [];
  }
  
  const files = fs.readdirSync(exportDir);
  const exportFiles = files.filter(f => f.includes('exercises') && f.endsWith('.json'));
  
  if (exportFiles.length === 0) {
    console.log('📁 No exercise export files found');
    return [];
  }
  
  console.log('📋 Available exercise export files:');
  exportFiles.forEach((file, index) => {
    const filePath = path.join(exportDir, file);
    const stats = fs.statSync(filePath);
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const exerciseCount = data.exercises ? data.exercises.length : 0;
      console.log(`  ${index + 1}. ${file}`);
      console.log(`     📊 ${exerciseCount} exercises, ${stats.size} bytes`);
      console.log(`     📅 ${stats.mtime.toISOString()}`);
    } catch (error) {
      console.log(`  ${index + 1}. ${file} (invalid JSON)`);
    }
  });
  
  return exportFiles.map(f => path.join(exportDir, f));
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--list')) {
    listExports();
    process.exit(0);
  }
  
  if (args.includes('--guide')) {
    showExerciseCollectionGuide();
    process.exit(0);
  }
  
  // Default: Create manual template
  try {
    createManualExportTemplate();
    console.log('\n💡 Need help collecting your exercises?');
    console.log('   npm run create-exercise-template -- --guide');
  } catch (error) {
    console.error('❌ Failed to create template:', error.message);
    process.exit(1);
  }
}

module.exports = { 
  createManualExportTemplate, 
  showExerciseCollectionGuide,
  listExports 
}; 