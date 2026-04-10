import { StyleSheet, ScrollView, View as RNView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/Themed';
import {
  MicroText, CaptionText, FootnoteText, SubheadText,
  BodyText, HeadlineText, Body2Text,
  H6Text, H5Text, H4Text, H3Text, H2Text, H1Text,
  LargeTitleText, DisplayText, JumboText,
} from '@/components/atoms';
import { useAppTheme } from '@/theme';
import { fonts, typeScale } from '@/theme/fonts';

const ITEMS = [
  ['MicroText', typeScale.micro, MicroText],
  ['CaptionText', typeScale.caption, CaptionText],
  ['FootnoteText', typeScale.footnote, FootnoteText],
  ['SubheadText', typeScale.subhead, SubheadText],
  ['BodyText', typeScale.body, BodyText],
  ['HeadlineText', typeScale.headline, HeadlineText],
  ['Body2Text', typeScale.body2, Body2Text],
  ['H6Text', typeScale.h6, H6Text],
  ['H5Text', typeScale.h5, H5Text],
  ['H4Text', typeScale.h4, H4Text],
  ['H3Text', typeScale.h3, H3Text],
  ['H2Text', typeScale.h2, H2Text],
  ['H1Text', typeScale.h1, H1Text],
  ['LargeTitleText', typeScale.largeTitle, LargeTitleText],
  ['DisplayText', typeScale.display, DisplayText],
  ['JumboText', typeScale.jumbo, JumboText],
] as const;

export default function TypeShowcaseScreen() {
  const t = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.background }}
      contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 24 }]}
    >
      {ITEMS.map(([name, size, Component]) => (
        <RNView key={name} style={styles.row}>
          <Component style={{ color: t.textPrimary, fontFamily: fonts.interSemiBold }}>
            {name}
          </Component>
          <Text style={[styles.size, { color: t.textMuted }]}>{size}px</Text>
        </RNView>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingVertical: 10,
  },
  size: {
    fontSize: typeScale.footnote,
    fontFamily: fonts.interRegular,
  },
});
