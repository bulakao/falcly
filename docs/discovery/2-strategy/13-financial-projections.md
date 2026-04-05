# Falcly — Financial Projections

> **Date:** 2026-04-05 (updated from 2026-03-30)
> **Changes:** Finalized pricing ($4.99/$47.99/$99.99 PH; $6.99/$55.99/$99.99 US), 30-day trial, lifetime plan added

---

## Executive Summary

Falcly's financial model is built on a two-phase market entry: Philippines (Year 1, organic) followed by US/West expansion (Year 2). PH validates the concept and proves willingness-to-pay. US is the inflection point — users pay 40% more per month, market is 12x larger. Combined, Year 2 end state reaches ~$120K–$170K ARR — solo-project independence territory.

---

## 1. Assumptions

| Item | Value |
|------|-------|
| PH launch | Android-first via Google Play |
| PH pricing | $4.99/mo · $47.99/yr · $99.99 lifetime |
| US/West pricing | $6.99/mo · $55.99/yr · $99.99 lifetime |
| Trial period | 30 days free (set in Play Console / App Store Connect) |
| PH growth | Organic only (r/PHCreditCards, TikTok, word of mouth) |
| US launch timing | Month 13+ |
| US platforms | iOS + Android |
| Free → trial conversion | 15% (30-day trial lowers friction vs 14-day) |
| Trial → paid | 25% PH · 30% US (finance app + hard card gate) |
| Plan mix | 55% monthly · 35% annual · 10% lifetime |
| Monthly churn | 5% (typical mobile subscription) |
| Store cut | 15% (Small Business Program enrolled) |

---

## 2. Blended ARPU (after store cut)

**PH market:**
| Plan | Gross | Net (−15%) | Weight | Weighted net/mo |
|------|-------|-----------|--------|----------------|
| Monthly | $4.99 | $4.24 | 55% | $2.33 |
| Annual | $47.99/yr = $4.00/mo | $3.40/mo | 35% | $1.19 |
| Lifetime | $99.99 one-time | $84.99 | 10% | — (one-time) |
| **Blended recurring** | | | | **~$3.52/mo** |

**US market:**
| Plan | Gross | Net (−15%) | Weight | Weighted net/mo |
|------|-------|-----------|--------|----------------|
| Monthly | $6.99 | $5.94 | 55% | $3.27 |
| Annual | $55.99/yr = $4.67/mo | $3.97/mo | 35% | $1.39 |
| Lifetime | $99.99 one-time | $84.99 | 10% | — (one-time) |
| **Blended recurring** | | | | **~$4.66/mo** |

---

## 3. PH Year 1 — Baseline (Organic)

No paid acquisition. Steady growth from Reddit, TikTok, word-of-mouth.

| Month | MAU | Trials | Paid Users | MRR (USD net) |
|-------|-----|--------|-----------|--------------|
| M1 | 200 | 30 | 8 | ~$28 |
| M3 | 800 | 120 | 50 | ~$176 |
| M6 | 2,000 | 300 | 160 | ~$563 |
| M9 | 4,000 | 600 | 380 | ~$1,338 |
| M12 | 7,000 | 1,050 | 700 | ~$2,464 |

**M12 ARR (baseline):** ~$29,600

---

## 4. PH Year 1 — Viral Scenario

One well-timed Tagalog TikTok or r/PHCreditCards post generates a spike around Month 3.

| Month | MAU | Paid Users | MRR (USD net) |
|-------|-----|-----------|--------------|
| M3 spike | 3,500 | 350 | ~$1,232 |
| M6 | 8,000 | 1,000 | ~$3,520 |
| M12 | 18,000 | 2,500 | ~$8,800 |

**M12 ARR (viral):** ~$105,600

---

## 5. Lifetime Plan Impact

Lifetime buyers are one-time revenue but they:
- Never churn (no monthly pressure)
- Act as brand advocates (high satisfaction = reviews + referrals)
- Boost early MRR spikes on launch

**Estimate: 10% of paid users choose lifetime**

At 700 paid users (baseline M12):
- 70 lifetime buyers × $84.99 net = ~$5,949 in one-time revenue
- Spread over 12 months = ~$496/mo equivalent

**Not included in MRR above — treat as bonus cash.**

---

