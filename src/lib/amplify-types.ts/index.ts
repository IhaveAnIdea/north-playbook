import { ModelInit, MutableModel, PersistentModelConstructor } from "@aws-amplify/datastore";
import { initSchema } from "@aws-amplify/datastore";

import { schema } from "./schema";

export enum UserProfileRole {
  USER = "user",
  ADMIN = "admin"
}

export enum ExerciseCategory {
  CONNECTION_TO_NATURE = "connection_to_nature",
  HABIT_FORMATION = "habit_formation", 
  GOAL_RESILIENCE = "goal_resilience",
  SUBSTANCE_USE = "substance_use",
  SELF_COMPASSION = "self_compassion",
  GOAL_ATTAINMENT = "goal_attainment",
  WORRY = "worry",
  HIGH_STANDARD_FRIENDS = "high_standard_friends",
  MINDFULNESS_PRACTICE = "mindfulness_practice",
  SLEEP_AND_REST = "sleep_and_rest",
  PURPOSE = "purpose",
  SELF_WORTH = "self_worth",
  EMOTIONAL_RE_APPRAISAL = "emotional_re_appraisal",
  PERFECTIONISM = "perfectionism",
  ACHIEVEMENT_BASED_IDENTITY = "achievement_based_identity",
  SELF_AUDITING = "self_auditing",
  PURPOSE_BASED_IDENTITY = "purpose_based_identity",
  CONNECTION_AND_BELONGING = "connection_and_belonging",
  TRIBE = "tribe",
  PURPOSE_BEYOND_SELF = "purpose_beyond_self",
  DIET_AND_NUTRITION = "diet_and_nutrition",
  GOAL_PURSUIT = "goal_pursuit",  
  SELF_TALK = "self_talk",
  LOVING_RELATIONSHIPS = "loving_relationships",
  GRATITUDE = "gratitude",
  MEANING = "meaning",
  EXERCISE = "exercise",
  SELF_AWARENESS = "self_awareness",
  VULNERABILITY = "vulnerability",
  RUMINATION = "rumination",
  CREATIVE_EXPRESSION = "creative_expression",
  SUCCESS_COMPARISON = "success_comparison",
  LONG_TERM_FOCUS = "long_term_focus"
}

export enum ExerciseResponseStatus {
  DRAFT = "draft",
  COMPLETED = "completed"
}

export enum UserSessionSessionType {
  EXERCISE = "exercise",
  REFLECTION = "reflection",
  GOAL_SETTING = "goal_setting",
  REVIEW = "review"
}

export enum UserSessionCompletionStatus {
  STARTED = "started",
  COMPLETED = "completed",
  PAUSED = "paused",
  ABANDONED = "abandoned"
}

type EagerUserProfileModel = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<UserProfile, 'id'>;
  };
  readonly id: string;
  readonly userId: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly role?: UserProfileRole | keyof typeof UserProfileRole | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazyUserProfileModel = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<UserProfile, 'id'>;
  };
  readonly id: string;
  readonly userId: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly role?: UserProfileRole | keyof typeof UserProfileRole | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type UserProfileModel = LazyLoading extends LazyLoadingDisabled ? EagerUserProfileModel : LazyUserProfileModel

export declare const UserProfileModel: (new (init: ModelInit<UserProfileModel>) => UserProfileModel) & {
  copyOf(source: UserProfileModel, mutator: (draft: MutableModel<UserProfileModel>) => MutableModel<UserProfileModel> | void): UserProfileModel;
}

type EagerExerciseModel = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Exercise, 'id'>;
    readOnlyFields: 'updatedAt';
  };
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly category?: ExerciseCategory | keyof typeof ExerciseCategory | null;
  readonly question: string;
  readonly instructions?: string | null;
  readonly requireText?: boolean | null;
  readonly requireImage?: boolean | null;
  readonly requireAudio?: boolean | null;
  readonly requireVideo?: boolean | null;
  readonly requireDocument?: boolean | null;
  readonly textPrompt?: string | null;
  readonly maxTextLength?: number | null;
  readonly allowMultipleImages?: boolean | null;
  readonly allowMultipleDocuments?: boolean | null;
  readonly allowEditingCompleted?: boolean | null;
  readonly isActive?: boolean | null;
  readonly order?: number | null;
  readonly createdAt?: string | null;
  readonly createdBy?: string | null;
  readonly responses?: (ExerciseResponseModel | null)[] | null;
  readonly mediaAssets?: (MediaAssetModel | null)[] | null;
  readonly userProgress?: (UserProgressModel | null)[] | null;
  readonly updatedAt?: string | null;
}

