# Falcly Accessibility Audit
Date: 2026-04-04

## Fixes Applied

### Atoms
- **Button** — added `accessibilityRole="button"`, `accessibilityLabel`, `accessibilityState={{ disabled }}`
- **CreditCardFace** — staleness warning icon: added label, role, 44x44 touch target; status dot: added `accessibilityLabel` with card status text
- **EmptyCardFace** — added `accessibilityRole="button"`, `accessibilityLabel`, `accessibilityHint`
- **UtilizationBar** — added `accessibilityRole="progressbar"`, `accessibilityLabel`, `accessibilityValue` with percentage
- **PageDots** — wrapped in accessible View with page count label

### Molecules
- **BankPicker** — field trigger: added label/role/hint; Modal: added `accessibilityViewIsModal`; cancel button, search input, custom input, list rows: all labeled with roles and selected state
- **BestCardBanner** — status dot: added label; ADD/MANAGE buttons: added role and label
- **ChipSelector** — each chip: added `accessibilityRole`, `accessibilityLabel`, `accessibilityState={{ selected }}`
- **StatusTooltip** — Pressable: added role, label, hint
- **FinanceCard** — toggle: added role, label, expanded state; dismiss hint: added role/label; all 5 FormInputs: added `accessibilityLabel`
- **StackedCardsPreview** — each mini card: added accessible label with bank name and status
- **AlertBanner** — added `accessibilityRole="alert"` and `accessibilityLabel`
- **ImpactSkeleton** — added accessible label "Loading impact summary"

### Organisms
- **AllCardsOverview** — avatar button: added role/label; tier badge: added role/label; sort chips: added role, label, selected state
- **CardPager** — overview button: added role/label; manage link: added role/label
- **GanttTimeline** — card row Pressables: added role and label with bank name, status, days to statement
- **SwipeImpactPanel** — edit/update/delete buttons: added role/label; gantt toggle: added role, label, expanded state; projection toggle: added role, label, expanded state; nav buttons: added role/label; try card button/picker modal/rows: added role/label; funds prompt: added role/label; trial CTA: added role/label; swipe amount input: added label
- **BillingTimeline** — container: added accessible label summarizing cycle position

### Screens
- **add-card** — Cancel/Save header buttons: added role/label
- **edit-card** — Manage installments/subscriptions buttons: added role/label
- **manage-cards** — card rows, visibility toggle (with selected state), trash icon, Add Card button: all labeled
- **manage-installments** — Remove buttons: added role and dynamic label with installment name
- **manage-subscriptions** — Remove buttons: added role and dynamic label with subscription name
- **settings** — theme option buttons: added role, label, selected state; payoff strategy chips: added role, label, selected state; Terms/Privacy/Feedback links: added role/label
- **sign-in** — email/password inputs: added labels; forgot password and toggle mode links: added role/label
- **card-transactions** — Back/Log header buttons: added role/label; transaction rows: added role, dynamic label, hint
- **log-transaction** — date/card/type chip selectors: added role, label, selected state; Modal: added `accessibilityViewIsModal`; overlay/content pressables: labeled; amount/merchant inputs: added labels
- **status-guide** — Close (X) button: added role/label
- **welcome** — logo Image: added accessible label
- **update-balance** — balance input: added label
- **pro-paywall** — trial button and all plan buttons: added role and descriptive labels with plan/price
- **add-installment** — card picker chips: added role, label, selected state
- **add-subscription-item** — card/frequency chips: added role, label, selected state

## Known Issues (requires device testing)

### Color contrast
- **BillingTimeline** — statement close urgency colors (safe/caution/risky) against track background — verify contrast in both light and dark themes
- **settings** — `t.accentText` PRO status text on surface background — verify WCAG AA 4.5:1 ratio
- **status-guide** — safe/caution/accent badge colors on their backgrounds — verify contrast
- **FutureTimeline** — badge text (white) on safe/caution/risky backgrounds — verify contrast especially for caution (amber on white inverse)

### Screen reader navigation
- **CardPager** — horizontal FlatList paging: VoiceOver/TalkBack may not clearly announce page transitions. Verify swipe gestures work with screen readers
- **GanttTimeline** — complex visual timeline with positioned elements: verify reading order makes sense
- **BillingTimeline** — positioned labels (Start/Statement/Due) use absolute positioning which may affect reading order
- **BankPicker** — modal focus trapping: verify screen reader stays within the modal when open

### Dynamic content announcements
- **SwipeImpactPanel** — when status changes (SAFE → RISKY) based on swipe amount, the change is not announced via `accessibilityLiveRegion`. Verify VoiceOver users are notified
- **FinanceCard** — AlertBanner for staleness appearing/disappearing is marked as alert role but `accessibilityLiveRegion` is not set on the container
- **CreditCardFace** — status dot color/label changes are not announced when underlying data changes

### Touch targets
- **StatusTooltip** — uses `hitSlop={8}` on a ~18px icon. Total target may be ~34px — borderline. Test with finger on device
- **manage-cards** — drag handle (`FontAwesome "bars"`) has no accessibility hint for reorder. DnD is not implemented yet but may need future work

### Currency symbol
- **FutureTimeline/SwipeImpactPanel** — Philippine Peso symbol (₱) may be read as "P" or skipped by some screen readers. Verify VoiceOver/TalkBack pronunciation

## Passed / No Issues
- **Typography** — purely presentational text components, no interaction
- **Badge** — non-interactive display component
- **OfflineChip** — passive indicator with text "Offline", readable by screen readers
- **Themed** — wrapper components with no semantic issues
- **BreakdownRow** — display-only component with label and value text
- **SectionCard** — container component, no interaction
- **SurfaceCard** — container component, no interaction
- **EmptyState** — display-only with icon and text
- **FormFieldGroup** — label association works via React Native default behavior
- **DayInput / MoneyInput / PercentInput** — wrap FormFieldGroup which handles labels
- **onboarding / onboarding-result** — use Button component which now has proper a11y
- **payment-summary** — uses Button and display components, no bare Pressables
- **swipe-impact** — thin wrapper around SwipeImpactPanel (fixed above)
- **component-showcase** — dev-only screen, not user-facing
- **+not-found** — uses Link with text, accessible by default
- **_layout / (tabs)/_layout** — navigation layout, handled by Expo Router
