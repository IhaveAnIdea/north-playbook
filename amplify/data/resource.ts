import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  UserProfile: a
    .model({
      userId: a.id().required(),
      firstName: a.string().required(),
      lastName: a.string().required(),
      email: a.email().required(),
      role: a.enum(['user', 'admin']),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
    })
    .authorization((allow) => [
      allow.owner(),
      // Allow authenticated users to read all profiles (needed for admin functionality)
      allow.authenticated().to(['read']),
      // Allow admins to manage all profiles
      allow.groups(['admin']).to(['read', 'update', 'delete'])
    ]),

  Exercise: a
    .model({
      title: a.string().required(),
      description: a.string().required(),
      category: a.enum([
        'connection_to_nature',
        'habit_formation',
        'goal_resilience',
        'substance_use',
        'self_compassion',
        'goal_attainment',
        'worry',
        'high_standard_friends',
        'mindfulness_practice',
        'sleep_and_rest',
        'purpose',
        'self_worth',
        'emotional_re_appraisal',
        'perfectionism',
        'achievement_based_identity',
        'self_auditing',
        'purpose_based_identity',
        'connection_and_belonging',
        'tribe',
        'purpose_beyond_self',
        'diet_and_nutrition',
        'goal_pursuit',
        'self_talk',
        'loving_relationships',
        'gratitude',
        'meaning',
        'exercise',
        'self_awareness',
        'vulnerability',
        'rumination',
        'creative_expression',
        'success_comparison',
        'long_term_focus'
      ]),
      question: a.string().required(),
      instructions: a.string(), // Detailed instructions for users
      // Required response types that admin specifies
      requireText: a.boolean().default(false),
      requireImage: a.boolean().default(false),
      requireAudio: a.boolean().default(false),
      requireVideo: a.boolean().default(false),
      requireDocument: a.boolean().default(false),
      // Optional configurations
      textPrompt: a.string(), // Custom prompt for text input
      maxTextLength: a.integer(), // Character limit for text
      allowMultipleImages: a.boolean().default(false),
      allowMultipleDocuments: a.boolean().default(false),
      allowEditingCompleted: a.boolean().default(false), // Allow users to edit completed exercises
      isActive: a.boolean().default(true),
      order: a.integer(),
      createdAt: a.datetime(),
      createdBy: a.id(), // Track who created the exercise
      responses: a.hasMany('ExerciseResponse', 'exerciseId'),
      mediaAssets: a.hasMany('MediaAsset', 'exerciseId'),
      userProgress: a.hasMany('UserProgress', 'exerciseId'),
    })
    .authorization((allow) => [
      allow.authenticated().to(['read', 'create', 'update', 'delete'])
    ]),

  ExerciseResponse: a
    .model({
      exerciseId: a.id().required(),
      userId: a.id().required(),
      // Response content
      responseText: a.string(),
      audioS3Key: a.string(),
      videoS3Key: a.string(), // Keep for backward compatibility
      videoS3Keys: a.string().array(), // Support multiple videos
      imageS3Keys: a.string().array(),
      documentS3Keys: a.string().array(),
      notes: a.string(), // For additional metadata
      s3Bucket: a.string(),
      // Response status and metadata
      status: a.enum(['draft', 'completed']),
      completedAt: a.datetime(),
      timeSpentSeconds: a.integer(), // Time spent on this response
      // System-generated insights (admin/AI only)
      analysisResult: a.json(),
      insights: a.string(),
      // Tracking fields
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
      exercise: a.belongsTo('Exercise', 'exerciseId'),
      playbookEntries: a.hasMany('PlaybookEntry', 'exerciseResponseId'),
      mediaAssets: a.hasMany('MediaAsset', 'exerciseResponseId'),
    })
    .authorization((allow) => [allow.owner()]),

  PlaybookEntry: a
    .model({
      userId: a.id().required(),
      exerciseResponseId: a.id(), // Link to ExerciseResponse
      title: a.string().required(),
      content: a.string().required(),
      category: a.string().required(),
      insights: a.string(),
      audioS3Keys: a.string().array(),
      videoS3Keys: a.string().array(),
      imageS3Keys: a.string().array(),
      documentS3Keys: a.string().array(),
      s3Bucket: a.string(),
      mood: a.string(),
      tags: a.string().array(),
      isHighlight: a.boolean().default(false),
      viewCount: a.integer().default(0),
      lastViewedAt: a.datetime(),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
      exerciseResponse: a.belongsTo('ExerciseResponse', 'exerciseResponseId'),
      mediaAssets: a.hasMany('MediaAsset', 'playbookEntryId'),
    })
    .authorization((allow) => [allow.owner()]),

  UserInsights: a
    .model({
      userId: a.id().required(),
      overallMood: a.string(),
      growthAreas: a.string().array(),
      strengths: a.string().array(),
      recommendations: a.string().array(),
      progressMetrics: a.json(),
      lastUpdated: a.datetime(),
      totalExercisesCompleted: a.integer().default(0),
      streakDays: a.integer().default(0),
      lastExerciseDate: a.datetime(),
    })
    .authorization((allow) => [allow.owner()]),

  MediaAsset: a
    .model({
      userId: a.id().required(),
      s3Key: a.string().required(),
      s3Bucket: a.string().required(),
      fileName: a.string().required(),
      fileType: a.string().required(),
      fileSize: a.integer().required(),
      mimeType: a.string().required(),
      exerciseId: a.id(),
      exerciseResponseId: a.id(),
      playbookEntryId: a.id(),
      category: a.string(),
      tags: a.string().array(),
      description: a.string(),
      uploadedAt: a.datetime().required(),
      lastAccessedAt: a.datetime(),
      accessCount: a.integer().default(0),
      exercise: a.belongsTo('Exercise', 'exerciseId'),
      exerciseResponse: a.belongsTo('ExerciseResponse', 'exerciseResponseId'),
      playbookEntry: a.belongsTo('PlaybookEntry', 'playbookEntryId'),
    })
    .authorization((allow) => [allow.owner()]),

  UserSession: a
    .model({
      userId: a.id().required(),
      sessionType: a.enum(['exercise', 'reflection', 'goal_setting', 'review']),
      startTime: a.datetime().required(),
      endTime: a.datetime(),
      duration: a.integer(), // seconds
      exerciseIds: a.string().array(),
      mood: a.string(),
      notes: a.string(),
      completionStatus: a.enum(['started', 'completed', 'paused', 'abandoned']),
      metadata: a.json(),
    })
    .authorization((allow) => [allow.owner()]),

  UserProgress: a
    .model({
      userId: a.id().required(),
      exerciseId: a.id().required(),
      completionCount: a.integer().default(0),
      lastCompletedAt: a.datetime(),
      averageCompletionTime: a.integer(), // seconds
      averageMoodRating: a.float(),
      bestStreak: a.integer().default(0),
      currentStreak: a.integer().default(0),
      totalTimeSpent: a.integer().default(0), // seconds
      insights: a.string().array(),
      exercise: a.belongsTo('Exercise', 'exerciseId'),
    })
    .authorization((allow) => [allow.owner()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
}); 