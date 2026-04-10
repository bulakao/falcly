import { Text, type TextProps } from '@/components/Themed';
import { typeScale } from '@/theme/fonts';

type ScaledTextProps = Omit<TextProps, 'maxFontSizeMultiplier'>;

function createScaledText(size: number) {
  return function ScaledText({ style, ...props }: ScaledTextProps) {
    return <Text style={[{ fontSize: size }, style]} {...props} />;
  };
}

export const MicroText = createScaledText(typeScale.micro);
export const CaptionText = createScaledText(typeScale.caption);
export const FootnoteText = createScaledText(typeScale.footnote);
export const SubheadText = createScaledText(typeScale.subhead);
export const BodyText = createScaledText(typeScale.body);
export const HeadlineText = createScaledText(typeScale.headline);
export const Body2Text = createScaledText(typeScale.body2);
export const H6Text = createScaledText(typeScale.h6);
export const H5Text = createScaledText(typeScale.h5);
export const H4Text = createScaledText(typeScale.h4);
export const H3Text = createScaledText(typeScale.h3);
export const H2Text = createScaledText(typeScale.h2);
export const H1Text = createScaledText(typeScale.h1);
export const LargeTitleText = createScaledText(typeScale.largeTitle);
export const DisplayText = createScaledText(typeScale.display);
export const JumboText = createScaledText(typeScale.jumbo);
