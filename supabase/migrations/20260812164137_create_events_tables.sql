-- Create events table with recurrence support
CREATE TABLE public.events (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id        uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  created_by       uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title            text NOT NULL,
  description      text,
  start_at         timestamptz NOT NULL,
  end_at           timestamptz NOT NULL,
  all_day          boolean DEFAULT false,
  type             text NOT NULL CHECK (type IN ('event', 'appointment', 'reminder', 'deadline')),
  visibility       text NOT NULL CHECK (visibility IN ('family', 'personal')) DEFAULT 'family',
  
  -- Recurrence metadata (stores RRULE string but v1 doesn't expand instances)
  rrule            text,
  recurrence_count integer,
  recurrence_expires_at timestamptz,
  
  -- Timestamps
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now(),
  
  CONSTRAINT valid_time_range CHECK (end_at > start_at)
);

-- Create event_assignees table to link events to family members
CREATE TABLE public.event_assignees (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id  uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (event_id, profile_id)
);

-- Create event_tags_config table for family-specific tag configuration
CREATE TABLE public.event_tags_config (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  name      text NOT NULL,
  color     text,
  created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (family_id, name)
);

-- Create event_tags table to link events to tags
CREATE TABLE public.event_tags (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id  uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  tag_id    uuid NOT NULL REFERENCES public.event_tags_config(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (event_id, tag_id)
);

-- Create performance indexes
CREATE INDEX idx_events_family_start ON public.events(family_id, start_at);
CREATE INDEX idx_events_family_type ON public.events(family_id, type);
CREATE INDEX idx_event_assignees_profile ON public.event_assignees(profile_id);
CREATE INDEX idx_event_tags_event ON public.event_tags(event_id);
CREATE INDEX idx_event_tags_config_family ON public.event_tags_config(family_id);
