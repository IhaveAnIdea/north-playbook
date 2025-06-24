#!/usr/bin/env node

/**
 * Format Exercises for Manual Entry
 * Creates formatted output for easy copy-paste into the web interface
 */

const fs = require('fs');
const path = require('path');

function formatExercisesForManualEntry(filePath) {
  try {
    console.log(`📖 Reading import file: ${filePath}`);
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`Import file not found: ${filePath}`);
    }
    
    const importData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const exercises = importData.exercises || [];
    
    if (exercises.length === 0) {
      throw new Error('No exercises found in import file');
    }
    
    console.log(`\n📋 Found ${exercises.length} exercises from CSV import`);
    console.log(`\n🚀 MANUAL ENTRY GUIDE:`);
    console.log(`1. Go to http://localhost:3000/exercises/new`);
    console.log(`2. For each exercise below, copy the details and paste into the form`);
    console.log(`3. Make sure "Text Response" is set to "Required" (already configured)`);
    console.log(`4. Click "Create Exercise" for each one\n`);
    
    console.log(`${'='.repeat(80)}`);
    console.log(`EXERCISES TO CREATE (${exercises.length} total)`);
    console.log(`${'='.repeat(80)}\n`);
    
    exercises.forEach((exercise, index) => {
      console.log(`${'-'.repeat(60)}`);
      console.log(`EXERCISE ${index + 1} of ${exercises.length}`);
      console.log(`${'-'.repeat(60)}`);
      console.log(`Title: ${exercise.title}`);
      console.log(`\nCategory: ${exercise.category}`);
      console.log(`\nQuestion:`);
      console.log(exercise.question);
      console.log(`\nInstructions:`);
      console.log(exercise.instructions);
      console.log(`\nResponse Requirements:`);
      console.log(`- Text: REQUIRED ✅`);
      console.log(`- Image: Not Required`);
      console.log(`- Audio: Not Required`);
      console.log(`- Video: Not Required`);
      console.log(`- Document: Not Required`);
      console.log(`\nText Prompt: ${exercise.textPrompt || 'Share your thoughts and reflections...'}`);
      console.log(`Max Text Length: ${exercise.maxTextLength || 2000}`);
      console.log(`\n`);
    });
    
    console.log(`${'='.repeat(80)}`);
    console.log(`SUMMARY`);
    console.log(`${'='.repeat(80)}`);
    console.log(`Total exercises: ${exercises.length}`);
    console.log(`All exercises configured with text response REQUIRED`);
    console.log(`\nCategory breakdown:`);
    
    const categoryCount = {};
    exercises.forEach(exercise => {
      categoryCount[exercise.category] = (categoryCount[exercise.category] || 0) + 1;
    });
    
    Object.entries(categoryCount).forEach(([category, count]) => {
      console.log(`- ${category}: ${count} exercises`);
    });
    
    console.log(`\n🔗 Create exercises at: http://localhost:3000/exercises/new`);
    console.log(`📋 View all exercises at: http://localhost:3000/exercises/manage`);
    
    // Also create a simplified text file for easy reference
    const outputFile = path.join(__dirname, '..', 'exercises-export', 'manual-entry-guide.txt');
    let textOutput = `MANUAL EXERCISE ENTRY GUIDE\n`;
    textOutput += `Generated: ${new Date().toISOString()}\n`;
    textOutput += `Source: ${filePath}\n\n`;
    
    exercises.forEach((exercise, index) => {
      textOutput += `EXERCISE ${index + 1}: ${exercise.title}\n`;
      textOutput += `Category: ${exercise.category}\n`;
      textOutput += `Question: ${exercise.question}\n`;
      textOutput += `Instructions: ${exercise.instructions}\n`;
      textOutput += `Text Response: REQUIRED\n`;
      textOutput += `\n${'-'.repeat(50)}\n\n`;
    });
    
    fs.writeFileSync(outputFile, textOutput);
    console.log(`\n📄 Also saved reference guide to: ${outputFile}`);
    
  } catch (error) {
    console.error('❌ Formatting failed:', error.message);
    throw error;
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('📖 Exercise Manual Entry Formatter\n');
    console.log('Usage: node scripts/format-exercises-for-manual-entry.js <import-file>\n');
    console.log('Example: node scripts/format-exercises-for-manual-entry.js exercises-export/csv-import-2025-06-24.json\n');
    console.log('This script formats exercises for easy manual entry through the web interface.');
    process.exit(1);
  }
  
  const importFile = args[0];
  
  // Handle relative paths
  const fullPath = path.isAbsolute(importFile) 
    ? importFile 
    : path.join(__dirname, '..', importFile);
  
  formatExercisesForManualEntry(fullPath);
} 