-- Add beta testing consent columns to public.profiles
-- beta_consent_agreed: tracks Letter of Intent acceptance (email/password signup required, OAuth post-login)
-- llm_consent_agreed: tracks Phase 2+ LLM feature opt-in (admin-only, family-wide decision)

ALTER TABLE public.profiles
ADD COLUMN beta_consent_agreed BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN llm_consent_agreed BOOLEAN DEFAULT NULL;

-- Set existing users to beta_consent_agreed = true (no existing beta testers, for redundancy)
UPDATE public.profiles
SET beta_consent_agreed = TRUE
WHERE beta_consent_agreed = FALSE;
