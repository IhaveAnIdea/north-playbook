import { ImageData } from '@/components/media/ImageUpload';

export interface PlaybookEntry {
  id: string;
  exerciseId: string;
  exerciseTitle: string;
  category: string;
  completedAt: Date;
  response: string;
  responseType: 'text' | 'audio' | 'video';
  insights?: string[];
  mood?: string;
  tags?: string[];
  images?: ImageData[];
}

export interface PlaybookSection {
  id: string;
  title: string;
  description: string;
  entries: PlaybookEntry[];
  insights: string[];
}

// Sample playbook data - in a real app, this would come from a database
const createSampleEntries = (): PlaybookEntry[] => [
  {
    id: '1',
    exerciseId: '1',
    exerciseTitle: 'Daily Gratitude Reflection',
    category: 'gratitude',
    completedAt: new Date('2024-01-15T10:00:00Z'),
    response: 'Today I am grateful for my family\'s support during a challenging project at work. Their encouragement helped me push through difficult moments and reminded me that I\'m not alone in my struggles. I\'m also grateful for the opportunity to learn new skills, even when it feels overwhelming. Finally, I\'m thankful for my morning coffee ritual - it gives me a peaceful moment to center myself before the day begins.',
    responseType: 'text',
    insights: [
      'Strong support system is a key strength',
      'Values growth through challenges',
      'Benefits from mindful morning routines'
    ],
    mood: 'positive',
    tags: ['family', 'support', 'growth', 'mindfulness'],
    images: [
      {
        id: 'img_gratitude_1',
        url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
        name: 'morning_coffee.jpg',
        size: 245760,
        type: 'image/jpeg',
        caption: 'My peaceful morning coffee ritual'
      }
    ]
  },
  {
    id: '2',
    exerciseId: '4',
    exerciseTitle: 'Goal Setting Session',
    category: 'goals',
    completedAt: new Date('2024-01-18T14:30:00Z'),
    response: 'My three goals for the next 30 days are: 1) Complete the online course I started last month by dedicating 30 minutes each evening to study. I\'ll measure success by finishing all modules and passing the final assessment. 2) Establish a consistent exercise routine by going to the gym 3 times per week. Success will be measured by actually showing up, regardless of workout intensity. 3) Improve my work-life balance by leaving the office by 6 PM and not checking emails after 8 PM. I\'ll track this daily and aim for 80% compliance.',
    responseType: 'text',
    insights: [
      'Sets specific, measurable goals',
      'Focuses on consistency over perfection',
      'Prioritizes work-life balance'
    ],
    mood: 'motivated',
    tags: ['learning', 'fitness', 'work-life-balance', 'consistency']
  },
  {
    id: '3',
    exerciseId: '3',
    exerciseTitle: 'Mindset Check-In',
    category: 'mindset',
    completedAt: new Date('2024-01-22T09:15:00Z'),
    response: 'In this audio reflection, I discussed my current mindset around perfectionism and how it sometimes holds me back from taking action. I\'ve been recognizing that "good enough" can be better than perfect if it means actually completing projects and moving forward. This has been a recurring theme in my personal development journey.',
    responseType: 'audio',
    insights: [
      'Struggles with perfectionism',
      'Growing awareness of self-limiting beliefs',
      'Values progress over perfection'
    ],
    mood: 'reflective',
    tags: ['perfectionism', 'self-awareness', 'progress']
  },
  {
    id: '4',
    exerciseId: '2',
    exerciseTitle: 'Future Vision Exercise',
    category: 'vision',
    completedAt: new Date('2024-01-25T16:45:00Z'),
    response: 'In 5 years, I see myself leading a small but impactful team in a company that aligns with my values. I\'ve developed expertise in my field and am known for mentoring others. I have a healthy work-life balance, travel regularly, and have built meaningful relationships. I own a home with a garden where I grow my own vegetables. I\'ve written a book or blog that helps others in their personal development journey. Most importantly, I feel confident in my decisions and trust my intuition.',
    responseType: 'text',
    insights: [
      'Values leadership and mentorship',
      'Seeks meaningful work alignment',
      'Desires creative expression and impact'
    ],
    mood: 'motivated',
    tags: ['leadership', 'mentorship', 'creativity', 'balance', 'confidence'],
    images: [
      {
        id: 'img_vision_1',
        url: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop',
        name: 'garden_vision.jpg',
        size: 312480,
        type: 'image/jpeg',
        caption: 'My dream garden where I grow my own vegetables'
      },
      {
        id: 'img_vision_2',
        url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop',
        name: 'leadership_inspiration.jpg',
        size: 287360,
        type: 'image/jpeg',
        caption: 'Visual inspiration for my leadership journey'
      }
    ]
  },
  {
    id: '5',
    exerciseId: '6',
    exerciseTitle: 'Weekly Reflection Video',
    category: 'reflection',
    completedAt: new Date('2024-01-28T18:30:00Z'),
    response: 'This week has been transformative in many ways. I recorded this video reflection to capture not just my thoughts, but also the emotions and energy I\'m feeling. Speaking out loud helps me process experiences differently than writing. I discussed my progress on goals, challenges I faced, and key insights that emerged from difficult conversations at work.',
    responseType: 'video',
    insights: [
      'Benefits from verbal processing',
      'Values emotional expression in reflection',
      'Integrates work challenges into personal growth'
    ],
    mood: 'reflective',
    tags: ['weekly-review', 'emotional-processing', 'work-growth', 'video-reflection']
  }
];

