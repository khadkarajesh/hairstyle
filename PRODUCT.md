# HairStyle AI — Product Clarity Document

> Last reviewed: 2026-06-23 — critique applied inline, implementation changes noted at bottom.

---

## 1. What makes a user's life easier

The core job-to-be-done is: **eliminate the gap between "I want a new look" and "I know exactly what to tell my barber."**

Today's user journey is painful:
- Spend 20–40 minutes on Pinterest/Instagram searching random styles
- Screenshot something on a white guy with different hair texture
- Show it to the barber → barber interprets it differently
- Walk out disappointed or with a "safe" cut they've had 10 times

What this product replaces:
- **Research** → AI recommends 10 styles matched to your face shape
- **Uncertainty** → You see it on your actual face before committing
- **Miscommunication** → Show the barber the exact generated image

The simplest version that delivers this: upload 3 photos, get 10 previews, pick one, show the barber. That's the whole product for V1.

What makes it feel effortless:
- Under 60 seconds to get results
- Results on your face, not a stock model's face
- One tap to save → one tap to show barber (full-screen, brightness maxed)
- First session requires no account — reduce friction to first "aha" moment

---

## 2. The social-media-addicted user

### What drives them
This user doesn't know what haircut they want — they know what *feeling* they want: to look like someone they admire. Their reference points in Nepal:

1. **Korean/K-pop** — comma hair, curtain fringe, textured crop. Driven by BTS, Stray Kids, K-dramas. Dominant among 18–28 males. **This is the single biggest trend driver for the target age group — prioritise this.**
2. **Bollywood** — slick back, pompadour, quiff. Shah Rukh, Ranveer Singh. Stronger pull in the 28–38 crowd.
3. **Football athletes** — Neymar, Ronaldo, Mbappé. Strong in 16–24 but this demographic skews below the 50k income target.
4. **Local influencers** — smaller reach but highest trust. A popular Nepali TikToker changing their cut moves followers within days.
5. **Office/professional image** — the primary target user (software engineer, doctor). Wants to look sharp without researching trends.

> **Critique note:** Listing 5 equal influencer types is a hedging trap. With a bootstrap budget you cannot market to all five simultaneously. For V1, pick one: **the K-pop/professional crossover** — young professional, 24–32, earns 60–80k, watches K-dramas, wants a clean modern cut without effort. That's the wedge. Everyone else is a second wave.

### What drives their decision
- **Identity signal**: "I want to look like someone who is successful / stylish / confident"
- **Social validation**: Will this get noticed? Will people ask about it?
- **Low-risk desire**: They want to experiment but fear a bad cut lasting 6 weeks

### How to persuade them
The hook is not "AI hairstyle tool" — it's **"See yourself as [the look] before you commit."**

Persuasion levers:
- **Cultural anchoring in style names**: Label styles "K-pop Comma Hair", "Bollywood Slick Back", "Footballer Crop" — same 10 AI styles, named to match their reference world
- **The mirror moment**: The before/after slider IS the persuasion. Dragging it and seeing your own face transform is the shareable, sticky moment
- **Social proof**: "2,400+ professionals in Nepal have tried this" on landing — once real data exists, replace with "Most saved this week: Comma Hair"
- **Shareability**: The generated image on their actual face is inherently shareable. An export card ("I tried HairStyle AI") is free acquisition

---

## 3. Trending styles as a paid feature

Yes — but V2, not V1.

**Why it works for retention:**
- Free tier: face-shape matched recommendations (personal, private)
- Paid tier: browse what's trending in Nepal this week + try any style on your face
- Trending content is the only reason to re-open the app between haircuts

**Implementation for V2:**
Don't build a trending algorithm. Manually curate 5 styles weekly. Use save/like data from V1 to surface what users actually want.

---

## 4. Features that add real value

