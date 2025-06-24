export interface ExerciseRequirements {
  requireText: 'not_required' | 'required' | 'or';
  requireImage: 'not_required' | 'required' | 'or';
  requireAudio: 'not_required' | 'required' | 'or';
  requireVideo: 'not_required' | 'required' | 'or';
  requireDocument: 'not_required' | 'required' | 'or';
  instructions?: string;
}

export interface ExerciseResponse {
  textResponse?: string;
  imageUrls?: string[];
  audioUrl?: string;
  videoUrl?: string;
  documentUrls?: string[];
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

// Helper function to parse OR types from instructions
export function parseORTypes(instructions?: string): string[] {
  if (!instructions) return [];
  const match = instructions.match(/\[OR_TYPES:([^\]]+)\]/);
  return match ? match[1].split(',') : [];
}

// Helper function to get response requirements with OR logic
export function getResponseRequirements(exercise: {
  requireText?: 'not_required' | 'required' | 'or';
  requireImage?: 'not_required' | 'required' | 'or';
  requireAudio?: 'not_required' | 'required' | 'or';
  requireVideo?: 'not_required' | 'required' | 'or';
  requireDocument?: 'not_required' | 'required' | 'or';
  instructions?: string;
}): {
  required: string[];
  orGroup: string[];
  optional: string[];
} {
  const orTypes = parseORTypes(exercise.instructions);
  const required: string[] = [];
  
  // Check each response type
  const responseTypes = [
    { key: 'text', field: exercise.requireText },
    { key: 'image', field: exercise.requireImage },
    { key: 'audio', field: exercise.requireAudio },
    { key: 'video', field: exercise.requireVideo },
    { key: 'document', field: exercise.requireDocument }
  ];

  responseTypes.forEach(({ key, field }) => {
    if (field === 'required') {
      if (orTypes.includes(key)) {
        // This is part of OR group - don't add to required
      } else {
        required.push(key);
      }
    } else if (field === 'or') {
      // OR types are handled separately in orTypes
    }
  });

  return {
    required,
    orGroup: orTypes,
    optional: [] // Simplified for now
  };
}

export function calculateExerciseProgress(
  requirements: ExerciseRequirements,
  response?: ExerciseResponse
): ProgressCalculation {
  // Default empty response if none provided
  const actualResponse: ExerciseResponse = response || {};
  
  const { required, orGroup } = getResponseRequirements(requirements);
  const missingRequirements: string[] = [];
  const completedRequirements_list: string[] = [];
  let completedCount = 0;

  // Check individual required fields
  required.forEach(type => {
    const hasResponse = checkResponseType(type, actualResponse);
    if (hasResponse) {
      completedCount++;
      completedRequirements_list.push(type.charAt(0).toUpperCase() + type.slice(1));
    } else {
      missingRequirements.push(type.charAt(0).toUpperCase() + type.slice(1));
    }
  });

  // Check OR group - at least one must be provided
  let orGroupSatisfied = false;
  if (orGroup.length > 0) {
    const satisfiedOrTypes = orGroup.filter(type => checkResponseType(type, actualResponse));
    orGroupSatisfied = satisfiedOrTypes.length > 0;
    
    if (orGroupSatisfied) {
      completedCount++;
      const satisfiedNames = satisfiedOrTypes.map(type => type.charAt(0).toUpperCase() + type.slice(1));
      completedRequirements_list.push(`OR: ${satisfiedNames.join(', ')}`);
    } else {
      const orGroupNames = orGroup.map(type => type.charAt(0).toUpperCase() + type.slice(1));
      missingRequirements.push(`At least one: ${orGroupNames.join(' OR ')}`);
    }
  }

  // Total required is individual required + 1 for OR group (if exists)
  const totalRequired = required.length + (orGroup.length > 0 ? 1 : 0);
  const isComplete = missingRequirements.length === 0 && totalRequired > 0;
  const percentageComplete = totalRequired > 0 ? Math.round((completedCount / totalRequired) * 100) : 0;

  // Determine state
  let state: ExerciseState;
  if (isComplete) {
    state = 'completed';
  } else if (completedCount > 0) {
    state = 'incomplete';
  } else {
    state = 'unstarted';
  }

  return {
    completedRequirements: completedCount,
    totalRequirements: totalRequired,
    percentageComplete,
    hasAllRequirements: isComplete,
    missingRequirements,
    completedRequirements_list,
    state,
    canEdit: state !== 'completed', // Can edit unless completed
    canComplete: isComplete
  };
}

function checkResponseType(type: string, response: ExerciseResponse): boolean {
  switch (type) {
    case 'text':
      return !!(response.textResponse && response.textResponse.trim());
    case 'image':
      return !!(response.imageUrls && response.imageUrls.length > 0);
    case 'audio':
      return !!(response.audioUrl && response.audioUrl.trim());
    case 'video':
      return !!(response.videoUrl && response.videoUrl.trim());
    case 'document':
      return !!(response.documentUrls && response.documentUrls.length > 0);
    default:
      return false;
  }
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

// Helper function to convert legacy boolean requirements to new enum format
export function convertLegacyRequirements(exercise: Record<string, unknown>): ExerciseRequirements {
  const convertValue = (value: unknown): 'not_required' | 'required' | 'or' => {
    // Handle new enum format
    if (value === 'not_required' || value === 'required' || value === 'or') {
      return value;
    }
    // Handle legacy boolean format
    if (value === true) return 'required';
    if (value === false || value === null || value === undefined) return 'not_required';
    // Default fallback
    return 'not_required';
  };

  return {
    requireText: convertValue(exercise.requireText),
    requireImage: convertValue(exercise.requireImage),
    requireAudio: convertValue(exercise.requireAudio),
    requireVideo: convertValue(exercise.requireVideo),
    requireDocument: convertValue(exercise.requireDocument),
    instructions: typeof exercise.instructions === 'string' ? exercise.instructions : undefined
  };
}