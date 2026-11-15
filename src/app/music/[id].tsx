import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useEffect, useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type PointerEvent as RNPointerEvent,
  type ScrollViewInstance,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { findPiece } from '@/data/sheets';
import { useConditionalKeepAwake } from '@/hooks/awake';
import { colors, serif } from '@/theme';

type HandsFreeMode = 'scroll' | 'pages';

export default function MusicViewer() {
  const params = useLocalSearchParams<{ id: string | string[] }>();
  const pieceId = Array.isArray(params.id) ? (params.id[0] ?? '') : String(params.id ?? '');
  const piece = findPiece(pieceId);
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);
  const [chrome, setChrome] = useState(true);
  const [handsFree, setHandsFree] = useState(false);
  const [mode, setMode] = useState<HandsFreeMode>('scroll');
  const [speed, setSpeed] = useState(56);
  const [seconds, setSeconds] = useState(12);
  const [routeId, setRouteId] = useState(pieceId);
  if (routeId !== pieceId) {
    setRouteId(pieceId);
    setIndex(0);
    setHandsFree(false);
    setChrome(true);
  }
  useConditionalKeepAwake(true, 'music-stand');

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const root = document.documentElement;
    const previous = root.style.overscrollBehaviorX;
    root.style.overscrollBehaviorX = 'none';
    return () => {
      root.style.overscrollBehaviorX = previous;
    };
  }, []);

  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE).catch(() => undefined);
    return () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => undefined);
    };
  }, []);

  useEffect(() => {
    if (!chrome || handsFree) return;
    const timer = setTimeout(() => setChrome(false), 4200);
    return () => clearTimeout(timer);
  }, [chrome, handsFree, index]);

  useEffect(() => {
    if (!piece || !handsFree || mode !== 'pages') return;
    const timer = setTimeout(() => {
      setIndex((current) => (current + 1) % piece.pages.length);
    }, seconds * 1000);
    return () => clearTimeout(timer);
  }, [handsFree, mode, seconds, piece, index]);

  if (!piece) {
    return (
      <View style={styles.empty}>
        <Text style={styles.title}>That chart is not in the book.</Text>
        <Pressable accessibilityRole="button" onPress={() => router.back()}>
          <Text style={styles.link}>Back to the stand</Text>
        </Pressable>
      </View>
    );
  }

  const pageCount = piece.pages.length;
  const go = (delta: number) => setIndex((current) => Math.min(pageCount - 1, Math.max(0, current + delta)));

  return (
    <View style={styles.stage}>
      {handsFree && mode === 'scroll' ? (
        <AutoScroll
          key={piece.id}
          pages={piece.pages}
          width={width}
          height={height}
          speed={speed}
          startPage={index}
          onPage={setIndex}
        />
      ) : (
        <PageTurn
          key={piece.id}
          pages={piece.pages}
          index={index}
          width={width}
          height={height}
          onTurn={go}
          onCenter={() => setChrome((open) => !open)}
        />
      )}
      <Text style={[styles.pager, { bottom: Math.max(10, insets.bottom) }]}>
        {Math.min(index + 1, pageCount)} / {pageCount}
      </Text>
      {chrome || handsFree ? (
        <View style={[styles.chrome, { paddingTop: Math.max(8, insets.top) }]}>
          <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} style={styles.chromeButton}>
            <Text style={styles.chromeButtonText}>Back</Text>
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.chromeTitle} numberOfLines={1}>
              {piece.title}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: handsFree }}
            onPress={() => {
              setHandsFree((value) => !value);
              setChrome(true);
            }}
            style={[styles.chromeButton, handsFree && styles.chromeButtonOn]}
          >
            <Text style={styles.chromeButtonText}>{handsFree ? 'Hands-free on' : 'Hands-free'}</Text>
          </Pressable>
        </View>
      ) : null}
      {handsFree ? (
        <View style={[styles.controls, { bottom: Math.max(36, insets.bottom + 28) }]}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setMode((current) => (current === 'scroll' ? 'pages' : 'scroll'))}
            style={styles.chromeButton}
          >
            <Text style={styles.chromeButtonText}>{mode === 'scroll' ? 'Scrolling' : 'Turning pages'}</Text>
          </Pressable>
          {mode === 'scroll' ? (
            <SpeedControl label="Speed" value={speed} min={24} max={180} step={12} onChange={setSpeed} />
          ) : (
            <SpeedControl label="Seconds" value={seconds} min={4} max={30} step={2} onChange={setSeconds} />
          )}
        </View>
      ) : null}
      {height > width ? <Text style={styles.rotate}>Turn the phone sideways. The pages are built for a landscape stand.</Text> : null}
    </View>
  );
}

