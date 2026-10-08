import { useRef, type ReactNode } from "react";
import { Animated, Easing, Pressable, StyleSheet, type PressableProps, type StyleProp, type ViewStyle } from "react-native";

import { INK } from "../theme";

const OUTER = new Set([
  "position",
  "top",
  "left",
  "right",
  "bottom",
  "margin",
  "marginTop",
  "marginRight",
  "marginBottom",
  "marginLeft",
  "marginHorizontal",
  "marginVertical",
  "zIndex",
  "flex",
  "flexGrow",
  "flexShrink",
  "flexBasis",
  "width",
  "alignSelf",
  "minWidth",
  "maxWidth",
]);

export function PressShade({ opacity }: { opacity: Animated.AnimatedInterpolation<number> }) {
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        backgroundColor: INK,
        opacity,
      }}
    />
  );
}

export function Tap({
  onPress,
  style,
  children,
  shade: dim = true,
  shrink = true,
  accessibilityLabel,
  accessibilityRole = "button",
  hitSlop,
  onLongPress,
}: {
  onPress?: () => void;
  onLongPress?: () => void;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode | ((shade: Animated.AnimatedInterpolation<number>) => ReactNode);
  shade?: boolean;
  shrink?: boolean;
  accessibilityLabel?: string;
  accessibilityRole?: PressableProps["accessibilityRole"];
  hitSlop?: PressableProps["hitSlop"];
}) {
  const pressed = useRef(new Animated.Value(0)).current;
  const flat = StyleSheet.flatten(style) ?? {};
  const outer: ViewStyle = {};
  const inner: ViewStyle = {};
  for (const key of Object.keys(flat) as (keyof ViewStyle)[]) {
    if (OUTER.has(key)) outer[key] = flat[key] as never;
    else inner[key] = flat[key] as never;
  }
  const stretch =
    outer.flex != null || outer.height != null || (outer.position === "absolute" && outer.top != null && outer.bottom != null);
  const shift = Array.isArray(inner.transform) ? inner.transform : [];
  delete inner.transform;
  const scale = pressed.interpolate({ inputRange: [0, 1], outputRange: [1, shrink ? 0.97 : 1] });
  const shadeOpacity = pressed.interpolate({ inputRange: [0, 1], outputRange: [0, 0.12] });

  const sink = (to: number) => {
    Animated.timing(pressed, {
      toValue: to,
      duration: to === 1 ? 90 : 150,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  };

  return (
    <Pressable
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      hitSlop={hitSlop}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={420}
      onPressIn={() => sink(1)}
      onPressOut={() => sink(0)}
      style={outer}
    >
      <Animated.View style={[inner, stretch ? { flex: 1 } : null, { position: "relative", transform: [...shift, { scale }] }]}>
        {typeof children === "function" ? children(shadeOpacity) : children}
        {dim ? <PressShade opacity={shadeOpacity} /> : null}
      </Animated.View>
    </Pressable>
  );
}
