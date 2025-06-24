#!/usr/bin/env node

/**
 * Direct Exercise Import Script
 * Imports exercises directly to the database, bypassing API issues
 */

const fs = require('fs');
const path = require('path');

// Import Amplify configuration
const { Amplify } = require('aws-amplify');
const { generateClient } = require('aws-amplify/api');

// Import the outputs configuration
const amplifyConfig = require('../amplify_outputs.json');

// Configure Amplify
Amplify.configure(amplifyConfig);

// Create API client
const client = generateClient();

// GraphQL mutations for exercises
const createExerciseMutation = `
  mutation CreateExercise($input: CreateExerciseInput!) {
    createExercise(input: $input) {
      id
      title
      description
      category
      question
      instructions
      requireText
      requireImage
      requireAudio
      requireVideo
      requireDocument
      textPrompt
      maxTextLength
      allowMultipleImages
      allowMultipleDocuments
      allowEditingCompleted
      isActive
      order
      createdAt
      updatedAt
    }
  }
`;

async function importExercisesDirect(filePath) {
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
    
    console.log(`📦 Found ${exercises.length} exercises to import`);
    
    let successCount = 0;
    let failCount = 0;
    
    for (const exercise of exercises) {
      try {
        console.log(`📝 Importing: ${exercise.title}...`);
        
        // Prepare exercise data for GraphQL
        const exerciseInput = {
          title: exercise.title,
          description: exercise.description,
          category: exercise.category,
          question: exercise.question,
          instructions: exercise.instructions,
          requireText: exercise.requireText || 'not_required',
          requireImage: exercise.requireImage || 'not_required',
          requireAudio: exercise.requireAudio || 'not_required',
          requireVideo: exercise.requireVideo || 'not_required',
          requireDocument: exercise.requireDocument || 'not_required',
          textPrompt: exercise.textPrompt,
          maxTextLength: exercise.maxTextLength || 2000,
          allowMultipleImages: exercise.allowMultipleImages || false,
          allowMultipleDocuments: exercise.allowMultipleDocuments || false,
          allowEditingCompleted: exercise.allowEditingCompleted || true,
          isActive: exercise.isActive !== false,
          order: exercise.order || (successCount + 1)
        };
        
        // Execute GraphQL mutation
        const result = await client.graphql({
          query: createExerciseMutation,
          variables: {
            input: exerciseInput
          }
        });
        
        if (result.data && result.data.createExercise) {
          successCount++;
          console.log(`   ✅ Success (ID: ${result.data.createExercise.id})`);
        } else {
          failCount++;
          console.log(`   ❌ Failed: No data returned`);
          if (result.errors) {
            console.log(`      Errors: ${JSON.stringify(result.errors)}`);
          }
        }
        
      } catch (error) {
        failCount++;
        console.log(`   ❌ Failed: ${error.message}`);
        if (error.errors) {
          console.log(`      GraphQL Errors: ${JSON.stringify(error.errors)}`);
        }
      }
    }
    
    console.log(`\n📊 Import Summary:`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${failCount}`);
    console.log(`   📋 Total: ${exercises.length}`);
    
    if (successCount > 0) {
      console.log(`\n🎉 Successfully imported ${successCount} exercises!`);
      console.log('🔗 Visit http://localhost:3000/exercises to see them');
    }
    
    return { successCount, failCount, total: exercises.length };
    
  } catch (error) {
    console.error('❌ Import failed:', error.message);
    throw error;
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('📖 Direct Exercise Import Tool\n');
    console.log('Usage: node scripts/direct-import-exercises.js <import-file>\n');
    console.log('Example: node scripts/direct-import-exercises.js exercises-export/csv-import-2025-06-24.json\n');
    console.log('This script imports exercises directly to the database, bypassing API issues.');
    process.exit(1);
  }
  
  const importFile = args[0];
  
  // Handle relative paths
  const fullPath = path.isAbsolute(importFile) 
    ? importFile 
    : path.join(__dirname, '..', importFile);
  
  importExercisesDirect(fullPath)
    .then(result => {
      console.log(`\n✅ Import completed!`);
      if (result.failCount > 0) {
        process.exit(1);
      }
    })
    .catch(error => {
      console.error(`\n❌ Import failed: ${error.message}`);
      process.exit(1);
    });
} 