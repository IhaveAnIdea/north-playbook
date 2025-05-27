import {
  Psychology,
  TrendingUp,
  Flag,
  SelfImprovement,
  Favorite,
  Visibility,
} from '@mui/icons-material';

export interface Exercise {
  id: string;
  title: string;
  description: string;
  category: string;
  question: string;
  promptType: 'text' | 'audio' | 'video';
  estimatedTime: string;
}

export const exercises: Exercise[] = [
  {
    id: '1',
    title: 'Daily Gratitude Reflection',
    description: 'Reflect on three things you are grateful for today and why they matter to you.',
    category: 'gratitude',
    question: 'What are three things you are grateful for today, and how do they make you feel?',
    promptType: 'text',
    estimatedTime: '5 min',
  },
  {
    id: '2',
    title: 'Future Vision Exercise',
    description: 'Visualize and describe your ideal life 5 years from now.',
    category: 'vision',
    question: 'Describe in detail what your life looks like 5 years from now. What have you achieved?',
    promptType: 'text',
    estimatedTime: '15 min',
  },
  {
    id: '3',
    title: 'Mindset Check-In',
    description: 'Examine your current mindset and identify areas for growth.',
    category: 'mindset',
    question: 'How would you describe your current mindset? What beliefs are serving you well, and which ones might be holding you back?',
    promptType: 'audio',
    estimatedTime: '10 min',
  },
  {
    id: '4',
    title: 'Goal Setting Session',
    description: 'Define clear, actionable goals for the next month.',
    category: 'goals',
    question: 'What are three specific goals you want to achieve in the next 30 days? How will you measure success?',
    promptType: 'text',
    estimatedTime: '20 min',
  },
  {
    id: '5',
    title: 'Values Clarification',
    description: 'Identify and prioritize your core personal values.',
    category: 'reflection',
    question: 'What are your top 5 core values? How do these values show up in your daily life and decisions?',
    promptType: 'text',
    estimatedTime: '15 min',
  },
  {
    id: '6',
    title: 'Stress Response Analysis',
    description: 'Examine how you respond to stress and develop better coping strategies.',
    category: 'mindset',
    question: 'Describe a recent stressful situation. How did you respond? What would you do differently next time?',
    promptType: 'audio',
    estimatedTime: '12 min',
  },
  {
    id: '7',
    title: 'Success Visualization',
    description: 'Visualize achieving your biggest goal and the journey to get there.',
    category: 'motivation',
    question: 'Imagine you have achieved your biggest goal. What does that moment feel like? What steps did you take to get there?',
    promptType: 'video',
    estimatedTime: '18 min',
  },
  {
    id: '8',
    title: 'Energy Audit',
    description: 'Identify what gives you energy and what drains it.',
    category: 'reflection',
    question: 'What activities, people, or situations give you energy? What drains your energy? How can you optimize your energy?',
    promptType: 'text',
    estimatedTime: '10 min',
  },
];

export const categoryIcons = {
  mindset: Psychology,
  motivation: TrendingUp,
  goals: Flag,
  reflection: SelfImprovement,
  gratitude: Favorite,
  vision: Visibility,
};

export const categoryColors = {
  mindset: 'primary',
  motivation: 'secondary',
  goals: 'success',
  reflection: 'info',
  gratitude: 'error',
  vision: 'warning',
} as const;

export const categories = ['all', 'mindset', 'motivation', 'goals', 'reflection', 'gratitude', 'vision']; 