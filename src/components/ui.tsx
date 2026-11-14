import { useRouter, type Href } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { INSTRUMENTS, type InstrumentId } from '@/lib/pitch';
import { useInstrument } from '@/state/instrument';
import { colors, serif } from '@/theme';

export function Screen({
  children,
  scroll = true,
}: {
  children: React.ReactNode;
  scroll?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const content = <View style={[styles.pad, { paddingBottom: insets.bottom + 32 }]}>{children}</View>;
  if (!scroll) {
    return <View style={styles.screen}>{content}</View>;
  }
  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ flexGrow: 1 }}>
      {content}
    </ScrollView>
  );
}

export function Heading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.heading}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function Card({
  title,
  body,
  href,
  onPress,
}: {
  title: string;
  body: string;
  href?: Href;
  onPress?: () => void;
}) {
  const router = useRouter();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress ?? (href ? () => router.push(href) : undefined)}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardBody}>{body}</Text>
    </Pressable>
  );
}

export function InstrumentSwitch() {
  const { instrument, setInstrument } = useInstrument();
  return (
    <View style={styles.segment} accessibilityRole="tablist">
      {(Object.keys(INSTRUMENTS) as InstrumentId[]).map((id) => {
        const selected = instrument === id;
        return (
          <Pressable
            key={id}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => setInstrument(id)}
            style={[styles.segmentItem, selected && styles.segmentOn]}
          >
            <Text style={[styles.segmentText, selected && styles.segmentTextOn]}>{INSTRUMENTS[id].label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function ChoiceRow({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <View style={styles.choiceWrap}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={[styles.choice, selected && styles.choiceOn]}
          >
            <Text style={[styles.choiceText, selected && styles.choiceTextOn]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  tone = 'brass',
}: {
  label: string;
  onPress: () => void;
  tone?: 'brass' | 'danger' | 'frog';
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.primary,
        tone === 'danger' && { backgroundColor: colors.danger },
        tone === 'frog' && { backgroundColor: colors.frog },
        pressed && { opacity: 0.86 },
      ]}
    >
      <Text style={styles.primaryText}>{label}</Text>
    </Pressable>
  );
}

export function Panel({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.panel, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  pad: { padding: 20, gap: 16 },
  heading: { color: colors.ink, fontFamily: serif, fontSize: 34, lineHeight: 38 },
  subtitle: { color: colors.muted, fontSize: 16, lineHeight: 22 },
  card: {
    backgroundColor: colors.raised,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
    gap: 4,
  },
  cardPressed: { borderColor: colors.brass },
  cardTitle: { color: colors.ink, fontSize: 18, fontWeight: '600' },
  cardBody: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.raised,
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },
  segmentItem: { flex: 1, borderRadius: 11, paddingVertical: 10, alignItems: 'center' },
  segmentOn: { backgroundColor: colors.frogDeep },
  segmentText: { color: colors.muted, fontSize: 14, fontWeight: '600' },
  segmentTextOn: { color: colors.ink },
  choiceWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  choiceOn: { backgroundColor: colors.brass, borderColor: colors.brass },
  choiceText: { color: colors.ink, fontSize: 14 },
  choiceTextOn: { color: '#241806', fontWeight: '700' },
  primary: {
    backgroundColor: colors.brass,
    borderRadius: 16,
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  primaryText: { color: '#241806', fontSize: 17, fontWeight: '700' },
  panel: {
    backgroundColor: colors.raised,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
    gap: 12,
  },
});