| Feature | Value | Effort | When |
|---|---|---|---|
| **Show Barber screen** (full-screen, brightness max) | Very high | Low | **V1 — missing, build now** |
| Haircut reminder (4–6 weeks after session) | High | Low | V1 |
| Style names with cultural anchors | High | Very low | **V1 — change now** |
| Expectation disclaimer ("inspiration, not guarantee") | High | Very low | **V1 — change now** |
| Social share card (before/after) | Medium | Low | V2 |
| Trending styles browse | High | Medium | V2 |
| Occasion picker (interview, wedding, casual) | Medium | Medium | V2 |
| Style description in words → generate | Medium | Low | V2 |
| Barber finder near you | ~~High~~ **Separate business** | Very high | Drop — scope creep |

> **Critique note:** "Barber finder" is a marketplace, not a feature. Building it is a 12-month project. Remove it from the roadmap entirely — it dilutes focus and creates a false sense of completeness in the plan.

---

## 5. What can fail the product

### Technical failures

- **AI output quality on South/East Asian hair** — This is the single biggest risk and deserves more than a bullet point. Dark, thick, straight Nepali hair is likely underrepresented in gpt-image-1's training data. The product's entire premise collapses if the output looks like a bad Photoshop job. **Mitigation:** Run output quality tests on 10 real Nepali photos before any public launch. If quality fails, explore prompt engineering tweaks (explicitly describe Nepali hair texture in prompts) or fall back to showing reference-style images overlaid rather than face-composited results.

- **Generation time** — 60 seconds is already asking a lot. 3–5 minutes kills it. The SSE streaming helps perception but doesn't fix slow generation.

- **Unit economics are broken at 499 NPR/month** — Each session costs $0.50–2.00 in API costs (Claude + 10× gpt-image-1). At 499 NPR ≈ $3.70/month, a user running 2 sessions per month already costs more than they pay. This isn't a V2 problem — it's a V1 problem that needs to be priced for at launch.

### Market failures

- **The barber can't execute it** — The product delivers its promise (you see the style), but the user still walks out disappointed because the barber couldn't execute. They blame the app. **Mitigation:** Curate styles that are achievable in most barbershops. Add a disclaimer: "Style inspiration — results depend on hair type and barber skill." Not glamorous, but honest.
- **One-and-done usage** — People cut hair every 4–6 weeks. Without a retention hook, the app gets deleted between cuts.
- **Privacy resistance** — Face photos are a high-trust ask. One data breach perception kills word-of-mouth instantly.

### Competitive failures
- **Free alternatives** — FaceApp, Remini, and future AI tools will add hairstyle features. The moat is quality + Nepal-specific experience + barber communication workflow, not the AI itself.
- **Barber booking apps** — If a booking platform adds AI preview as a free feature inside their existing app, the standalone value prop collapses.

---

## 6. Why it would specifically fail

The most likely failure mode: **the gap between AI preview and real-world result.**

Sequence:
1. User loves the AI preview (product works)
2. User shows the barber
3. Actual haircut looks 70% like the preview
4. User feels misled
5. User doesn't return, tells friends it doesn't work

The second most likely failure: **no retention loop.** A product opened 8–10 times per year is nearly impossible to build a business on. A haircut reminder notification is not a retention strategy — it's a band-aid. Real retention comes from the product being so good that users tell friends ("you have to try this before your next haircut"). Word of mouth is the only real retention lever at this stage.

---

## 7. How to fail faster

### The Wizard of Oz test (do this week, before building anything else)
Don't use AI. Take 5 target users (software engineers, doctors in Kathmandu, 50k+ income). Ask them to send 3 photos via WhatsApp. Manually use FaceApp or hire a designer to create 3–5 hairstyle previews on their actual photos. Send results back. Ask: **"Would you pay 500 NPR/month for this in 60 seconds?"**

- If no → the concept is wrong. Stop building.
- If yes → you have a paying customer before writing a real API call.

> **Critique note:** The document was written after building. The test should have come first. This isn't a mistake that can be undone, but it means the next 2 weeks need to be user testing, not feature building. The sandbox is complete enough to show 10 people and get honest feedback right now.

