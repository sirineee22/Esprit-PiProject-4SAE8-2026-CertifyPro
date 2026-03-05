export type EventType = 'WEBINAR' | 'WORKSHOP' | 'QNA' | 'MEETUP' | 'BOOTCAMP';
export type EventMode = 'ONLINE' | 'ONSITE' | 'HYBRID';
export type EventStatus = 'UPCOMING' | 'CANCELLED' | 'DONE';

export interface Event {
  id: number;
  title: string;
  description?: string;
  trainerId: number;
  trainerFirstName?: string;
  trainerLastName?: string;
  type: EventType;
  mode: EventMode;
  dateStart: string;
  dateEnd: string;
  meetingLink?: string;
  location?: string;
  maxParticipants: number;
  participantCount?: number;
  waitlistCount?: number;
  program?: { time: string; activity: string }[];
  status: EventStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface MyRegistration {
  event: Event;
  status: 'REGISTERED' | 'WAITLISTED' | 'CANCELLED' | 'ATTENDED';
}

export interface Review {
  id?: number;
  learnerId?: number;
  learnerFirstName: string;
  learnerLastName: string;
  rating: number;
  comment: string;
  createdAt?: string;
}

export interface CreateEventRequest {
  title: string;
  description?: string;
  type: EventType;
  mode: EventMode;
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
