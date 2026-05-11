import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import type { ReactNode } from 'react';
import { usePathname } from 'expo-router';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const NAV_BG = '#4A6332';
const ACTIVE_ICON = '#FFA500';
const LABEL = '#FFFFFF';

const VISIBLE_TAB_ORDER = [
  'mes-likes',
  'ma-cuisine',
  'suggestions',
  'simpl-ia',
  'profil',
] as const;

type VisibleTabName = (typeof VISIBLE_TAB_ORDER)[number];

function isVisibleTab(name: string): name is VisibleTabName {
  return (VISIBLE_TAB_ORDER as readonly string[]).includes(name);
}

function tabPressFeedback() {
  if (process.env.EXPO_OS === 'ios') {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
}

function useResolvedActiveTab(state: BottomTabBarProps['state']): VisibleTabName {
  const pathname = usePathname() ?? '';
  if (pathname.includes('/receipe/')) {
    return 'suggestions';
  }
  const current = state.routes[state.index]?.name;
  if (current && isVisibleTab(current)) {
    return current;
  }
  return 'suggestions';
}

export function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const activeTab = useResolvedActiveTab(state);

  function goTo(name: VisibleTabName) {
    tabPressFeedback();
    const route = state.routes.find((r) => r.name === name);
    if (!route) {
      navigation.navigate(name as never);
      return;
    }
    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });
    if (!event.defaultPrevented) {
      navigation.navigate(name as never);
    }
  }

  const bottomPad = Math.max(insets.bottom, 10);

  return (
    <View style={[styles.outer, { paddingBottom: bottomPad }]}>
      <View style={styles.pill}>
        <View style={styles.row}>
          <SideTab
            label="Mes likes"
            focused={activeTab === 'mes-likes'}
            onPress={() => goTo('mes-likes')}
            icon={(color) => <MaterialCommunityIcons name="heart" size={22} color={color} />}
          />
          <SideTab
            label="Ma cuisine"
            focused={activeTab === 'ma-cuisine'}
            onPress={() => goTo('ma-cuisine')}
            icon={(color) => (
              <MaterialCommunityIcons name="pot-steam-outline" size={22} color={color} />
            )}
          />
          <View style={styles.centerSlot}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Suggestions de recettes"
              onPress={() => goTo('suggestions')}
              style={({ pressed }) => [
                styles.centerCircle,
                activeTab === 'suggestions' && styles.centerCircleFocused,
                pressed && styles.pressed,
              ]}>
              <MaterialCommunityIcons name="magnify" size={30} color={LABEL} />
            </Pressable>
          </View>
          <SideTab
            label="Simpl'IA"
            focused={activeTab === 'simpl-ia'}
            onPress={() => goTo('simpl-ia')}
            icon={(color) => <MaterialCommunityIcons name="brain" size={22} color={color} />}
          />
          <SideTab
            label="Mon profil"
            focused={activeTab === 'profil'}
            onPress={() => goTo('profil')}
            icon={(color) => <MaterialCommunityIcons name="account" size={22} color={color} />}
          />
        </View>
      </View>
    </View>
  );
}

function SideTab({
  label,
  focused,
  onPress,
  icon,
}: {
  label: string;
  focused: boolean;
  onPress: () => void;
  icon: (color: string) => ReactNode;
}) {
  const color = focused ? ACTIVE_ICON : LABEL;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: focused }}
      onPress={onPress}
      style={({ pressed }) => [styles.sideTab, pressed && styles.pressed]}>
      {icon(color)}
      <Text style={[styles.label, focused && styles.labelFocused]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  outer: {
    paddingHorizontal: 18,
    paddingTop: 8,
    backgroundColor: 'transparent',
  },
  pill: {
    backgroundColor: NAV_BG,
    borderRadius: 999,
    paddingTop: 10,
    paddingBottom: 10,
    paddingHorizontal: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: { elevation: 8 },
      default: {},
    }),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  sideTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    minWidth: 0,
    paddingHorizontal: 2,
  },
  label: {
    color: LABEL,
    fontSize: 10,
    fontWeight: '400',
    textAlign: 'center',
  },
  labelFocused: {
    fontWeight: '700',
  },
  centerSlot: {
    width: 64,
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: -36,
    marginBottom: -6,
  },
  centerCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: NAV_BG,
    borderWidth: 2,
    borderColor: LABEL,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerCircleFocused: {
    borderColor: ACTIVE_ICON,
  },
  pressed: {
    opacity: 0.85,
  },
});
