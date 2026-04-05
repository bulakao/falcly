export interface WikiCard {
  id: string;
  title: string;
  body: string;
  example: string;
}

export const WIKI_CARDS: WikiCard[] = [
  {
    id: 'W-01',
    title: 'What is a statement date?',
    body: 'The day your billing cycle closes. All purchases before this date appear on your bill. After this date, a new cycle starts.',
    example: 'Your BDO statement closes on the 15th \u2014 purchases on the 14th go on this month\u2019s bill.',
  },
  {
    id: 'W-02',
    title: 'What is a due date?',
    body: 'The deadline to pay your bill without late fees. Usually 20\u201325 days after your statement date.',
    example: 'Statement closes the 15th \u2192 bill due the 5th of next month.',
  },
  {
    id: 'W-03',
    title: 'What is a grace period?',
    body: 'The interest-free window between your statement close and due date. Most banks give 21–25 days. Pay in full = zero interest.',
    example: 'Close on the 15th, due on the 5th (20 days) = free. Miss it = interest from day 1.',
  },
  {
    id: 'W-04',
    title: 'Maximize your interest-free days',
    body: 'Swipe right after your statement closes to get the most interest-free time. Swipe just before it closes = shortest window.',
    example: 'Swipe on the 16th (day after close) \u2192 ~50 days free. Swipe on the 14th \u2192 ~21 days.',
  },
  {
    id: 'W-05',
    title: 'Why card spread matters',
    body: 'With multiple cards, evenly spaced statement dates mean no week where all bills are due at once. Always have a \u201cfresh\u201d card.',
    example: 'Cards closing on 5th, 15th, 25th = one resets every 10 days.',
  },
  {
    id: 'W-06',
    title: 'Align with your payday',
    body: 'A card that closes 2\u20135 days after payday = you have cash when the bill arrives + near full month to spend.',
    example: 'Payday on the 15th \u2192 ideal card close on 18th\u201320th.',
  },
  {
    id: 'W-07',
    title: 'Can I change my statement date?',
    body: 'Most PH banks don\u2019t allow it \u2014 BDO, BPI, Metrobank, RCBC all fix the date at issuance. Digital banks (Maya, GCash) may be more flexible.',
    example: 'Your BDO date is locked. But you can choose a new card strategically.',
  },
  {
    id: 'W-08',
    title: 'What to ask when applying',
    body: 'Banks rarely advertise statement dates. Ask: \u201cWhat statement date will my card have?\u201d before or right after approval.',
    example: 'Aim for a date that fills your biggest gap (e.g. if you have 5th and 15th, ask for around the 25th).',
  },
  {
    id: 'W-09',
    title: 'Statement date = credit score',
    body: 'Your statement date is when your balance is reported to credit bureaus. High balance on report day = high utilization = lower score.',
    example: 'Pay down before your close date to improve your reported utilization.',
  },
  {
    id: 'W-10',
    title: 'The 2-day buffer rule',
    body: 'Avoid swiping within 2 days of your statement close. The purchase may still land on the current bill, cutting your grace period short.',
    example: 'BDO closes on the 15th \u2192 avoid swiping on the 13th or 14th.',
  },
  {
    id: 'W-11',
    title: 'What is utilization?',
    body: 'Your credit utilization is how much of your limit you\u2019re using. Lower is better for your credit score. Under 30% is the common target.',
    example: '\u20B115,000 used on a \u20B150,000 limit = 30% utilization.',
  },
  {
    id: 'W-12',
    title: 'The sweet spot after close',
    body: 'The day after your statement closes is the best time to make big purchases \u2014 you get the full cycle + grace period interest-free.',
    example: 'Close on the 15th \u2192 swipe on the 16th = ~50 days of free float.',
  },
  {
    id: 'W-13',
    title: 'Lose your grace period?',
    body: 'If you don\u2019t pay your full balance, you lose your grace period. New purchases start accruing interest immediately \u2014 even if you pay most of it. To restore it, pay in full for two consecutive months.',
    example: 'Carried \u20B1500 from last month \u2192 your new purchases are being charged interest now.',
  },
];
