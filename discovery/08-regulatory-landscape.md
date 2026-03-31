# Falcly — Regulatory Landscape

> **Date:** 2026-03-30
> **For:** Falcly discovery

---

## Executive Summary

Falcly's regulatory burden is light for MVP. It is NOT a financial institution — it doesn't hold funds, lend money, or process transactions. It's a productivity/intelligence app that helps users understand their credit card billing cycles. Key requirements: Philippine Data Privacy Act compliance (NPC registration), COPPA awareness (if children could create accounts), and standard app store policies. BSP licensing is not required.

---

## 1. Philippines Regulations

### BSP (Bangko Sentral ng Pilipinas)

**Does Falcly need BSP licensing?** No.

Falcly does NOT:
- Hold customer funds
- Process payments or money transfers
- Lend money or extend credit
- Access bank accounts via API (MVP uses manual entry)
- Act as a payment intermediary

Falcly IS a productivity/intelligence app — like a calculator for billing cycles. **No BSP license required for MVP.**

**If future features include Open Banking API access:** BSP is developing an Open Finance Framework. If Falcly connects to bank APIs for automated statement data, it may need to register as an accredited third party. Monitor BSP Open Finance guidelines.

### Data Privacy Act (RA 10173)

| Requirement | Status | Action |
|-------------|--------|--------|
| **NPC Registration** | Required | Register as Personal Information Controller (PIC) with NPC |
| **Privacy Policy** | Required | Publish in English and Filipino |
| **Consent** | Required | Explicit consent before collecting personal financial data |
| **Breach Notification** | Required | 72 hours to notify NPC AND affected users |
| **Data Minimization** | Required | Collect only what's needed for core functionality |
| **Penalties** | Up to ₱5M fine + 3–6 years imprisonment | Ensure compliance from day 1 |

**SMS Parsing (future feature):** If Falcly reads SMS for statement data, explicit consent disclosure is required. Users must opt-in and understand what data is being read. This is a higher compliance bar than manual entry.

### BSP 2026 Initiatives

- **Stricter payment data compliance** — tougher penalties for operators failing reporting standards
- **Server-side biometric authentication** — proposed for high-risk transactions (not directly applicable to Falcly)
- **Transparency framework** — compliance assessment results available 2026

**Impact on Falcly:** Minimal. These target BSP-supervised entities. Falcly should monitor but is not directly affected.

### Philippine Credit Card Industry Regulation Act

- Regulates credit card industry practices
- Applies to card issuers, not third-party tools
- **Impact on Falcly:** None directly. Useful for understanding cardholder protections.

---

## 2. United States Regulations

### Financial Regulations

**Is Falcly a financial product?** No — same reasoning as Philippines. No funds, no lending, no transactions.

- **SEC:** Not applicable (no securities or investment features)
- **CFPB:** Not applicable for MVP (no consumer financial product). If Falcly adds bank API connections via Plaid/MX, CFPB consumer data rights rules may apply.
- **State money transmitter licenses:** Not required (no money movement)

### COPPA (Children's Online Privacy Protection Act)

**Compliance deadline: April 22, 2026** (modernized rules)

| Consideration | Assessment |
|---------------|-----------|
| Does Falcly collect data from children? | No — credit card users must be 18+ |
| Could children create accounts? | Implement age verification to prevent this |
| Is the app "directed to children"? | No — it's a financial management tool |
| Action needed | Add age gate at signup, ensure privacy policy addresses COPPA |

**Risk is low** but worth addressing: add a simple age verification (date of birth or checkbox) at account creation.

### CCPA/CPRA (California)

| Requirement | Action |
|-------------|--------|
| Right to know | Data transparency mechanism |
| Right to delete | Account deletion functionality |
| Right to opt-out of sale | Ensure no data "sale" to third parties |
| Sensitive personal information | Financial data qualifies — handle with care |
| Privacy policy | Include CCPA-specific disclosures |

### State-Level Data Privacy Laws

Multiple US states have passed consumer privacy laws (Virginia VCDPA, Colorado CPA, Connecticut CTDPA, etc.). General approach: follow CCPA as baseline, which satisfies most state requirements.

---

## 3. EU/UK Regulations (Future Markets)

### GDPR

| Requirement | Impact |
|-------------|--------|
| Lawful basis | Consent for data processing |
| Right to erasure | Must support account/data deletion |
| Data portability | Must support data export |
| Data minimization | Collect only necessary data |
| Breach notification | 72 hours to supervisory authority |
| DPO | May need Data Protection Officer at scale |

### PSD2 / Open Banking (UK/EU)

If Falcly connects to bank APIs in EU/UK markets, PSD2 regulations apply. This would require registration as an Account Information Service Provider (AISP). **Not relevant for MVP but important for expansion.**

---

## 4. App Store Compliance

### Google Play (Primary — PH market)

| Requirement | Action |
|-------------|--------|
| Data Safety Section | Complete data collection/sharing declarations |
| Financial features policy | Review if financial app category triggers additional review |
| Target audience | Declare as adult-only (18+) |
| Privacy policy | Required link in store listing |
| Permissions | Justify any SMS/notification access |

### Apple App Store

| Requirement | Action |
|-------------|--------|
| App Tracking Transparency | Implement ATT prompt if using third-party analytics |
| Privacy Nutrition Labels | Declare all data collection |
| In-app purchase | 30% Apple commission (15% for Small Business Program if <$1M/yr) |
| Financial category review | May face additional App Review scrutiny |

---

## 5. Data Security Requirements

Regardless of regulation, Falcly handles sensitive financial information (card numbers, balances, statement dates). Minimum security posture:

| Measure | Priority |
|---------|----------|
| Encryption at rest | P0 |
| Encryption in transit (TLS) | P0 |
| No card numbers stored server-side (MVP) | P0 |
| Authentication (email + password, biometric) | P0 |
| Rate limiting / brute force protection | P0 |
| Secure key management | P1 |
| Regular security audits | P2 |
| SOC 2 compliance (if B2B expansion) | P3 |

---

## 6. Compliance Roadmap

| Priority | Regulation | Deadline | Action |
|----------|-----------|----------|--------|
| **P0** | Philippine DPA | Before PH launch | NPC registration, privacy policy, consent flows |
| **P0** | App store compliance | Before launch | Data safety declarations, privacy labels |
| **P0** | Data security | Before launch | Encryption, auth, no server-side card storage |
| **P1** | COPPA | April 22, 2026 | Age verification, privacy policy update |
| **P1** | CCPA | Before US marketing | Privacy policy, opt-out mechanisms |
| **P2** | GDPR | Before EU expansion | Full GDPR compliance review |
| **P3** | PSD2/Open Banking | If adding bank API connections | AISP registration |

---

## 7. Key Takeaway

**Falcly's regulatory path is clear and manageable for MVP.** No BSP license needed. NPC registration is the primary requirement for PH launch. US regulations are standard for a non-financial consumer app. The biggest compliance risk is SMS parsing — if implemented, it requires explicit consent and careful data handling.

---

*Sources: BSP Circular M-2024-036, Philippine Data Privacy Act (RA 10173), NPC Circulars, Philippine Credit Card Industry Regulation Act, FTC COPPA amendments (April 2025), CCPA/CPRA text, GDPR text, PSD2, Google Play Developer Policies, Apple Developer Guidelines, ICLG Fintech Philippines 2025-2026, Securiti.ai PH data regulations.*