## 6. US Year 2 (Month 13–24)

US ARPU is 32% higher than PH ($4.66 vs $3.52 blended net). Launched iOS + Android simultaneously.

| Month | MAU | Paid Users | MRR (USD net) |
|-------|-----|-----------|--------------|
| US M1 | 500 | 50 | ~$233 |
| US M3 | 2,000 | 250 | ~$1,165 |
| US M6 | 6,000 | 900 | ~$4,194 |
| US M9 | 12,000 | 2,000 | ~$9,320 |
| US M12 | 20,000 | 4,000 | ~$18,640 |

**US M12 ARR:** ~$223,680

---

## 7. Combined Revenue (PH + US)

| Timeline | PH MRR | US MRR | Total MRR | ARR |
|----------|--------|--------|-----------|-----|
| PH M12 / US M0 | $2,464 | $0 | $2,464 | $29,568 |
| PH M18 / US M6 | $3,500 | $4,194 | $7,694 | $92,328 |
| PH M24 / US M12 | $5,000 | $18,640 | $23,640 | $283,680 |

**$10K MRR milestone:** Estimated ~Month 20–22 (PH M20 + US M8)

---

## 8. $10K MRR — What It Takes

| Market | Paying users needed | At blended ARPU |
|--------|--------------------|-|
| PH only | ~2,840 | $3.52 net/mo |
| US only | ~2,146 | $4.66 net/mo |
| Mixed (50/50) | ~2,400 total | ~$4.17 blended |

**Path to $10K MRR (~Month 21):**
- ~1,200 PH paying users (organic by then, realistic)
- ~1,200 US paying users (6 months of US growth)
- Combined: $4,224 PH + $5,592 US = **~$9,816 net MRR** ✅

**Probability: ~30–40%** — achievable with active marketing. Product quality is there. Distribution is the variable.

---

## 9. Unit Economics

### Per Pro User (recurring)

| Market | Gross/mo | Store cut (15%) | RevenueCat (1%)* | Infra | **Net margin** |
|--------|---------|-----------------|-----------------|-------|---------------|
| PH monthly | $4.99 | −$0.75 | −$0.04 | −$0.03 | **$4.17 (84%)** |
| PH annual | $4.00/mo | −$0.60 | −$0.03 | −$0.03 | **$3.34 (84%)** |
| US monthly | $6.99 | −$1.05 | −$0.06 | −$0.03 | **$5.85 (84%)** |
| US annual | $4.67/mo | −$0.70 | −$0.04 | −$0.03 | **$3.90 (84%)** |

*RevenueCat 1% fee kicks in above $2.5K MRR. Below that: free.*

### Break-even

| Cost | Amount |
|------|--------|
| Apple Developer | $99/yr |
| Google Play | $25 one-time |
| Domain + Vercel | $120/yr |
| **Total fixed Year 1** | **~$245/yr (~$20/mo)** |

**Break-even: 5 paying PH users.** Everything beyond that is profit.

---

## 10. Cost Structure at Scale

| MRR Milestone | RevenueCat | Supabase | Infra total | % of MRR |
|--------------|------------|---------|-------------|---------|
| $2,500 | $0 (free) | $0 (free) | ~$20 | <1% |
| $5,000 | $50 | $25 | ~$95 | 2% |
| $10,000 | $100 | $25 | ~$145 | 1.5% |
| $25,000 | $250 | $100 | ~$370 | 1.5% |

AI features (Phase 2, Gemini Flash): ~$0.044/user/month. At 2,000 users = $88/mo. Never exceeds 2% of revenue in Year 1–2 range.

---

## 11. Key Milestones

| Milestone | Target | Signal |
|-----------|--------|--------|
| First paying user | Week 2–3 | Product works |
| 100 paid users | Month 2–3 | r/PHCreditCards launch |
| $1K MRR | Month 5–7 | Word of mouth + ASO working |
| $2.5K MRR | Month 9–12 | RevenueCat paid tier (good problem) |
| $5K MRR | Month 14–18 | US launched, turn on paid ads |
| $10K MRR | Month 20–22 | Independence territory |

---

*Sources: RevenueCat SOSA 2025, App Store Small Business Program, internal modeling, BSP credit card data, Statista US credit card holder data.*
