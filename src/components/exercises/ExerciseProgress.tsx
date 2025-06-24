'use client';

import React from 'react';
import { 
  calculateExerciseProgress, 
  getProgressColor, 
  getProgressColorValue,
  getStateInfo,
  ExerciseRequirements, 
  ExerciseResponse,
  ProgressCalculation 
} from '@/utils/exerciseProgress';

interface ExerciseProgressProps {
  requirements: ExerciseRequirements;
  response?: ExerciseResponse;
  actualStatus?: 'draft' | 'completed';
  showDetails?: boolean;
  compact?: boolean;
}

export default function ExerciseProgress({
  requirements,
  response,
  actualStatus,
  showDetails = true,
  compact = false,
}: ExerciseProgressProps) {
  const progress = calculateExerciseProgress(requirements, response, actualStatus);
  const stateInfo = getStateInfo(progress.state);
  const progressColor = getProgressColor(progress.percentageComplete);

  // Safety check - if stateInfo is undefined, provide default
  const safeStateInfo = stateInfo || {
    text: 'Unknown',
    color: 'text-gray-600',
    icon: '❓'
  };
  
  // Debug logging
  const bgColor = getProgressColorValue(progress.percentageComplete);
  console.log('Progress Debug:', {
    percentage: progress.percentageComplete,
    progressColor,
    backgroundColor: bgColor,
    totalReq: progress.totalRequirements,
    completedReq: progress.completedRequirements
  });


  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-600">Progress</span>
          <span className={`text-xs font-medium ${safeStateInfo.color}`}>
            {progress.completedRequirements}/{progress.totalRequirements}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 border">
          <div
            className="h-3 rounded-full transition-all duration-300"
            style={{ 
              width: `${progress.percentageComplete}%`,
              backgroundColor: bgColor,
              minWidth: progress.percentageComplete > 0 ? '4px' : '0px',
              opacity: 1,
              zIndex: 1
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Progress Bar */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span className={`text-sm font-medium ${safeStateInfo.color} flex items-center space-x-1`}>
            <span>{safeStateInfo.icon}</span>
            <span>{safeStateInfo.text} ({progress.completedRequirements}/{progress.totalRequirements})</span>
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="h-2 rounded-full transition-all duration-300"
            style={{ 
              width: `${progress.percentageComplete}%`,
              backgroundColor: bgColor,
              opacity: 1,
              zIndex: 1
            }}
          />
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {progress.completedRequirements} of {progress.totalRequirements} requirements completed
        </div>
      </div>

      {/* Requirements Details */}
      {showDetails && (
        <div className="space-y-2">
          {/* Completed Requirements */}
          {progress.completedRequirements_list.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-green-700 mb-1">✓ Completed:</h4>
              <div className="flex flex-wrap gap-1">
                {progress.completedRequirements_list.map((req, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800"
                  >
                    ✓ {req}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Missing Requirements */}
          {progress.missingRequirements.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-red-700 mb-1">Still needed to complete assignment:</h4>
              <div className="flex flex-wrap gap-1">
                {progress.missingRequirements.map((req, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800"
                  >
                    📝 {req}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* State-based Action Message */}
      {progress.state === 'completed' && (
        <div className="text-xs text-green-600 italic flex items-center space-x-1">
          <span>✅</span>
          <span>Assignment completed. View only.</span>
        </div>
      )}
      
      {progress.state === 'incomplete' && (
        <div className="text-xs text-blue-600 italic flex items-center space-x-1">
          <span>📝</span>
          <span>In progress - complete required elements to finish.</span>
        </div>
      )}

      {progress.state === 'unstarted' && (
        <div className="text-xs text-gray-600 italic flex items-center space-x-1">
          <span>🔓</span>
          <span>Ready to start working on this assignment.</span>
        </div>
      )}
    </div>
  );
}

// Export the calculation function for use elsewhere
export { calculateExerciseProgress, type ProgressCalculation }; 