import { useMemo, useState } from 'react';
import { StyleSheet, ScrollView, Pressable, View as RNView } from 'react-native';
import { Text } from '@/components/Themed';
import { Stack, router } from 'expo-router';
import { X } from 'lucide-react-native';
import { useAppTheme } from '@/theme';
import type { SemanticTokens } from '@/theme';
import { fonts, typeScale } from '@/theme/fonts';
import { useCardStore } from '@/store/cardStore';
import { useUserStore } from '@/store/userStore';
import { SurfaceCard } from '@/components/molecules';
import {
  analyzeSpread,
  getOptimalSwipeDays,
  type SpreadIssue,
  type SpreadTip,
  type GapInfo,
} from '@/utils/statementAdvisor';
import { WIKI_CARDS, type WikiCard } from '@/constants/wikiCards';

// ─── Helpers ────────────────────────────────────────────────────────────────

function ordinal(day: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = day % 100;
  return day + (s[(v - 20) % 10] || s[v] || s[0]);
}

function scoreColor(score: number, t: SemanticTokens) {
  if (score >= 80) return t.safe;
  if (score >= 50) return t.caution;
  return t.risky;
}

function scoreBg(score: number, t: SemanticTokens) {
  if (score >= 80) return t.safeBg;
  if (score >= 50) return t.cautionBg;
  return t.riskyBg;
}

function scoreSummary(score: number, issueCount: number): string {
  if (issueCount === 0 && score >= 80) return 'Your spread is well optimized';
  if (score >= 80) return 'Minor improvements possible';
  if (score >= 50) return 'Room for improvement';
  return 'Your cards need better spacing';
}

function severityColor(severity: SpreadIssue['severity'], t: SemanticTokens) {
  if (severity === 'high') return t.risky;
  if (severity === 'medium') return t.caution;
  return t.textMuted;
}

function issueIcon(type: SpreadIssue['type']): string {
  switch (type) {
    case 'CLUSTERED': return '\u26A0';
    case 'DEAD_ZONE': return '\u2205';
    case 'PAYDAY_MISALIGNED': return '\u23F0';
    case 'SINGLE_CARD': return '\u2139';
  }
}

function tipIcon(type: SpreadTip['type']): string {
  switch (type) {
    case 'TIMING_TIP': return '\u23F1';
    case 'NEW_CARD_TARGET': return '\u2795';
    case 'PAYDAY_TIP': return '\u{1F4B0}';
    case 'CLUSTER_WORKAROUND': return '\u{1F504}';
    case 'GRACE_EXPLAINER': return '\u{1F4D6}';
  }
}

// ─── SD-02: SpreadScoreRing ─────────────────────────────────────────────────

function SpreadScoreRing({ score, issueCount }: { score: number; issueCount: number }) {
  const t = useAppTheme();
  const color = scoreColor(score, t);
  const bg = scoreBg(score, t);

  return (
    <SurfaceCard>
      <RNView style={styles.scoreContainer}>
        <RNView style={[styles.scoreRing, { borderColor: color, backgroundColor: bg }]}>
          <Text style={[styles.scoreNumber, { color }]}>{score}</Text>
          <Text style={[styles.scoreLabel, { color: t.textMuted }]}>Spread Score</Text>
        </RNView>
        <Text style={[styles.scoreSummary, { color: t.textSecondary }]}>
          {scoreSummary(score, issueCount)}
        </Text>
      </RNView>
    </SurfaceCard>
  );
}

// ─── SD-02: MonthTimeline ───────────────────────────────────────────────────