function PageTurn({
  pages,
  index,
  width,
  height,
  onTurn,
  onCenter,
}: {
  pages: number[];
  index: number;
  width: number;
  height: number;
  onTurn: (delta: number) => void;
  onCenter: () => void;
}) {
  const start = useRef({ x: 0, y: 0 });
  const down = (event: RNPointerEvent) => {
    start.current = { x: event.nativeEvent.pageX, y: event.nativeEvent.pageY };
  };
  const up = (event: RNPointerEvent) => {
    const dx = event.nativeEvent.pageX - start.current.x;
    const dy = event.nativeEvent.pageY - start.current.y;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy)) {
      onTurn(dx < 0 ? 1 : -1);
      return;
    }
    if (Math.abs(dx) < 16 && Math.abs(dy) < 16) {
      const x = event.nativeEvent.offsetX;
      if (x < width * 0.28) onTurn(-1);
      else if (x > width * 0.72) onTurn(1);
      else onCenter();
    }
  };
  const neighbors = [index - 1, index, index + 1].filter((page) => page >= 0 && page < pages.length);
  return (
    <View
      pointerEvents="box-only"
      style={[styles.turn, { width, height }]}
      onPointerDown={down}
      onPointerUp={up}
    >
      {neighbors.map((page) => (
        <Image
          key={page}
          source={pages[page]}
          style={[StyleSheet.absoluteFill, { opacity: page === index ? 1 : 0 }]}
          contentFit="contain"
          transition={0}
          accessibilityLabel={`Page ${page + 1}`}
        />
      ))}
    </View>
  );
}

function AutoScroll({
  pages,
  width,
  height,
  speed,
  startPage,
  onPage,
}: {
  pages: number[];
  width: number;
  height: number;
  speed: number;
  startPage: number;
  onPage: (page: number) => void;
}) {
  const scroller = useRef<ScrollViewInstance>(null);
  const y = useRef(startPage * height);
  const paused = useRef(false);
  const pageRef = useRef(startPage);
  const onPageRef = useRef(onPage);
  onPageRef.current = onPage;
  const [windowStart, setWindowStart] = useState(Math.max(0, startPage - 1));

  useEffect(() => {
    scroller.current?.scrollTo({ y: y.current, animated: false });
  }, [height]);

  useEffect(() => {
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!paused.current) {
        const max = Math.max(0, pages.length * height - height);
        y.current = Math.min(max, y.current + speed * dt);
        scroller.current?.scrollTo({ y: y.current, animated: false });
        const nextPage = Math.min(pages.length - 1, Math.floor(y.current / Math.max(1, height)));
        if (nextPage !== pageRef.current) {
          pageRef.current = nextPage;
          onPageRef.current(nextPage);
        }
        const nextWindow = Math.max(0, nextPage - 1);
        setWindowStart((current) => (current === nextWindow ? current : nextWindow));
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [height, pages.length, speed]);

  const last = Math.min(pages.length - 1, windowStart + 3);
  return (
    <ScrollView
      ref={scroller}
      style={{ width, height }}
      scrollEventThrottle={32}
      onScrollBeginDrag={() => {
        paused.current = true;
      }}
      onScrollEndDrag={(event) => {
        y.current = event.nativeEvent.contentOffset.y;
        paused.current = false;
      }}
      onScroll={(event) => {
        if (paused.current) y.current = event.nativeEvent.contentOffset.y;
      }}
    >
      <View style={{ height: pages.length * height }}>
        {pages.slice(windowStart, last + 1).map((page, offset) => {
          const pageIndex = windowStart + offset;
          return (
            <Image
              key={pageIndex}
              source={page}
              contentFit="contain"
              style={{ position: 'absolute', top: pageIndex * height, width, height }}
            />
          );
        })}
      </View>
    </ScrollView>
  );
}

function SpeedControl({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <View style={styles.speed}>
      <Pressable accessibilityRole="button" accessibilityLabel={`Slower ${label}`} onPress={() => onChange(Math.max(min, value - step))} style={styles.step}>
        <Text style={styles.chromeButtonText}>−</Text>
      </Pressable>
      <Text style={styles.speedValue}>
        {label} {value}
      </Text>
      <Pressable accessibilityRole="button" accessibilityLabel={`Faster ${label}`} onPress={() => onChange(Math.min(max, value + step))} style={styles.step}>
        <Text style={styles.chromeButtonText}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: { flex: 1, backgroundColor: '#070806' },
  turn: { cursor: 'pointer', touchAction: 'none' },
  empty: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', gap: 12 },
  title: { color: colors.ink, fontFamily: serif, fontSize: 28 },
  link: { color: colors.brass, fontSize: 16 },
  pager: { position: 'absolute', right: 16, color: '#d9d3c4', fontVariant: ['tabular-nums'], fontSize: 13 },
  chrome: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingBottom: 8,
    backgroundColor: 'rgba(12, 14, 10, 0.82)',
  },
  chromeTitle: { color: colors.ink, fontFamily: serif, fontSize: 18 },
  chromeButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(20, 23, 15, 0.9)',
  },
  chromeButtonOn: { borderColor: colors.brass },
  chromeButtonText: { color: colors.ink, fontSize: 13, fontWeight: '600' },
  controls: { position: 'absolute', left: 10, flexDirection: 'row', gap: 8, alignItems: 'center' },
  speed: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  speedValue: { color: colors.ink, fontVariant: ['tabular-nums'], minWidth: 84, textAlign: 'center' },
  step: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(20, 23, 15, 0.9)',
    borderWidth: 1,
    borderColor: colors.line,
  },
  rotate: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 64,
    textAlign: 'center',
    color: colors.brass,
    backgroundColor: 'rgba(12, 14, 10, 0.8)',
    overflow: 'hidden',
    borderRadius: 12,
    padding: 8,
  },
});
