#!/usr/bin/env node

/**
 * Sync Exercises from Sandbox to Production
 * Exports exercises from development sandbox and imports to production
 */

const fs = require('fs');
const path = require('path');

// Create exercises-export directory if it doesn't exist
const exportDir = path.join(__dirname, '..', 'exercises-export');
if (!fs.existsSync(exportDir)) {
  fs.mkdirSync(exportDir, { recursive: true });
}

async function exportExercisesFromSandbox() {
  console.log('🔄 Exporting exercises from sandbox...');
  
  try {
    // Try to fetch from the running development server
    const response = await fetch('http://localhost:3000/api/exercises', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    const exercises = result.data || result;
    
    if (!exercises || exercises.length === 0) {
      console.log('⚠️ No exercises found in sandbox');
      return null;
    }
    
    // Create export file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const exportFileName = `exercises-export-${timestamp}.json`;
    const exportFilePath = path.join(exportDir, exportFileName);
    
    const exportData = {
      metadata: {
        timestamp: new Date().toISOString(),
        source: 'sandbox',
        target: 'production',
        count: exercises.length
      },
      exercises: exercises.map(exercise => ({
        // Core exercise data
        title: exercise.title,
        description: exercise.description,
        category: exercise.category,
        question: exercise.question,
        instructions: exercise.instructions,
        
        // Response requirements (new enum format)
        requireText: exercise.requireText || 'not_required',
        requireImage: exercise.requireImage || 'not_required',
        requireAudio: exercise.requireAudio || 'not_required',
        requireVideo: exercise.requireVideo || 'not_required',
        requireDocument: exercise.requireDocument || 'not_required',
        
        // Optional configurations
        textPrompt: exercise.textPrompt,
        maxTextLength: exercise.maxTextLength || 1000,
        allowMultipleImages: exercise.allowMultipleImages || false,
        allowMultipleDocuments: exercise.allowMultipleDocuments || false,
        allowEditingCompleted: exercise.allowEditingCompleted || false,
        isActive: exercise.isActive !== false,
        order: exercise.order || 0
      }))
    };
    
    fs.writeFileSync(exportFilePath, JSON.stringify(exportData, null, 2));
    
    // Also create latest export
    const latestExportPath = path.join(exportDir, 'latest-exercises-export.json');
    fs.writeFileSync(latestExportPath, JSON.stringify(exportData, null, 2));
    
    console.log(`✅ Exported ${exercises.length} exercises`);
    console.log(`📁 Export file: ${exportFilePath}`);
    
    // Display summary
    console.log('\n📋 Exported Exercises:');
    exercises.forEach((exercise, index) => {
      console.log(`   ${index + 1}. ${exercise.title} (${exercise.category})`);
    });
    
    return exportFilePath;
    
  } catch (error) {
    console.error('❌ Export failed:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.error('\n💡 Make sure the development server is running:');
      console.error('   npm run dev');
      console.error('\nThen run this script again.');
    }
    
    throw error;
  }
}

async function importExercisesToProduction(exportFilePath) {
  console.log('\n🔄 Importing exercises to production...');
  
  try {
    // Read export file
    if (!fs.existsSync(exportFilePath)) {
      throw new Error(`Export file not found: ${exportFilePath}`);
    }
    
    const exportData = JSON.parse(fs.readFileSync(exportFilePath, 'utf8'));
    const exercises = exportData.exercises;
    
    console.log(`📦 Found ${exercises.length} exercises to import`);
    
    // Import each exercise to production
    let successCount = 0;
    let failCount = 0;
    
    for (const exercise of exercises) {
      try {
        console.log(`📝 Importing: ${exercise.title}...`);
        
        // Call production API to create exercise
        const response = await fetch('http://localhost:3000/api/exercises', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(exercise)
        });
        
        if (response.ok) {
          successCount++;
          console.log(`   ✅ Success`);
        } else {
          failCount++;
          const errorText = await response.text();
          console.log(`   ❌ Failed: ${response.status} - ${errorText}`);
        }
        
      } catch (error) {
        failCount++;
        console.log(`   ❌ Failed: ${error.message}`);
      }
    }
    
    console.log(`\n📊 Import Summary:`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${failCount}`);
    console.log(`   📋 Total: ${exercises.length}`);
    
    return { successCount, failCount, total: exercises.length };
    
  } catch (error) {
    console.error('❌ Import failed:', error.message);
    throw error;
  }
}

// Manual export function for when API is not working
function createManualExportTemplate() {
  const templatePath = path.join(exportDir, 'manual-export-template.json');
  
  const template = {
    metadata: {
      timestamp: new Date().toISOString(),
      source: 'manual',
      target: 'production',
      instructions: "Fill in your exercises manually in the 'exercises' array below"
    },
    exercises: [
      {
        title: "Example Exercise",
        description: "Description of what this exercise is about",
        category: "self_awareness", // See schema for valid categories
        question: "What question should users answer?",
        instructions: "Detailed instructions for users",
        requireText: "required", // "not_required", "required", or "or"
        requireImage: "not_required",
        requireAudio: "not_required", 
        requireVideo: "not_required",
        requireDocument: "not_required",
        textPrompt: "Custom text prompt (optional)",
        maxTextLength: 1000,
        allowMultipleImages: false,
        allowMultipleDocuments: false,
        allowEditingCompleted: false,
        isActive: true,
        order: 1
      }
    ]
  };
  
  fs.writeFileSync(templatePath, JSON.stringify(template, null, 2));
  console.log(`📝 Created manual export template: ${templatePath}`);
  console.log('💡 Edit this file with your exercises and run: npm run import-exercises');
  
  return templatePath;
}

// List available exports
function listExports() {
  if (!fs.existsSync(exportDir)) {
    console.log('📁 No exports directory found');
    return [];
  }
  
  const files = fs.readdirSync(exportDir);
  const exportFiles = files.filter(f => f.includes('exercises-export') && f.endsWith('.json'));
  
  console.log('📋 Available exercise exports:');
  exportFiles.forEach((file, index) => {
    const filePath = path.join(exportDir, file);
    const stats = fs.statSync(filePath);
    console.log(`  ${index + 1}. ${file} (${stats.size} bytes, ${stats.mtime.toISOString()})`);
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
  
  if (args.includes('--manual-template')) {
    createManualExportTemplate();
    process.exit(0);
  }
  
  if (args.includes('--import-only')) {
    const exportFile = args[args.indexOf('--import-only') + 1] || path.join(exportDir, 'latest-exercises-export.json');
    importExercisesToProduction(exportFile)
      .then((result) => {
        console.log('\n🎉 Import completed!');
        process.exit(result.failCount > 0 ? 1 : 0);
      })
      .catch((error) => {
        console.error('\n💥 Import failed:', error.message);
        process.exit(1);
      });
    return;
  }
  
  // Default: Export from sandbox, then import to production
  (async () => {
    try {
      console.log('🔄 Starting exercise sync from sandbox to production...\n');
      
      // Step 1: Export from sandbox
      const exportFile = await exportExercisesFromSandbox();
      
      if (!exportFile) {
        console.log('\n⚠️ No exercises to sync');
        process.exit(0);
      }
      
      // Step 2: Import to production
      const result = await importExercisesToProduction(exportFile);
      
      console.log('\n🎉 Exercise sync completed!');
      console.log(`✅ Successfully synced ${result.successCount} exercises to production`);
      
      if (result.failCount > 0) {
        console.log(`⚠️ ${result.failCount} exercises failed to sync`);
        process.exit(1);
      }
      
      process.exit(0);
      
    } catch (error) {
      console.error('\n💥 Exercise sync failed:', error.message);
      
      if (error.message.includes('ECONNREFUSED')) {
        console.log('\n💡 Alternative: Create manual export template');
        console.log('   npm run sync-exercises -- --manual-template');
      }
      
      process.exit(1);
    }
  })();
}

module.exports = { 
  exportExercisesFromSandbox, 
  importExercisesToProduction, 
  createManualExportTemplate,
  listExports 
}; 