type LazyExerciseModel = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Exercise, 'id'>;
    readOnlyFields: 'updatedAt';
  };
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly category?: ExerciseCategory | keyof typeof ExerciseCategory | null;
  readonly question: string;
  readonly instructions?: string | null;
  readonly requireText?: boolean | null;
  readonly requireImage?: boolean | null;
  readonly requireAudio?: boolean | null;
  readonly requireVideo?: boolean | null;
  readonly requireDocument?: boolean | null;
  readonly textPrompt?: string | null;
  readonly maxTextLength?: number | null;
  readonly allowMultipleImages?: boolean | null;
  readonly allowMultipleDocuments?: boolean | null;
  readonly allowEditingCompleted?: boolean | null;
  readonly isActive?: boolean | null;
  readonly order?: number | null;
  readonly createdAt?: string | null;
  readonly createdBy?: string | null;
  readonly responses: AsyncCollection<ExerciseResponseModel>;
  readonly mediaAssets: AsyncCollection<MediaAssetModel>;
  readonly userProgress: AsyncCollection<UserProgressModel>;
  readonly updatedAt?: string | null;
}

export declare type ExerciseModel = LazyLoading extends LazyLoadingDisabled ? EagerExerciseModel : LazyExerciseModel

export declare const ExerciseModel: (new (init: ModelInit<ExerciseModel>) => ExerciseModel) & {
  copyOf(source: ExerciseModel, mutator: (draft: MutableModel<ExerciseModel>) => MutableModel<ExerciseModel> | void): ExerciseModel;
}

type EagerExerciseResponseModel = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<ExerciseResponse, 'id'>;
  };
  readonly id: string;
  readonly exerciseId: string;
  readonly userId: string;
  readonly responseText?: string | null;
  readonly audioS3Key?: string | null;
  readonly videoS3Key?: string | null;
  readonly videoS3Keys?: (string | null)[] | null;
  readonly imageS3Keys?: (string | null)[] | null;
  readonly documentS3Keys?: (string | null)[] | null;
  readonly notes?: string | null;
  readonly s3Bucket?: string | null;
  readonly status?: ExerciseResponseStatus | keyof typeof ExerciseResponseStatus | null;
  readonly completedAt?: string | null;
  readonly timeSpentSeconds?: number | null;
  readonly analysisResult?: string | null;
  readonly insights?: string | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
  readonly exercise?: ExerciseModel | null;
  readonly playbookEntries?: (PlaybookEntryModel | null)[] | null;
  readonly mediaAssets?: (MediaAssetModel | null)[] | null;
}

type LazyExerciseResponseModel = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<ExerciseResponse, 'id'>;
  };
  readonly id: string;
  readonly exerciseId: string;
  readonly userId: string;
  readonly responseText?: string | null;
  readonly audioS3Key?: string | null;
  readonly videoS3Key?: string | null;
  readonly videoS3Keys?: (string | null)[] | null;
  readonly imageS3Keys?: (string | null)[] | null;
  readonly documentS3Keys?: (string | null)[] | null;
  readonly notes?: string | null;
  readonly s3Bucket?: string | null;
  readonly status?: ExerciseResponseStatus | keyof typeof ExerciseResponseStatus | null;
  readonly completedAt?: string | null;
  readonly timeSpentSeconds?: number | null;
  readonly analysisResult?: string | null;
  readonly insights?: string | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
  readonly exercise: AsyncItem<ExerciseModel | undefined>;
  readonly playbookEntries: AsyncCollection<PlaybookEntryModel>;
  readonly mediaAssets: AsyncCollection<MediaAssetModel>;
}

export declare type ExerciseResponseModel = LazyLoading extends LazyLoadingDisabled ? EagerExerciseResponseModel : LazyExerciseResponseModel

export declare const ExerciseResponseModel: (new (init: ModelInit<ExerciseResponseModel>) => ExerciseResponseModel) & {
  copyOf(source: ExerciseResponseModel, mutator: (draft: MutableModel<ExerciseResponseModel>) => MutableModel<ExerciseResponseModel> | void): ExerciseResponseModel;
}

type EagerPlaybookEntryModel = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<PlaybookEntry, 'id'>;
  };
  readonly id: string;
  readonly userId: string;
  readonly exerciseResponseId?: string | null;
  readonly title: string;
  readonly content: string;
  readonly category: string;
  readonly insights?: string | null;
  readonly audioS3Keys?: (string | null)[] | null;
  readonly videoS3Keys?: (string | null)[] | null;
  readonly imageS3Keys?: (string | null)[] | null;
  readonly documentS3Keys?: (string | null)[] | null;
  readonly s3Bucket?: string | null;
  readonly mood?: string | null;
  readonly tags?: (string | null)[] | null;
  readonly isHighlight?: boolean | null;
  readonly viewCount?: number | null;
  readonly lastViewedAt?: string | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
  readonly exerciseResponse?: ExerciseResponseModel | null;
  readonly mediaAssets?: (MediaAssetModel | null)[] | null;
}