export const samplePlaybookEntries: PlaybookEntry[] = createSampleEntries();

export const generatePlaybookSections = (entries: PlaybookEntry[]): PlaybookSection[] => {
  const sections: PlaybookSection[] = [];
  
  // Group by category
  const categorizedEntries = entries.reduce((acc, entry) => {
    if (!acc[entry.category]) {
      acc[entry.category] = [];
    }
    acc[entry.category].push(entry);
    return acc;
  }, {} as Record<string, PlaybookEntry[]>);

  // Create sections for each category
  Object.entries(categorizedEntries).forEach(([category, categoryEntries]) => {
    const categoryInsights = generateCategoryInsights(category, categoryEntries);
    
    sections.push({
      id: category,
      title: category.charAt(0).toUpperCase() + category.slice(1),
      description: getCategoryDescription(category),
      entries: categoryEntries.sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime()),
      insights: categoryInsights
    });
  });

  return sections.sort((a, b) => b.entries.length - a.entries.length);
};

const getCategoryDescription = (category: string): string => {
  const descriptions: Record<string, string> = {
    gratitude: 'Moments of appreciation and thankfulness that ground you in positivity.',
    goals: 'Your aspirations and the concrete steps you\'re taking to achieve them.',
    mindset: 'Reflections on your thought patterns and mental frameworks.',
    vision: 'Your dreams and long-term vision for your life and career.',
    reflection: 'Deep introspection and self-discovery insights.',
    motivation: 'Sources of inspiration and drive that fuel your growth.'
  };
  
  return descriptions[category] || 'Personal development insights and reflections.';
};

const generateCategoryInsights = (category: string, entries: PlaybookEntry[]): string[] => {
  const allInsights = entries.flatMap(entry => entry.insights || []);
  const uniqueInsights = [...new Set(allInsights)];
  
  // Add category-specific meta insights
  const metaInsights: string[] = [];
  
  if (entries.length >= 3) {
    metaInsights.push(`Strong engagement with ${category} exercises (${entries.length} completed)`);
  }
  
  // Use static date comparison to avoid hydration issues
  const thirtyDaysAgo = new Date('2024-01-01'); // Static reference date
  const recentEntries = entries.filter(entry => 
    entry.completedAt >= thirtyDaysAgo
  );
  
  if (recentEntries.length > 0) {
    metaInsights.push(`Active in ${category} development this month`);
  }
  
  return [...metaInsights, ...uniqueInsights.slice(0, 3)];
}; 