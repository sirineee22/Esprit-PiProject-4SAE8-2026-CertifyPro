export type EventType = 'WEBINAR' | 'WORKSHOP' | 'QNA' | 'MEETUP' | 'BOOTCAMP';
export type EventMode = 'ONLINE' | 'ONSITE' | 'HYBRID';
export type EventStatus = 'UPCOMING' | 'CANCELLED' | 'DONE';
export type LearningLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

export interface Event {
  id: number;
  title: string;
  description?: string;
  trainerId: number;
  trainerFirstName?: string;
  trainerLastName?: string;
  type: EventType;
  mode: EventMode;
  learningLevel: LearningLevel;
  category?: string;
  dateStart: string;
  dateEnd: string;
  meetingLink?: string;
  location?: string;
  maxParticipants: number;
  participantCount?: number;
  waitlistCount?: number;
  recommendationScore?: number;
  recommendationReasons?: string[];
  requiredSkills?: string[];
  program?: { time: string; activity: string }[];
  status: EventStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface EventRegistration {
  id: number;
  eventId?: number;
  learnerId: number;
  learnerFirstName?: string;
  learnerLastName?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'WAITLISTED' | 'ATTENDED';
  registeredAt: string;
}

export interface MyRegistration {
  event: Event;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'WAITLISTED' | 'ATTENDED';
}


export interface CreateEventRequest {
  title: string;
  description?: string;
  type: EventType;
  mode: EventMode;
  learningLevel: LearningLevel;
  category?: string;
  requiredSkills?: string[];
  dateStart: string;
  dateEnd: string;
  meetingLink?: string;
  location?: string;
  maxParticipants: number;
  trainerFirstName?: string;
  trainerLastName?: string;
  program?: { time: string; activity: string }[];
}

export interface EventStats {
  totalEvents: number;
  upcoming: number;
  cancelled: number;
  done: number;
  byType: Record<string, number>;
  byMode: Record<string, number>;
  totalRegistrations: number;
}

export type EventInteractionType = 'CLICK' | 'REGISTER' | 'CANCEL';

export type FeedbackDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

export interface EventFeedbackRequest {
  difficulty: FeedbackDifficulty;
  understood: boolean;
  rating: number;
  whatNext?: string;
}

export interface FeedbackSuggestionResponse {
  targetLevel: LearningLevel;
  message: string;
  suggestedEvent: Event | null;
}