type LazyPlaybookEntryModel = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<PlaybookEntry, 'id'>;
  };
  readonly id: string;
  readonly userId: string;
  readonly exerciseResponseId?: string | null;
  readonly title: string;
  readonly content: string;
  readonly category: string;
  readonly insights?: string | null;
  readonly audioS3Keys?: (string | null)[] | null;
  readonly videoS3Keys?: (string | null)[] | null;
  readonly imageS3Keys?: (string | null)[] | null;
  readonly documentS3Keys?: (string | null)[] | null;
  readonly s3Bucket?: string | null;
  readonly mood?: string | null;
  readonly tags?: (string | null)[] | null;
  readonly isHighlight?: boolean | null;
  readonly viewCount?: number | null;
  readonly lastViewedAt?: string | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
  readonly exerciseResponse: AsyncItem<ExerciseResponseModel | undefined>;
  readonly mediaAssets: AsyncCollection<MediaAssetModel>;
}

export declare type PlaybookEntryModel = LazyLoading extends LazyLoadingDisabled ? EagerPlaybookEntryModel : LazyPlaybookEntryModel

export declare const PlaybookEntryModel: (new (init: ModelInit<PlaybookEntryModel>) => PlaybookEntryModel) & {
  copyOf(source: PlaybookEntryModel, mutator: (draft: MutableModel<PlaybookEntryModel>) => MutableModel<PlaybookEntryModel> | void): PlaybookEntryModel;
}

type EagerUserInsightsModel = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<UserInsights, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly userId: string;
  readonly overallMood?: string | null;
  readonly growthAreas?: (string | null)[] | null;
  readonly strengths?: (string | null)[] | null;
  readonly recommendations?: (string | null)[] | null;
  readonly progressMetrics?: string | null;
  readonly lastUpdated?: string | null;
  readonly totalExercisesCompleted?: number | null;
  readonly streakDays?: number | null;
  readonly lastExerciseDate?: string | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazyUserInsightsModel = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<UserInsights, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly userId: string;
  readonly overallMood?: string | null;
  readonly growthAreas?: (string | null)[] | null;
  readonly strengths?: (string | null)[] | null;
  readonly recommendations?: (string | null)[] | null;
  readonly progressMetrics?: string | null;
  readonly lastUpdated?: string | null;
  readonly totalExercisesCompleted?: number | null;
  readonly streakDays?: number | null;
  readonly lastExerciseDate?: string | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type UserInsightsModel = LazyLoading extends LazyLoadingDisabled ? EagerUserInsightsModel : LazyUserInsightsModel

export declare const UserInsightsModel: (new (init: ModelInit<UserInsightsModel>) => UserInsightsModel) & {
  copyOf(source: UserInsightsModel, mutator: (draft: MutableModel<UserInsightsModel>) => MutableModel<UserInsightsModel> | void): UserInsightsModel;
}

type EagerMediaAssetModel = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<MediaAsset, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly userId: string;
  readonly s3Key: string;
  readonly s3Bucket: string;
  readonly fileName: string;
  readonly fileType: string;
  readonly fileSize: number;
  readonly mimeType: string;
  readonly exerciseId?: string | null;
  readonly exerciseResponseId?: string | null;
  readonly playbookEntryId?: string | null;
  readonly category?: string | null;
  readonly tags?: (string | null)[] | null;
  readonly description?: string | null;
  readonly uploadedAt: string;
  readonly lastAccessedAt?: string | null;
  readonly accessCount?: number | null;
  readonly exercise?: ExerciseModel | null;
  readonly exerciseResponse?: ExerciseResponseModel | null;
  readonly playbookEntry?: PlaybookEntryModel | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazyMediaAssetModel = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<MediaAsset, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly userId: string;
  readonly s3Key: string;
  readonly s3Bucket: string;
  readonly fileName: string;
  readonly fileType: string;
  readonly fileSize: number;
  readonly mimeType: string;
  readonly exerciseId?: string | null;
  readonly exerciseResponseId?: string | null;
  readonly playbookEntryId?: string | null;
  readonly category?: string | null;
  readonly tags?: (string | null)[] | null;
  readonly description?: string | null;
  readonly uploadedAt: string;
  readonly lastAccessedAt?: string | null;
  readonly accessCount?: number | null;
  readonly exercise: AsyncItem<ExerciseModel | undefined>;
  readonly exerciseResponse: AsyncItem<ExerciseResponseModel | undefined>;
  readonly playbookEntry: AsyncItem<PlaybookEntryModel | undefined>;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type MediaAssetModel = LazyLoading extends LazyLoadingDisabled ? EagerMediaAssetModel : LazyMediaAssetModel