### The one question that matters
After showing any result: **"Did you show this to your barber? Did you get the cut?"**

This is the only real success signal. Sessions opened, styles saved, time-in-app — all proxies. The barber moment is the outcome.

### Fast failure timeline
- **This week:** 5 Wizard of Oz tests. Willingness to pay?
- **Week 2:** Show the sandbox to 10 people. Where do they drop off?
- **Week 3:** Run 1 real AI session on a Nepali face. Is output quality acceptable?
- **Week 4:** Ask for money. Even 200 NPR. Do they pay?

---

## 8. Measuring success — per iteration

### Iteration 0 (now): Output quality
**Question: Does the AI output pass the bar for Nepali hair?**
- Show 5 real users. Rate output 1–5.
- Pass bar: ≥4/5 average, ≥3 of 5 say "I would show this to my barber"
- If fails: fix prompt engineering before anything else

### Iteration 1: MVP flow
**Question: Do users complete the flow and find value?**
- Upload completion (3 photos → submit): target >70%
- Analyzing → results: target >90%
- Styles saved per session: target ≥1
- Return within 6 weeks: target >30%

### Iteration 2: First paid users
**Question: Will anyone pay?**
- Free → paid conversion: target >5%
- Sessions per paying user/month: target >1 (even 1 means they used it for a haircut)
- Churn month 1→2: target <30%

### Iteration 3: Retention
**Question: Is there a reason to come back?**
- MAU / registered ratio: target >40%
- Word-of-mouth referrals: target >30% of new users within 3 months

### The north star metric
**Did the user show the generated style to their barber?**

> **Critique note:** The previous north star was "sessions per paying user per month." That's a proxy. The real outcome is the barber moment. You can't measure it automatically — but you can ask users directly via a one-question follow-up 48 hours after a session: "Did you use this at your barbershop? 👍 / 👎". That single question is worth more than any in-app analytics.

---

## V1 scope — final recommendation

V1 must do exactly one thing well:

> **A user uploads 3 photos, gets 10 AI hairstyle previews on their face, picks one, and shows it to their barber.**

### What's in
- 3 free sessions (no credit card, no account required for first session)
- Upload → AI analysis → 10 previews
- Save look
- **Show Barber screen** (full-screen, brightness maxed — the moment that closes the loop)
- Haircut reminder (simple, one tap after saving a look)
- Style names with cultural anchors (K-pop, Bollywood, etc.)
- "Style inspiration, not a guarantee" disclaimer

### What's out of V1
- Trending styles (V2)
- Social sharing (V2)
- Barber finder (dropped entirely)
- Annual plans, feature tiers (keep pricing simple: 3 free → 499 NPR/month unlimited)

### Pricing correction
499 NPR/month unlimited sessions is unsustainable at $0.50–2.00/session API cost. **Revised model:**
- Free: 3 sessions total (not per month — permanent free allocation to reduce acquisition friction)
- Paid: 499 NPR/month for up to **3 sessions/month** (matches natural haircut frequency, caps API cost at ~$6/user/month — still tight but workable)
- Power users who want more: 799 NPR/month for 6 sessions

This caps downside, still feels unlimited to the average user (one haircut per month = 3 sessions is plenty), and keeps the pricing page simple.

---

## Implementation changes from this critique

The following were identified as V1 gaps and have been applied to the codebase:

1. **Show Barber screen** — Added to `app/session/[id]/style/[styleId]/page.tsx`. Full-screen mode, hides all UI chrome, brightness hint text. Tap anywhere to exit.
2. **Cultural anchor style tags** — Updated `lib/styles-data.ts`. Tags now read "K-POP", "BOLLYWOOD", "FOOTBALLER", etc. instead of generic "CLASSIC", "SOFT".
3. **Expectation disclaimer** — Added to `app/session/[id]/page.tsx` results header: "Style inspiration — results vary by hair type and barber skill."
4. **Privacy note on upload** — Added to `app/upload/page.tsx` below the photo slots: "Photos are processed securely and not stored beyond your session."
