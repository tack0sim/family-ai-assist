# Family Assist – Beta Testing Letter of Intent

## Purpose

This Letter of Intent describes what to expect when you test Family Assist during the beta program. It explains what data we collect, how we use it, and what we're building next.

**This is not a legal contract.** It's a straightforward explanation of the testing program. Either of us can stop the beta testing relationship at any time.

---

## 1. What You're Testing

### Phase 1 (Now)

- Family calendar and event scheduling
- Event details, assignments, and categorization

### Phase 2+ (Planned, requires separate consent)

- AI chat assistant (basic, non-LLM)
- File sharing across the family
- LLM-powered AI assistant (can read your calendar and events to give better responses)
- Additional features to be announced

This Letter of Intent covers all phases. You won't need to re-accept it for each new feature, but we'll ask for specific consent when LLM features launch.

---

## 2. What We Ask From You

- **Give feedback** — Fill out our feedback forms and let us know what works and what doesn't
- **Tell us about bugs** — Report crashes, glitches, or confusing parts of the app
- **Expect instability** — Beta features may be incomplete, change significantly, or break between updates
- **Back up important data** — We might reset data during testing. Don't rely solely on Family Assist for critical information
- **Keep credentials private** — Don't share your login or family member data with anyone outside your family

---

## 3. What We Commit To

- **Keep improving** — We're actively developing and will deploy updates regularly
- **Tell you about updates** — When we push new features or fixes, you'll see a notification in the app
- **Be transparent** — We'll share our roadmap and explain major changes
- **Listen to feedback** — We read your bug reports and feature requests
- **Protect your data** — All data handling complies with GDPR and German data protection law (BDSG)

---

## 4. What Data We Collect

### Authentication

- Email address
- Password (stored securely)
- Avatar/profile image
- Login/signup timestamps

### Family & Events

- Family name and member names
- Event titles, descriptions, dates, times, and type (event/appointment/reminder/deadline)
- Event assignments (who is involved)
- Event tags/categories

### AI Chat (LLM, Phase 2+)

When we launch LLM features, the AI will be able to read:

- Your calendar events (title, description, details)
- Family member names
- Your messages to the AI
- Chat history with the AI assistant

We will **never** share passwords, email addresses, or sensitive account info with the AI.

### Feedback

- Your responses to feedback forms and bug reports

### What We Don't Collect

- Your IP address (Vercel's hosting platform collects this; it's not ours to control)
- Precise location data
- Data from other apps or services

---

## 5. How We Use Your Data

- Fixing bugs and improving the app based on real usage
- Understanding what works well and what doesn't
- Training and iterating on features
- Complying with legal requirements

---

## 6. Your Data Rights (GDPR & BDSG)

You can:

- **Ask for a copy** of all data we have about you
- **Fix inaccurate data** we're storing
- **Delete your account and data** anytime
- **Stop us from processing** your data for specific reasons
- **Get your data in a portable format**

To exercise any of these rights, use the feedback form in the app.

---

## 7. What Happens to Your Data

### If You Delete Your Account

Everything goes away:

- Profile data (email, name, avatar)
- All events you created
- All events where you're assigned
- Chat history
- Any files you uploaded

This deletion is **permanent with no recovery.**

### If You Leave a Family

- Your profile stays (you can join other families)
- Events within that family are removed from your view
- You can rejoin the family later if invited

### If a Family Admin Removes You

- Your profile stays
- Family-specific data is deleted
- You'd need a new invitation to rejoin

### While You're in Beta

Your data stays in our systems as long as you're testing. After you delete your account, we keep data for **90 days** to finish cleanups, then it's removed.

---

## 8. Who Handles Your Data

### Supabase (Database)

Stores your events, family info, and chat history. Encrypted and secure.

### Vercel (Hosting)

Hosts the app and collects analytics (page views, errors, device info). This is outside our direct control but complies with data protection laws.

### Redis (Cache)

Temporarily stores session and rate-limit data. Not permanent.

### LLM Provider (Phase 2+)

When we launch LLM features, your calendar data goes to an AI provider for processing. **You'll get a separate consent prompt before this happens**, explaining exactly which provider and what they do with the data.

All of these use agreements ensuring your data stays protected.

---

## 9. LLM & Two-Step Consent

### Now (This Checkbox)

By accepting this Letter, you agree to:

- Data collection and processing as described
- Participation in all planned phases
- Receiving a separate LLM consent prompt when Phase 2+ launches

### Later (Phase 2+ Consent)

When we launch LLM features:

1. You'll see a prompt asking specifically about LLM consent
2. It will explain which AI provider we use, what data they access, and how long they keep it
3. **Important**: If **any** family member says no to LLM, the **entire family** doesn't get LLM features. It's a family-wide decision.

### If You Say No to LLM

- Your family keeps using the calendar normally
- All non-LLM features work exactly the same
- **The AI chat will not be available** (only calendar features)
- You can change your mind anytime and re-enable LLM and AI chat

---

## 10. Pricing

### Beta Testing is Free

No charges during any beta phase.

### When We Launch Publicly (GA)

- **Core features** (calendar, events): Stay free forever
- **AI chat and premium features**: Likely under a subscription model (details coming later)
- **We'll give you notice** before any pricing changes

---

## 11. What to Expect

This is beta. Things will:

- Change without warning
- Sometimes break
- Feel incomplete
- Improve based on your feedback

We can't guarantee the app will be available 24/7 or that your data won't have issues during testing.

---

## 12. Stopping Beta Testing

You can quit anytime:

- Delete your account through app settings, or
- Use the feedback form to contact us

If we end the beta program:

- We'll give you 30 days' notice
- Your data will be deleted unless you migrate to the public version

---

## 13. Changes to This Letter

We may update this document to reflect new features, legal changes, or clarifications. Major changes will be announced in-app with 15 days' notice.

---

## 14. Your Acceptance

By clicking the checkbox during signup, you confirm that you agree to this Letter of Intent:

- I have read and understand this Letter of Intent for Family Assist beta testing

- I agree to the collection and processing of my data as described in this document

- I understand that beta testing is unstable and features may change or break

- I understand that I will be asked for separate consent when LLM features launch in Phase 2+

- I understand that if I decline LLM consent, my family cannot use AI chat features

- I accept my data rights and responsibilities under this Letter and German data protection law

---

## 15. Get in Touch

**Questions about this Letter or your data?**  
Use the feedback form in the app. You can also request to delete your account there.

**Data protection inquiries:**  
Use the feedback form to request a copy of your data, delete your account, or exercise any of your rights.

---

## Appendix: What Data We Collect (Quick Reference)

| Type | Details | Kept Until? | AI Can See? |
| ------ | --------- | ------------ | ----------- |
| **Login** | Email, password, avatar, dates | You delete account | No |
| **Family** | Name, member names | You delete account | Yes (Phase 2+) |
| **Events** | Title, description, time, type | You delete account/leave family | Yes (Phase 2+) |
| **Event Details** | Assignments, tags, metadata | You delete account/leave family | Yes (Phase 2+) |
| **Chat** | Messages to AI assistant | You delete account | No (Phase 1); Yes (Phase 2+) |
| **Files** | Documents you upload | You delete account/delete file | No |
| **Feedback** | Your form responses | Indefinitely (anonymous) | No |

---

## Appendix: Legal Basis

Data collection is based on:

- Your consent (this Letter)
- Performance of beta testing services
- Compliance with German data protection law (GDPR & BDSG)

If you live in Germany or the EU, your data rights under GDPR apply in full.

---

**Version**: 1.0  
**Date**: 2026-09-08  
**Effective When**: Published on signup form
