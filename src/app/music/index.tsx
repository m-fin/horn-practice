import { Asset } from 'expo-asset';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/ui';
import { pieces, type SheetPiece } from '@/data/sheets';
import { useInstrument } from '@/state/instrument';
import { colors, serif } from '@/theme';

export default function MusicLibrary() {
  const { instrument } = useInstrument();
  return (
    <Screen>
      <Text style={styles.intro}>
        Original Eb alto parts, laid out for a phone on a stand. Written pitch. These are Frog&apos;s charts, not anyone else&apos;s tunes.
      </Text>
      {instrument === 'bb-trumpet' ? (
        <Text style={styles.note}>
          Trumpet is selected. The stand stays in alto clef-reading — Eb written pitch. Use the tuner, drone, and exercises for Bb trumpet.
        </Text>
      ) : null}
      {pieces.map((piece) => (
        <PieceRow key={piece.id} piece={piece} />
      ))}
    </Screen>
  );
}

function PieceRow({ piece }: { piece: SheetPiece }) {
  const router = useRouter();
  const [status, setStatus] = useState('');
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open ${piece.title}`}
        onPress={() => router.push({ pathname: '/music/[id]', params: { id: piece.id } })}
        style={({ pressed }) => [styles.main, pressed && { opacity: 0.85 }]}
      >
        <Text style={styles.title}>{piece.title}</Text>
        <Text style={styles.detail}>{piece.detail}</Text>
        <Text style={styles.meta}>
          {piece.tempo} · {piece.pages.length} {piece.pages.length === 1 ? 'page' : 'pages'}
        </Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Share the PDF for ${piece.title}`}
        onPress={() => {
          setStatus('Preparing the PDF…');
          sharePdf(piece)
            .then(() => setStatus(''))
            .catch(() => setStatus('Could not share that PDF.'));
        }}
        style={styles.share}
      >
        <Text style={styles.shareText}>PDF</Text>
      </Pressable>
      {status ? <Text style={styles.status}>{status}</Text> : null}
    </View>
  );
}

async function sharePdf(piece: SheetPiece) {
  const asset = Asset.fromModule(piece.pdf);
  if (!asset.localUri) await asset.downloadAsync();
  const uri = asset.localUri ?? asset.uri;
  if (Platform.OS === 'web') {
    const link = document.createElement('a');
    link.href = uri;
    link.download = `${piece.title}.pdf`;
    link.click();
    return;
  }
  const available = await Sharing.isAvailableAsync();
  if (!available) throw new Error('Sharing is not available on this device.');
  await Sharing.shareAsync(uri, {
    dialogTitle: piece.title,
    mimeType: 'application/pdf',
    UTI: 'com.adobe.pdf',
  });
}

const styles = StyleSheet.create({
  intro: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  note: { color: colors.brass, fontSize: 14, lineHeight: 20 },
  row: {
    backgroundColor: colors.raised,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 8,
    gap: 8,
  },
  main: { padding: 8, gap: 4 },
  title: { color: colors.ink, fontFamily: serif, fontSize: 24 },
  detail: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  meta: { color: colors.faint, fontSize: 13 },
  share: {
    alignSelf: 'flex-start',
    marginLeft: 8,
    marginBottom: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.brass,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  shareText: { color: colors.brass, fontWeight: '700', fontSize: 13 },
  status: { color: colors.faint, fontSize: 12, marginLeft: 8, marginBottom: 6 },
});
