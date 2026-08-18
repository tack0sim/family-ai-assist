/**
 * Database event row type matching the events table schema
 */
export interface Event {
  all_day: boolean;
  created_at: string;
  created_by: string;
  description?: string;
  end_at: string;
  family_id: string;
  id: string;
  recurrence_count?: number;
  recurrence_expires_at?: string;
  rrule?: string;
  start_at: string;
  title: string;
  type: string;
  updated_at: string;
  visibility: "family" | "personal";
}

/**
 * Event with associated assignees and tags
 */
export interface EventWithDetails {
  assignees?: Array<{ id: string; event_id: string; profile_id: string }>;
  event: Event;
  tags?: Array<{ id: string; event_id: string; tag_id: string }>;
}