function MonthTimeline({ cards, gaps }: { cards: { bankName: string; statementDay: number }[]; gaps: GapInfo[] }) {
  const t = useAppTheme();
  const TOTAL_DAYS = 30;

  const bankColors = useMemo(() => {
    const colors = [t.safe, t.caution, t.primary, t.accent, t.risky];
    const map: Record<string, string> = {};
    cards.forEach((c, i) => {
      map[c.bankName] = colors[i % colors.length];
    });
    return map;
  }, [cards, t]);

  return (
    <SurfaceCard>
      <Text style={[styles.sectionTitle, { color: t.textPrimary }]}>30-Day Timeline</Text>
      <RNView style={styles.timelineContainer}>
        {/* Day markers */}
        <RNView style={[styles.timelineBar, { backgroundColor: t.border }]}>
          {/* Dead zone shading */}
          {gaps.filter((g) => g.isDeadZone).map((gap, i) => {
            const left = ((gap.startDay - 1) / TOTAL_DAYS) * 100;
            const width = (gap.length / TOTAL_DAYS) * 100;
            // Handle wrap-around
            if (gap.startDay < gap.endDay) {
              return (
                <RNView
                  key={i}
                  style={[styles.deadZoneShade, { left: `${left}%`, width: `${width}%`, backgroundColor: t.riskyBg }]}
                />
              );
            }
            // Wrap: shade from startDay to end + beginning to endDay
            return (
              <RNView key={i}>
                <RNView
                  style={[styles.deadZoneShade, { left: `${left}%`, width: `${((TOTAL_DAYS - gap.startDay + 1) / TOTAL_DAYS) * 100}%`, backgroundColor: t.riskyBg }]}
                />
                <RNView
                  style={[styles.deadZoneShade, { left: '0%', width: `${((gap.endDay - 1) / TOTAL_DAYS) * 100}%`, backgroundColor: t.riskyBg }]}
                />
              </RNView>
            );
          })}

          {/* Card dots */}
          {cards.map((card, i) => {
            const norm = ((card.statementDay > 30 ? 30 : card.statementDay) - 1) / TOTAL_DAYS;
            const color = bankColors[card.bankName];
            return (
              <RNView
                key={i}
                style={[
                  styles.cardDot,
                  { left: `${norm * 100}%`, backgroundColor: color, borderColor: t.surface },
                ]}
              >
                <Text style={[styles.cardDotText, { color: t.surface }]}>
                  {card.bankName.charAt(0)}
                </Text>
              </RNView>
            );
          })}
        </RNView>

        {/* Day labels */}
        <RNView style={styles.dayLabels}>
          <Text style={[styles.dayLabel, { color: t.textMuted }]}>1</Text>
          <Text style={[styles.dayLabel, { color: t.textMuted }]}>10</Text>
          <Text style={[styles.dayLabel, { color: t.textMuted }]}>20</Text>
          <Text style={[styles.dayLabel, { color: t.textMuted }]}>30</Text>
        </RNView>
      </RNView>

      {/* Legend */}
      <RNView style={styles.legend}>
        {cards.map((card, i) => (
          <RNView key={i} style={styles.legendItem}>
            <RNView style={[styles.legendDot, { backgroundColor: bankColors[card.bankName] }]} />
            <Text style={[styles.legendText, { color: t.textSecondary }]}>
              {card.bankName} ({ordinal(card.statementDay)})
            </Text>
          </RNView>
        ))}
      </RNView>
    </SurfaceCard>
  );
}

// ─── SD-03: IssueCard ───────────────────────────────────────────────────────

function IssueCard({ issue }: { issue: SpreadIssue }) {
  const t = useAppTheme();
  const color = severityColor(issue.severity, t);

  return (
    <RNView style={[styles.issueCard, { borderLeftColor: color }]}>
      <RNView style={styles.issueHeader}>
        <Text style={styles.issueIcon}>{issueIcon(issue.type)}</Text>
        <Text style={[styles.issueMessage, { color: t.textPrimary }]}>{issue.message}</Text>
      </RNView>
    </RNView>
  );
}

// ─── SD-03: TipCard ─────────────────────────────────────────────────────────

function TipCard({ tip }: { tip: SpreadTip }) {
  const t = useAppTheme();

  return (
    <RNView style={[styles.tipCard, { backgroundColor: t.accentBg }]}>
      <Text style={styles.tipIcon}>{tipIcon(tip.type)}</Text>
      <Text style={[styles.tipMessage, { color: t.textPrimary }]}>{tip.message}</Text>
    </RNView>
  );
}

// ─── SD-04: TimingRow ───────────────────────────────────────────────────────

