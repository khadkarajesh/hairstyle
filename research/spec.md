# HairStyle AI — Product Spec
**Last updated:** 2026-06-25  
**Status:** Approved for implementation

---

## Product Vision

HairStyle AI becomes the tool Nepali men open before every haircut — not to browse styles, but to answer a specific question: *"Can I pull this off?"* By session 3, the app knows what styles you've tried, what worked, and what you're aiming for next. It earns money the same way a barber does: when you're ready for a cut, you pay for the session.

---

## North Star Metric

**"Did the user show the generated style to their barber?"**

Not sessions opened. Not styles saved. The barber moment is the only real outcome signal. Everything in this spec is measured against it.

---

## The Single Load-Bearing Assumption

> GPT-Image-2 output must look realistic enough that a user is not embarrassed to show it to their barber.

`feedback.md` explicitly says *"Generated image doesn't resemble the real image."* If this is still true, none of the features below matter — personalized bad results are worse than generic bad results.

**Before building anything else:** run 10 test sessions with real Nepali men's photos. If more than 3 of 10 look unrealistic, the photo capture quality guide (Feature 0) is the entire product priority until resolved.

---

## What Was Rejected (Do Not Revisit Without New Data)

| Idea | Why rejected |
|---|---|
| Monthly subscription | Wrong cadence — haircuts are every 4–6 weeks, not monthly. Users pay NPR 499 in a month they don't need a cut and cancel. |
| Session intent / mood selector | Catalog too thin. 25 styles, max 5 per intent bucket. A round-face user sees 2–3 genuinely different styles between "Professional" and "Casual." Looks like theater. Revisit at 60+ styles. |
| Catalog expansion to 60–80 styles | Expensive prompt QA work. The bottleneck is session learning, not catalog breadth. |
| Session labeling ("June · Casual") | Solves a retention problem that doesn't exist at <100 users. V3 feature. |
| Hair-length targeting (Short/Medium/Long filter) | Misunderstands the job-to-be-done. Users come to imagine a new look, not optimize for current hair. |

---

## Monetization Structure

Credits never expire. No subscription, no renewal anxiety. Pay when you need a cut.

| | Free | Starter | Value | Pro |
|---|---|---|---|---|
| **Price** | NPR 0 | NPR 199 | NPR 499 | NPR 749 |
| **Sessions** | 1 lifetime | 1 | 3 | 5 |
| **Per session** | — | NPR 199 | NPR 166 | NPR 150 |
| **Credits expire?** | — | Never | Never | Never |
| Front view | ✓ | ✓ | ✓ | ✓ |
| Save / Show Barber / Share | ✓ | ✓ | ✓ | ✓ |
| Side angles (left/right) | — | ✓ | ✓ | ✓ |
| Download | — | ✓ | ✓ | ✓ |
| Reference image upload | — | ✓ | ✓ | ✓ |
| Session 2+ personalisation | — | ✓ | ✓ | ✓ |

**Payment:** WhatsApp → manual service-role upsert to `credits.sessions_remaining`. Khalti is a future webhook drop-in — same upsert, different trigger.

**The upgrade moment:** User finishes free session → taps "New session" → sees credit pack options. Framing: *"Each session is personalised based on what you liked last time."*

**DB change required:** Replace `subscriptions` table logic with a `credits` table:
```sql
CREATE TABLE credits (
  user_id uuid REFERENCES auth.users NOT NULL UNIQUE,
  sessions_remaining int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
```
WhatsApp activation = service-role upsert adding credits. Free tier = 1 session baked into session creation logic, not stored in credits.

---

## Session Progression — What It Feels Like

**Session 1 — Discovery (Free)**  
You upload your photos, the AI analyzes your face, and you see 10 hairstyles rendered on your actual face. You save 2 — Comma Hair and Wolf Cut. You show Wolf Cut to your barber. This costs nothing.

**Session 2 — Refinement (Paid credit)**  
Six weeks later, your hair has grown out. You buy a starter pack (NPR 199). You optionally upload a reference photo — a K-drama actor's cut you've been thinking about. The app knows you saved wavy styles last time. It surfaces 4 styles you haven't seen yet, weighted toward wavy-textured medium length, plus an assessment of whether the actor's cut works on your face. You're not starting from zero.

**Session 3 — Evolution (Paid credit)**  
You got Comma Hair last time and showed it to your barber. Session 3 knows this. It recommends what comes next — Wolf Cut as a grow-out direction, Korean Perm as a variation, Curtain Fringe as a refinement. The app is now your style progression tracker, not a one-time preview tool.

---

## Feature 0 — Photo Capture Quality Guide

