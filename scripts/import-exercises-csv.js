#!/usr/bin/env node

/**
 * CSV Exercise Import Script
 * Imports exercises from a CSV file and sets text responses as required
 */

const fs = require('fs');
const path = require('path');

// Function to parse CSV (robust implementation for multi-line cells)
function parseCSV(csvContent) {
  const rows = [];
  let currentRow = [];
  let currentCell = '';
  let inQuotes = false;
  let i = 0;
  
  while (i < csvContent.length) {
    const char = csvContent[i];
    
    if (char === '"') {
      if (inQuotes && csvContent[i + 1] === '"') {
        // Escaped quote
        currentCell += '"';
        i += 2;
        continue;
      }
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (currentCell.trim() || currentRow.length > 0) {
        currentRow.push(currentCell.trim());
        if (currentRow.some(cell => cell.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentCell = '';
      }
    } else {
      currentCell += char;
    }
    i++;
  }
  
  // Add final cell/row
  if (currentCell.trim() || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some(cell => cell.length > 0)) {
      rows.push(currentRow);
    }
  }
  
  if (rows.length === 0) return [];
  
  const headers = rows[0].map(h => h.trim());
  const exercises = [];
  
  for (let i = 1; i < rows.length; i++) {
    const values = rows[i];
    if (values.length === 0) continue;
    
    const exercise = {};
    headers.forEach((header, index) => {
      if (values[index] !== undefined) {
        exercise[header] = values[index].trim();
      }
    });
    
    // Check if we have at least a title/name
    if (exercise['Exercise Name'] || exercise.title || exercise.name) {
      exercises.push(exercise);
    }
  }
  
  return exercises;
}



// Convert CSV row to exercise format
function convertToExercise(csvRow, index) {
  // Determine category from exercise name/title
  const exerciseName = (csvRow['Exercise Name'] || '').toLowerCase();
  let category = 'self_awareness'; // default
  
  if (exerciseName.includes('story') || exerciseName.includes('who are you')) {
    category = 'self_awareness';
  } else if (exerciseName.includes('competitor') || exerciseName.includes('compete')) {
    category = 'achievement_based_identity';
  } else if (exerciseName.includes('style') || exerciseName.includes('operate')) {
    category = 'self_awareness';
  } else if (exerciseName.includes('music') || exerciseName.includes('soundtrack')) {
    category = 'creative_expression';
  } else if (exerciseName.includes('principle') || exerciseName.includes('philosophy')) {
    category = 'purpose_based_identity';
  } else if (exerciseName.includes('quotation') || exerciseName.includes('inspire')) {
    category = 'meaning';
  } else if (exerciseName.includes('gratitude')) {
    category = 'gratitude';
  } else if (exerciseName.includes('habit')) {
    category = 'habit_formation';
  } else if (exerciseName.includes('goal') || exerciseName.includes('success')) {
    category = 'goal_attainment';
  } else if (exerciseName.includes('failure') || exerciseName.includes('setback')) {
    category = 'goal_resilience';
  } else if (exerciseName.includes('vulnerability') || exerciseName.includes('courage')) {
    category = 'vulnerability';
  } else if (exerciseName.includes('joy') || exerciseName.includes('perfect day')) {
    category = 'gratitude';
  } else if (exerciseName.includes('calm') || exerciseName.includes('confidence') || exerciseName.includes('focus')) {
    category = 'mindfulness_practice';
  }

  // Create exercise object using CSV columns
  const exercise = {
    title: csvRow['Exercise Name'] || `Exercise ${index + 1}`,
    description: `Exercise from North playbook curriculum`,
    category: category,
    question: csvRow['Question'] || 'Please complete this exercise.',
    instructions: csvRow['Instructions'] || 'Take your time and provide thoughtful responses.',
    
    // Set text response as required (as requested)
    requireText: 'required',
    requireImage: 'not_required',
    requireAudio: 'not_required', 
    requireVideo: 'not_required',
    requireDocument: 'not_required',
    
    // Optional settings
    textPrompt: 'Share your thoughts and reflections...',
    maxTextLength: 2000,
    allowMultipleImages: false,
    allowMultipleDocuments: false,
    allowEditingCompleted: true,
    isActive: true,
    order: index + 1
  };

  return exercise;
}

// Main import function
async function importExercisesFromCSV(csvFilePath) {
  try {
    console.log(`📖 Reading CSV file: ${csvFilePath}`);
    
    if (!fs.existsSync(csvFilePath)) {
      throw new Error(`CSV file not found: ${csvFilePath}`);
    }
    
    const csvContent = fs.readFileSync(csvFilePath, 'utf8');
    console.log(`📊 CSV file size: ${csvContent.length} characters`);
    
    const csvData = parseCSV(csvContent);
    console.log(`📋 Parsed ${csvData.length} rows from CSV`);
    
    if (csvData.length === 0) {
      throw new Error('No valid exercise data found in CSV');
    }
    
    // Show first few rows for verification
    console.log('\n🔍 First few CSV rows:');
    csvData.slice(0, 3).forEach((row, i) => {
      console.log(`  ${i + 1}. ${JSON.stringify(row, null, 2)}`);
    });
    
    // Convert to exercise format
    const exercises = csvData.map((row, index) => convertToExercise(row, index));
    
    console.log(`\n✅ Converted ${exercises.length} exercises`);
    console.log('\n📋 Sample converted exercises:');
    exercises.slice(0, 2).forEach((ex, i) => {
      console.log(`  ${i + 1}. ${ex.title} (${ex.category})`);
      console.log(`     Question: ${ex.question.substring(0, 80)}...`);
    });
    
    // Create output file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const outputDir = path.join(__dirname, '..', 'exercises-export');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const outputFile = path.join(outputDir, `csv-import-${timestamp}.json`);
    
    const exportData = {
      metadata: {
        timestamp: new Date().toISOString(),
        source: 'csv-import',
        sourceFile: csvFilePath,
        target: 'current-environment',
        exerciseCount: exercises.length,
        notes: 'All exercises imported with text response required'
      },
      exercises: exercises
    };
    
    fs.writeFileSync(outputFile, JSON.stringify(exportData, null, 2));
    
    console.log(`\n💾 Created import file: ${outputFile}`);
    console.log('\n🚀 Next steps:');
    console.log('1. Review the generated JSON file to verify the exercises look correct');
    console.log('2. Edit any exercises that need adjustments');
    console.log(`3. Import to database: npm run import-exercises -- ${path.basename(outputFile)}`);
    
    return outputFile;
    
  } catch (error) {
    console.error('❌ Import failed:', error.message);
    throw error;
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('📖 CSV Exercise Import Tool\n');
    console.log('Usage: node scripts/import-exercises-csv.js <csv-file-path>\n');
    console.log('Example: node scripts/import-exercises-csv.js "C:\\Users\\actwr\\Documents\\North\\playbook_excercises.csv"\n');
    console.log('Features:');
    console.log('- Automatically sets text response as required for all exercises');
    console.log('- Maps common category names to valid categories');
    console.log('- Creates a JSON file ready for import');
    console.log('- Handles CSV files with various column formats');
    process.exit(1);
  }
  
  const csvFilePath = args[0];
  
  importExercisesFromCSV(csvFilePath)
    .then(outputFile => {
      console.log(`\n✅ CSV import completed successfully!`);
      console.log(`📁 Output file: ${outputFile}`);
    })
    .catch(error => {
      console.error(`\n❌ CSV import failed: ${error.message}`);
      process.exit(1);
    });
} 