export declare const MediaAssetModel: (new (init: ModelInit<MediaAssetModel>) => MediaAssetModel) & {
  copyOf(source: MediaAssetModel, mutator: (draft: MutableModel<MediaAssetModel>) => MutableModel<MediaAssetModel> | void): MediaAssetModel;
}

type EagerUserSessionModel = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<UserSession, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly userId: string;
  readonly sessionType?: UserSessionSessionType | keyof typeof UserSessionSessionType | null;
  readonly startTime: string;
  readonly endTime?: string | null;
  readonly duration?: number | null;
  readonly exerciseIds?: (string | null)[] | null;
  readonly mood?: string | null;
  readonly notes?: string | null;
  readonly completionStatus?: UserSessionCompletionStatus | keyof typeof UserSessionCompletionStatus | null;
  readonly metadata?: string | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazyUserSessionModel = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<UserSession, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly userId: string;
  readonly sessionType?: UserSessionSessionType | keyof typeof UserSessionSessionType | null;
  readonly startTime: string;
  readonly endTime?: string | null;
  readonly duration?: number | null;
  readonly exerciseIds?: (string | null)[] | null;
  readonly mood?: string | null;
  readonly notes?: string | null;
  readonly completionStatus?: UserSessionCompletionStatus | keyof typeof UserSessionCompletionStatus | null;
  readonly metadata?: string | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type UserSessionModel = LazyLoading extends LazyLoadingDisabled ? EagerUserSessionModel : LazyUserSessionModel

export declare const UserSessionModel: (new (init: ModelInit<UserSessionModel>) => UserSessionModel) & {
  copyOf(source: UserSessionModel, mutator: (draft: MutableModel<UserSessionModel>) => MutableModel<UserSessionModel> | void): UserSessionModel;
}

type EagerUserProgressModel = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<UserProgress, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly userId: string;
  readonly exerciseId: string;
  readonly completionCount?: number | null;
  readonly lastCompletedAt?: string | null;
  readonly averageCompletionTime?: number | null;
  readonly averageMoodRating?: number | null;
  readonly bestStreak?: number | null;
  readonly currentStreak?: number | null;
  readonly totalTimeSpent?: number | null;
  readonly insights?: (string | null)[] | null;
  readonly exercise?: ExerciseModel | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazyUserProgressModel = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<UserProgress, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly userId: string;
  readonly exerciseId: string;
  readonly completionCount?: number | null;
  readonly lastCompletedAt?: string | null;
  readonly averageCompletionTime?: number | null;
  readonly averageMoodRating?: number | null;
  readonly bestStreak?: number | null;
  readonly currentStreak?: number | null;
  readonly totalTimeSpent?: number | null;
  readonly insights?: (string | null)[] | null;
  readonly exercise: AsyncItem<ExerciseModel | undefined>;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type UserProgressModel = LazyLoading extends LazyLoadingDisabled ? EagerUserProgressModel : LazyUserProgressModel

export declare const UserProgressModel: (new (init: ModelInit<UserProgressModel>) => UserProgressModel) & {
  copyOf(source: UserProgressModel, mutator: (draft: MutableModel<UserProgressModel>) => MutableModel<UserProgressModel> | void): UserProgressModel;
}

export type AmplifyDependentResourcesAttributes = {
  "api": {
    "northPlaybook": {
      "GraphQLAPIEndpointOutput": "string",
      "GraphQLAPIIdOutput": "string"
    }
  }
}

const { UserProfile, Exercise, ExerciseResponse, PlaybookEntry, UserInsights, MediaAsset, UserSession, UserProgress } = initSchema(schema) as {
  UserProfile: PersistentModelConstructor<UserProfileModel>;
  Exercise: PersistentModelConstructor<ExerciseModel>;
  ExerciseResponse: PersistentModelConstructor<ExerciseResponseModel>;
  PlaybookEntry: PersistentModelConstructor<PlaybookEntryModel>;
  UserInsights: PersistentModelConstructor<UserInsightsModel>;
  MediaAsset: PersistentModelConstructor<MediaAssetModel>;
  UserSession: PersistentModelConstructor<UserSessionModel>;
  UserProgress: PersistentModelConstructor<UserProgressModel>;
};

export {
  UserProfile,
  Exercise,
  ExerciseResponse,
  PlaybookEntry,
  UserInsights,
  MediaAsset,
  UserSession,
  UserProgress
};