export const JOB_STATUS = {
  SUBMITTED: 'submitted',
  SEO_RESEARCH: 'seo_research',
  DRAFTING: 'drafting',
  AWAITING_REVIEW: 'awaiting_review',
  ADAPTING: 'adapting',
  READY_TO_PUBLISH: 'ready_to_publish',
  SCHEDULING: 'scheduling',
  PUBLISHED: 'published',
  FAILED: 'failed',
} as const;

export type JobStatus = typeof JOB_STATUS[keyof typeof JOB_STATUS];

export const PLATFORMS = {
  LINKEDIN: 'linkedin',
  X: 'x',
  EMAIL: 'email',
} as const;

export type Platform = typeof PLATFORMS[keyof typeof PLATFORMS];

export const URL_CLASSIFICATION = {
  SOCIAL: 'social',
  PAYWALL: 'paywall',
  STANDARD: 'standard',
} as const;

export const KNOWN_PAYWALL_DOMAINS = [
  'wsj.com',
  'nytimes.com',
  'bloomberg.com',
  'ft.com',
  'economist.com',
  'medium.com',
];

export const SOCIAL_DOMAINS = [
  'linkedin.com',
  'twitter.com',
  'x.com',
];