**Priority: Build first. Precondition for all other features.**

### Problem
The AI generates hairstyle previews on the user's face. If the uploaded photo has poor framing (face too small, off-center, bad angle), the generated output doesn't look like the user. All personalization features amplify session 1 quality — if session 1 output is bad, amplification makes it worse.

### User flow
1. Upload page shows a face-in-circle alignment guide overlay on the camera/preview
2. Circle is positioned at the vertical center of the frame
3. Label: *"Fill the circle with your face — shoulders visible, look straight ahead"*
4. Optional: amber warning if face is too small or off-center (via client-side face detection or just a static guide — static guide ships first)

### Technical changes
- `app/upload/page.tsx`: add SVG circle overlay on the photo preview slots
- Circle is decorative only (v1) — no detection logic
- Add instructional copy below each slot: *"Face forward, neutral expression"*
- Add a dismissible tip card on first visit: *"Better photos → better results"*

### Success metric
Reduction in user-reported "doesn't look like me" feedback. Proxy: increase in `shown_to_barber` rate after feature ships.

### What good looks like
User uploads a well-framed photo → generated output is clearly the same person with a different hairstyle → they immediately want to show it to someone.

### What can go wrong
Static overlay guide is ignored and users upload poor photos anyway → no quality improvement. If this happens, add basic face-size validation (warn if face bounding box is <30% of image area).

---

## Feature 1 — Saved-Style Signal in Session 2

**Priority: Build second. Zero schema change, immediate session 2 improvement.**

### Problem
Session 2 ignores everything learned in session 1. Same face → same analysis → same 8 of 10 styles recommended. The app has `saved` booleans on every style but uses none of them.

### User flow
1. User completes session 1, saves Comma Hair and Wolf Cut
2. 5 weeks later, haircut reminder fires
3. User starts session 2 — uploads new photos as normal (no UX change)
4. Behind the scenes: Claude receives *"User saved Comma Hair and Wolf Cut in their last session — weight toward similar styles"*
5. Session 2 surfaces Korean Perm, Curtain Fringe, Bro Flow — the natural next step

### Technical changes
- `app/api/sessions/[id]/process/route.ts`: before Claude call, fetch prior sessions' `session_styles` where `saved = true` for this user
- Build a comma-separated list of saved style names
- Append to Claude prompt: *"The user saved [style names] in a previous session. Weight recommendations toward styles with similar characteristics (length, texture, structure). Avoid recommending these exact styles again."*
- One additional DB query, ~80 extra prompt tokens, no schema change

### Monetization tie-in
Session 2 requires a paid credit. The value proposition is explicit: *"Your next session is personalised based on what you liked."*

### Success metric
Session 2 save rate ≥ session 1 save rate. If personalisation is working, users find more styles worth saving the second time.

### What good looks like
User saved wavy styles in session 1 → session 2 shows zero buzz cuts, all recommendations are wavy or textured medium-length styles.

### What can go wrong
Claude ignores the saved-style instruction and recommends based purely on face shape → session 2 looks identical → user feels cheated for spending a credit. **Mitigation:** test this prompt change on 5 real photo sets before shipping.

---

## Feature 2 — Shown-to-Barber Signal

**Priority: Build after credits ship.**

### Problem
The app has no feedback loop. It doesn't know if it actually helped. It can't improve recommendations based on what users actually got cut. The north star metric is unmeasurable.

### User flow
1. User completes a session and saves a style
2. 48 hours later: a subtle prompt appears on the results page — *"Did you show any of these to your barber?"*
3. Style cards get a *"✂ Showed barber"* one-tap toggle — no form, no rating
4. Second prompt fires 3 days before haircut reminder date
5. Session 3: Claude receives *"User showed Comma Hair to their barber"* → weights toward evolutions of that cut

### Technical changes
- DB migration: `ALTER TABLE session_styles ADD COLUMN shown_to_barber boolean NOT NULL DEFAULT false;`
- New PATCH endpoint: `/api/sessions/[id]/styles/[styleId]/barber` (mirrors existing `/save` endpoint)
- `app/session/[id]/page.tsx`: localStorage-based 48hr trigger to surface the prompt banner
- `app/api/sessions/[id]/process/route.ts`: fetch `shown_to_barber = true` styles from prior sessions → include in Claude prompt: *"User showed [style] to their barber — they acted on this recommendation. Consider styles that are natural progressions of this cut."*

### Success metric
**North star:** % of completed sessions where at least one style is marked `shown_to_barber` within 7 days. Target: >30%.

### What good looks like
User got Comma Hair, comes back for session 3 → Claude recommends Curtain Fringe and Wolf Cut as natural progressions, nothing that ignores their established preference.

