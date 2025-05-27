import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  UserProfile: a
    .model({
      userId: a.id().required(),
      firstName: a.string().required(),
      lastName: a.string().required(),
      email: a.email().required(),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
    })
    .authorization((allow) => [allow.owner()]),

  Exercise: a
    .model({
      title: a.string().required(),
      description: a.string().required(),
      category: a.enum(['mindset', 'motivation', 'goals', 'reflection', 'gratitude', 'vision']),
      question: a.string().required(),
      promptType: a.enum(['text', 'audio', 'video']),
      isActive: a.boolean().default(true),
      order: a.integer(),
      createdAt: a.datetime(),
      responses: a.hasMany('ExerciseResponse', 'exerciseId'),
    })
    .authorization((allow) => [allow.publicApiKey().to(['read']), allow.authenticated().to(['read'])]),

  ExerciseResponse: a
    .model({
      exerciseId: a.id().required(),
      userId: a.id().required(),
      responseText: a.string(),
      audioUrl: a.string(),
      videoUrl: a.string(),
      s3Key: a.string(),
      analysisResult: a.json(),
      insights: a.string(),
      mood: a.string(),
      tags: a.string().array(),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
      exercise: a.belongsTo('Exercise', 'exerciseId'),
    })
    .authorization((allow) => [allow.owner()]),

  PlaybookEntry: a
    .model({
      userId: a.id().required(),
      title: a.string().required(),
      content: a.string().required(),
      category: a.string().required(),
      insights: a.string(),
      mediaUrls: a.string().array(),
      mood: a.string(),
      tags: a.string().array(),
      isHighlight: a.boolean().default(false),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
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
    })
    .authorization((allow) => [allow.owner()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
}); 