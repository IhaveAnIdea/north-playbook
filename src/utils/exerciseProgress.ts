export interface ExerciseRequirements {
  requireText: boolean;
  requireImage: boolean;
  requireAudio: boolean;
  requireVideo: boolean;
  requireDocument: boolean;
}

export interface ExerciseResponse {
  responseText?: string;
  imageS3Keys?: string[];
  audioS3Key?: string;
  videoS3Key?: string;
  documentS3Keys?: string[];
  status?: 'draft' | 'completed';
}

export type ExerciseState = 'unstarted' | 'incomplete' | 'completed';

export interface ProgressCalculation {
  completedRequirements: number;
  totalRequirements: number;
  percentageComplete: number;
  hasAllRequirements: boolean;
  missingRequirements: string[];
  completedRequirements_list: string[];
  state: ExerciseState;
  canEdit: boolean;
  canComplete: boolean;
}

export function calculateExerciseProgress(
  requirements: ExerciseRequirements,
  response?: ExerciseResponse
): ProgressCalculation {
  const totalRequirements = Object.values(requirements).filter(Boolean).length;
  let completedRequirements = 0;
  const missingRequirements: string[] = [];
  const completedRequirements_list: string[] = [];

  // Check text requirement
  if (requirements.requireText) {
    if (response?.responseText && response.responseText.trim().length > 0) {
      completedRequirements++;
      completedRequirements_list.push('Text response');
    } else {
      missingRequirements.push('Text response');
    }
  }

  // Check image requirement
  if (requirements.requireImage) {
    if (response?.imageS3Keys && response.imageS3Keys.length > 0) {
      completedRequirements++;
      completedRequirements_list.push('Image upload');
    } else {
      missingRequirements.push('Image upload');
    }
  }

  // Check audio requirement
  if (requirements.requireAudio) {
    if (response?.audioS3Key && response.audioS3Key.trim().length > 0) {
      completedRequirements++;
      completedRequirements_list.push('Audio recording');
    } else {
      missingRequirements.push('Audio recording');
    }
  }

  // Check video requirement
  if (requirements.requireVideo) {
    if (response?.videoS3Key && response.videoS3Key.trim().length > 0) {
      completedRequirements++;
      completedRequirements_list.push('Video recording');
    } else {
      missingRequirements.push('Video recording');
    }
  }

  // Check document requirement
  if (requirements.requireDocument) {
    if (response?.documentS3Keys && response.documentS3Keys.length > 0) {
      completedRequirements++;
      completedRequirements_list.push('Document upload');
    } else {
      missingRequirements.push('Document upload');
    }
  }

  const percentageComplete = totalRequirements > 0 ? (completedRequirements / totalRequirements) * 100 : 100;
  const hasAllRequirements = completedRequirements === totalRequirements && totalRequirements > 0;

  // Determine exercise state based on response existence and completion status
  let state: ExerciseState;
  
  if (!response || (!response.responseText && !response.imageS3Keys?.length && !response.audioS3Key && !response.videoS3Key && !response.documentS3Keys?.length)) {
    // No meaningful response data exists
    state = 'unstarted';
  } else if (response.status === 'completed') {
    // User has explicitly completed the exercise
    state = 'completed';
  } else {
    // User has started but not completed (either missing requirements or saved as draft)
    state = 'incomplete';
  }
  
  // SPECIAL CASE: If an exercise has no requirements and no response, it should be 'unstarted'
  // If it has no requirements but has a response, it should be 'completed'
  if (totalRequirements === 0) {
    if (!response || (!response.responseText && !response.imageS3Keys?.length && !response.audioS3Key && !response.videoS3Key && !response.documentS3Keys?.length)) {
      state = 'unstarted';
    } else {
      state = 'completed';
    }
  }

  // Determine edit permissions
  const canEdit = state !== 'completed'; // Can only edit if not completed
  const canComplete = hasAllRequirements && state !== 'completed'; // Can complete if all requirements met and not already completed

  return {
    completedRequirements,
    totalRequirements,
    percentageComplete,
    hasAllRequirements,
    missingRequirements,
    completedRequirements_list,
    state,
    canEdit,
    canComplete,
  };
}

export function getProgressColor(percentage: number): string {
  if (percentage === 100) return 'bg-green-500';
  if (percentage >= 75) return 'bg-blue-500'; 
  if (percentage >= 50) return 'bg-yellow-500';
  if (percentage >= 25) return 'bg-orange-500';
  if (percentage > 0) return 'bg-red-500';
  return 'bg-red-500'; // Show red for 0% progress instead of grey
}

export function getProgressColorValue(percentage: number): string {
  if (percentage === 100) return '#10b981'; // green-500
  if (percentage >= 75) return '#3b82f6'; // blue-500
  if (percentage >= 50) return '#eab308'; // yellow-500
  if (percentage >= 25) return '#f97316'; // orange-500
  if (percentage > 0) return '#ef4444'; // red-500
  return '#ef4444'; // red-500 for 0% progress
}

export function getStateInfo(state: ExerciseState): { text: string; color: string; icon: string } {
  switch (state) {
    case 'unstarted':
      return {
        text: 'Not Started',
        color: 'text-gray-600',
        icon: '🔓',
      };
    case 'incomplete':
      return {
        text: 'In Progress',
        color: 'text-blue-600',
        icon: '🚀',
      };
    case 'completed':
      return {
        text: 'Completed',
        color: 'text-green-600',
        icon: '✅',
      };
  }
}

export function getStatusText(
  progress: ProgressCalculation
): { text: string; color: string; canEdit: boolean } {
  const stateInfo = getStateInfo(progress.state);
  return {
    text: stateInfo.text,
    color: stateInfo.color,
    canEdit: progress.canEdit,
  };
}