function TimingRow({ bankName, statementDay }: { bankName: string; statementDay: number }) {
  const t = useAppTheme();
  const window = getOptimalSwipeDays(statementDay);
  const avoidStart = ((statementDay > 30 ? 30 : statementDay) - 2 + 30) % 30 || 30;
  const avoidEnd = statementDay > 30 ? 30 : statementDay;

  return (
    <RNView style={styles.timingRow}>
      <RNView style={styles.timingLeft}>
        <Text style={[styles.timingBank, { color: t.textPrimary }]}>{bankName}</Text>
        <Text style={[styles.timingDay, { color: t.textMuted }]}>Statement: {ordinal(statementDay)}</Text>
      </RNView>
      <RNView style={styles.timingRight}>
        <Text style={[styles.timingBest, { color: t.safe }]}>Best: {ordinal(window.start)}\u2013{ordinal(window.end)}</Text>
        <Text style={[styles.timingAvoid, { color: t.risky }]}>Avoid: {ordinal(avoidStart)}\u2013{ordinal(avoidEnd)}</Text>
      </RNView>
    </RNView>
  );
}

// ─── SD-04: BankReferenceTable ──────────────────────────────────────────────

const BANK_REFERENCES = [
  { bank: 'BDO', changeable: false, notes: 'Fixed at issuance' },
  { bank: 'BPI', changeable: false, notes: 'Fixed at issuance' },
  { bank: 'Metrobank', changeable: false, notes: 'Fixed at issuance' },
  { bank: 'RCBC', changeable: false, notes: 'Not allowed' },
  { bank: 'Security Bank', changeable: null, notes: 'May accommodate via hotline' },
  { bank: 'UnionBank', changeable: null, notes: 'Digital-first, may be flexible' },
  { bank: 'EastWest', changeable: null, notes: 'Call hotline' },
  { bank: 'Citibank', changeable: null, notes: 'Call hotline' },
  { bank: 'Maya', changeable: true, notes: 'Digital-first, likely flexible' },
  { bank: 'GCash', changeable: true, notes: 'Digital-first' },
];

function BankReferenceTable() {
  const t = useAppTheme();

  return (
    <RNView>
      {BANK_REFERENCES.map((ref, i) => (
        <RNView key={ref.bank}>
          <RNView style={styles.bankRow}>
            <Text style={[styles.bankStatus, { color: ref.changeable === false ? t.risky : ref.changeable === true ? t.safe : t.caution }]}>
              {ref.changeable === false ? '\u2718' : ref.changeable === true ? '\u2714' : '\u26A0'}
            </Text>
            <RNView style={styles.bankInfo}>
              <Text style={[styles.bankName, { color: t.textPrimary }]}>{ref.bank}</Text>
              <Text style={[styles.bankNotes, { color: t.textMuted }]}>{ref.notes}</Text>
            </RNView>
          </RNView>
          {i < BANK_REFERENCES.length - 1 && (
            <RNView style={[styles.bankDivider, { backgroundColor: t.border }]} />
          )}
        </RNView>
      ))}
    </RNView>
  );
}

// ─── SD-04: WikiCardItem ────────────────────────────────────────────────────

function WikiCardItem({ card }: { card: WikiCard }) {
  const t = useAppTheme();
  const [expanded, setExpanded] = useState(false);

  return (
    <Pressable onPress={() => setExpanded(!expanded)} accessibilityRole="button">
      <RNView style={[styles.wikiCard, { backgroundColor: t.surface, borderColor: t.border }]}>
        <RNView style={styles.wikiHeader}>
          <Text style={[styles.wikiId, { color: t.textMuted }]}>{card.id}</Text>
          <Text style={[styles.wikiTitle, { color: t.textPrimary }]} numberOfLines={expanded ? undefined : 1}>{card.title}</Text>
          <Text style={[styles.wikiChevron, { color: t.textMuted }]}>{expanded ? '\u25B2' : '\u25BC'}</Text>
        </RNView>
        {expanded && (
          <RNView style={styles.wikiBody}>
            <Text style={[styles.wikiText, { color: t.textSecondary }]}>{card.body}</Text>
            <RNView style={[styles.wikiExampleBox, { backgroundColor: t.accentBg }]}>
              <Text style={[styles.wikiExampleLabel, { color: t.accent }]}>Example</Text>
              <Text style={[styles.wikiExampleText, { color: t.textSecondary }]}>{card.example}</Text>
            </RNView>
          </RNView>
        )}
      </RNView>
    </Pressable>
  );
}