### What can go wrong
Users don't notice the 48hr prompt or ignore it → `shown_to_barber` stays at 0% → no north star data and no session 3 improvement. **Mitigation:** make the prompt impossible to miss on results page (not a toast — a persistent banner until dismissed).

---

## Feature 3 — Reference Image Upload

**Priority: Build last. Highest value, highest risk, needs output quality validated first.**

### Problem
Users don't think in catalog abstractions. They see Son Heung-min's haircut or a K-drama character and want *that*. The current app can't answer *"can I pull this off?"* — the only real question returning users have.

### User flow
1. Upload page gains an optional 4th slot: *"Got a style in mind? Add a reference photo"* (actor, footballer, Instagram)
2. Reference photo is optional — existing flow unchanged if skipped
3. Claude receives all 4 images and a modified prompt: *"The user wants to know if the style in the reference photo can work on their face. Assess fit honestly. If it works, include it in recommendations and label it 'Your reference.' If it doesn't work, explain why in one sentence and show the 2–3 closest alternatives from the catalog."*
4. Results page: reference-matched style shown first with *"Closest to your reference"* badge
5. If the reference style isn't in the catalog, Claude generates a description that is passed to GPT-Image-2 as a custom prompt (beyond catalog)

### Technical changes
- `app/upload/page.tsx`: 4th optional image slot, labeled clearly as reference
- `sessions` table migration: `ADD COLUMN has_reference boolean DEFAULT false, ADD COLUMN reference_style_description text`
- Storage: upload reference to `uploads/{userId}/{sessionId}/reference.jpg`
- `app/api/sessions/[id]/process/route.ts`: if reference exists, download it, include as 4th image in Claude call, swap to reference-aware prompt
- `app/session/[id]/page.tsx`: "Closest to your reference" badge on matching style card

### Gate
Reference image upload is **paid sessions only**. Free-tier users do not see the reference slot.

### Success metric
% of paid sessions that include a reference image. Target: >40% within 60 days of launch. If below 20%, the feature has a discoverability problem, not a value problem.

### What good looks like
User uploads a photo of Jungkook's current haircut → app says *"This curtain fringe suits your oval face well — here's how it looks on you specifically. If you want a shorter version, Textured Crop is your closest alternative."*

### What can go wrong
GPT-Image-2 cannot faithfully render a specific reference style → output looks nothing like the reference → user is more disappointed than if they hadn't uploaded a reference at all. **Mitigation:** validate with 20+ test runs across diverse reference images before shipping. Add disclaimer: *"Results are inspired by your reference — exact replication depends on your hair type and barber skill."*

---

## Implementation Priority

| # | Feature | Effort | Dependency | Ship when |
|---|---|---|---|---|
| 0 | Photo capture quality guide | 4 hrs | None | **Now** |
| 1 | Saved-style signal in Claude prompt | 4–6 hrs | None | After #0 |
| 2 | Credit pack restructure (credits table, upgrade copy, gate) | 6–8 hrs | None (parallel with #1) | After #0 |
| 3 | Shown-to-barber signal + 48hr prompt | 6–8 hrs | Credits shipped | After #2 |
| 4 | Reference image upload | 12–16 hrs + 20-run QA | Output quality validated | After #3 |

---

## DB Migrations Required

```sql
-- Migration 006: credits table (replaces subscriptions for session gating)
CREATE TABLE credits (
  user_id uuid REFERENCES auth.users NOT NULL UNIQUE,
  sessions_remaining int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE credits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_read_own_credits" ON credits
  FOR SELECT USING (auth.uid() = user_id);

-- Migration 007: shown_to_barber signal
ALTER TABLE session_styles
  ADD COLUMN shown_to_barber boolean NOT NULL DEFAULT false;

-- Migration 008: reference image support
ALTER TABLE sessions
  ADD COLUMN has_reference boolean NOT NULL DEFAULT false,
  ADD COLUMN reference_style_description text;
```

---

## Open Questions (Resolve Before Each Feature Ships)

1. **WhatsApp number** — `977XXXXXXXXXX` placeholder still live in `app/upgrade/page.tsx` and `app/page.tsx` footer. Blocks all revenue.
2. **Supabase migration 005** (`subscriptions` table) — needs to be applied in Supabase SQL editor before subscription gating works in production.
3. **Output quality baseline** — run 10 real test sessions before building Feature 1 onwards. Document pass/fail rate.
4. **Shown-to-barber prompt timing** — 48hr delay assumes user gets the cut quickly. May need adjustment based on real user behavior.