// ─── Main Screen ────────────────────────────────────────────────────────────

export default function StatementAdvisorScreen() {
  const t = useAppTheme();
  const cards = useCardStore((s) => s.cards).filter((c) => c.isActive);
  const payday = useUserStore((s) => s.payday);
  const payday2 = useUserStore((s) => s.payday2);

  const analysis = useMemo(
    () => analyzeSpread(cards, payday ?? undefined, payday2 ?? undefined),
    [cards, payday, payday2],
  );

  const [bankRefExpanded, setBankRefExpanded] = useState(false);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: t.background }]}
      contentContainerStyle={styles.content}
    >
      <Stack.Screen
        options={{
          title: 'Statement Advisor',
          headerBackVisible: false,
          headerLeft: () => (
            <Pressable
              onPress={() => router.back()}
              hitSlop={8}
              style={styles.closeButton}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <X size={20} color={t.textMuted} />
            </Pressable>
          ),
        }}
      />

      {/* ── SD-02: Spread Score ── */}
      <SpreadScoreRing score={analysis.score} issueCount={analysis.issues.length} />

      {/* ── SD-02: 30-day Timeline ── */}
      {cards.length >= 2 && (
        <MonthTimeline
          cards={cards.map((c) => ({ bankName: c.bankName, statementDay: c.statementDay }))}
          gaps={analysis.gaps}
        />
      )}

      {/* ── SD-03: Issues ── */}
      {analysis.issues.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: t.textPrimary }]}>Issues Detected</Text>
          {analysis.issues.map((issue, i) => (
            <IssueCard key={i} issue={issue} />
          ))}
        </>
      )}

      {/* ── SD-03: Recommendations ── */}
      {analysis.tips.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: t.textPrimary }]}>Tips</Text>
          {analysis.tips.map((tip, i) => (
            <TipCard key={i} tip={tip} />
          ))}
        </>
      )}

      {/* ── SD-04: Timing Guide ── */}
      {cards.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: t.textPrimary }]}>Best Time to Swipe</Text>
          <SurfaceCard>
            {cards.map((card, i) => (
              <RNView key={card.id}>
                <TimingRow bankName={card.bankName} statementDay={card.statementDay} />
                {i < cards.length - 1 && (
                  <RNView style={[styles.timingDivider, { backgroundColor: t.border }]} />
                )}
              </RNView>
            ))}
          </SurfaceCard>
        </>
      )}

      {/* ── SD-04: Bank Reference ── */}
      <Pressable
        onPress={() => setBankRefExpanded(!bankRefExpanded)}
        accessibilityRole="button"
        accessibilityLabel="Toggle bank reference"
      >
        <RNView style={[styles.collapsibleHeader, { borderColor: t.border }]}>
          <Text style={[styles.sectionTitle, { color: t.textPrimary, marginBottom: 0 }]}>
            Can I Change My Statement Date?
          </Text>
          <Text style={[styles.wikiChevron, { color: t.textMuted }]}>{bankRefExpanded ? '\u25B2' : '\u25BC'}</Text>
        </RNView>
      </Pressable>
      {bankRefExpanded && (
        <SurfaceCard>
          <BankReferenceTable />
        </SurfaceCard>
      )}

      {/* ── SD-04: Credit Card 101 ── */}
      <Text style={[styles.sectionTitle, { color: t.textPrimary }]}>Credit Card 101</Text>
      {WIKI_CARDS.map((card) => (
        <WikiCardItem key={card.id} card={card} />
      ))}

      <RNView style={{ height: 40 }} />
    </ScrollView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingTop: 16,
  },
  closeButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 32,
    height: 32,
    paddingLeft: 4,
  },

  // Score Ring
  scoreContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  scoreRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  scoreNumber: {
    fontSize: typeScale.display,
    fontFamily: fonts.interBold,
    lineHeight: 42,
  },
  scoreLabel: {
    fontSize: typeScale.caption,
    fontFamily: fonts.interSemiBold,
    marginTop: -2,
  },
  scoreSummary: {
    fontSize: typeScale.subhead,
    fontFamily: fonts.interRegular,
    textAlign: 'center',
  },

  // Section Title
  sectionTitle: {
    fontSize: typeScale.callout,
    fontFamily: fonts.interSemiBold,
    marginBottom: 8,
    marginTop: 12,
  },

  // Timeline
  timelineContainer: {
    marginTop: 8,
    marginBottom: 12,
  },
  timelineBar: {
    height: 32,
    borderRadius: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  deadZoneShade: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    opacity: 0.6,
  },
  cardDot: {
    position: 'absolute',
    top: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -12,
  },
  cardDotText: {
    fontSize: typeScale.micro,
    fontFamily: fonts.interBold,
  },
  dayLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingHorizontal: 2,
  },
  dayLabel: {
    fontSize: typeScale.micro,
    fontFamily: fonts.interRegular,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: typeScale.caption,
    fontFamily: fonts.interRegular,
  },

  // Issues
  issueCard: {
    borderLeftWidth: 3,
    paddingLeft: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  issueHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  issueIcon: {
    fontSize: typeScale.headline,
    lineHeight: 20,
  },
  issueMessage: {
    flex: 1,
    fontSize: typeScale.subhead,
    fontFamily: fonts.interRegular,
    lineHeight: 18,
  },

  // Tips
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  tipIcon: {
    fontSize: typeScale.headline,
    lineHeight: 20,
  },
  tipMessage: {
    flex: 1,
    fontSize: typeScale.subhead,
    fontFamily: fonts.interRegular,
    lineHeight: 18,
  },

  // Timing
  timingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  timingLeft: {
    flex: 1,
  },
  timingRight: {
    alignItems: 'flex-end',
  },
  timingBank: {
    fontSize: typeScale.body,
    fontFamily: fonts.interSemiBold,
  },
  timingDay: {
    fontSize: typeScale.caption,
    fontFamily: fonts.interRegular,
  },
  timingBest: {
    fontSize: typeScale.footnote,
    fontFamily: fonts.interSemiBold,
  },
  timingAvoid: {
    fontSize: typeScale.caption,
    fontFamily: fonts.interRegular,
  },
  timingDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 8,
  },

  // Collapsible
  collapsibleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: 4,
  },

  // Bank Reference
  bankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  bankStatus: {
    fontSize: typeScale.headline,
    width: 24,
    textAlign: 'center',
  },
  bankInfo: {
    flex: 1,
  },
  bankName: {
    fontSize: typeScale.subhead,
    fontFamily: fonts.interSemiBold,
  },
  bankNotes: {
    fontSize: typeScale.caption,
    fontFamily: fonts.interRegular,
  },
  bankDivider: {
    height: StyleSheet.hairlineWidth,
  },

  // Wiki
  wikiCard: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
  wikiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  wikiId: {
    fontSize: typeScale.micro,
    fontFamily: fonts.interSemiBold,
    width: 32,
  },
  wikiTitle: {
    flex: 1,
    fontSize: typeScale.subhead,
    fontFamily: fonts.interSemiBold,
  },
  wikiChevron: {
    fontSize: typeScale.micro,
    width: 16,
    textAlign: 'center',
  },
  wikiBody: {
    marginTop: 8,
    paddingLeft: 40,
  },
  wikiText: {
    fontSize: typeScale.subhead,
    fontFamily: fonts.interRegular,
    lineHeight: 18,
    marginBottom: 8,
  },
  wikiExampleBox: {
    padding: 10,
    borderRadius: 8,
  },
  wikiExampleLabel: {
    fontSize: typeScale.micro,
    fontFamily: fonts.interSemiBold,
    marginBottom: 2,
  },
  wikiExampleText: {
    fontSize: typeScale.footnote,
    fontFamily: fonts.interRegular,
    lineHeight: 17,
  },
});
