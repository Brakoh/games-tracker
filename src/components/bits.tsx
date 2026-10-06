import { Pressable, Text, TextInput, View, type TextStyle, type ViewStyle } from "react-native";

import { BODY, CARD, DISPLAY, hard, hardSm, INK, PAPER, RED } from "../theme";

export function SkewTag({
  label,
  onPress,
  active,
}: {
  label: string;
  onPress: () => void;
  active?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={{
        transform: [{ skewX: "-12deg" }],
        backgroundColor: active ? RED : CARD,
        borderWidth: 3,
        borderColor: INK,
        ...hardSm,
        paddingVertical: 6,
        paddingHorizontal: 12,
      }}
    >
      <Text
        style={{
          transform: [{ skewX: "12deg" }],
          color: active ? "#FFFFFF" : INK,
          fontFamily: DISPLAY,
          fontSize: 13,
          letterSpacing: 0.4,
          textTransform: "uppercase",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function SearchField({
  value,
  onChange,
  placeholder,
  labeled = true,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  labeled?: boolean;
}) {
  return (
    <View className="bg-paper px-3 pb-3 pt-3" style={{ borderBottomWidth: 3, borderBottomColor: INK }}>
      {labeled ? <Text style={kicker}>Search</Text> : null}
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="rgba(12,11,8,0.45)"
        autoCapitalize="none"
        autoCorrect={false}
        style={{
          backgroundColor: CARD,
          color: INK,
          borderWidth: 3,
          borderColor: INK,
          ...hard,
          paddingVertical: 12,
          paddingHorizontal: 14,
          fontFamily: BODY,
          fontSize: 15,
        }}
      />
    </View>
  );
}

export function TrashIcon() {
  const ink = "#FFFFFF";
  return (
    <View style={{ width: 20, height: 22, alignItems: "center" }}>
      <View style={{ width: 7, height: 2, backgroundColor: ink }} />
      <View style={{ width: 18, height: 3, backgroundColor: ink, marginTop: 1 }} />
      <View
        style={{
          width: 16,
          height: 14,
          marginTop: 2,
          borderWidth: 2,
          borderColor: ink,
          flexDirection: "row",
          justifyContent: "space-evenly",
          alignItems: "center",
        }}
      >
        <View style={{ width: 2, height: 7, backgroundColor: ink }} />
        <View style={{ width: 2, height: 7, backgroundColor: ink }} />
      </View>
    </View>
  );
}

export function PlusButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Edit systems"
      onPress={onPress}
      style={{
        marginHorizontal: 78,
        marginTop: 12,
        marginBottom: 4,
        transform: [{ skewX: "-12deg" }],
        backgroundColor: RED,
        borderWidth: 3,
        borderColor: INK,
        ...hard,
        paddingVertical: 8,
        paddingHorizontal: 8,
        alignItems: "center",
      }}
    >
      <Text style={{ transform: [{ skewX: "12deg" }], color: "#FFFFFF", fontFamily: DISPLAY, fontSize: 15, lineHeight: 18, letterSpacing: 0.4 }}>
        EDIT SYSTEMS
      </Text>
    </Pressable>
  );
}

export function ListRow({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={{
        marginHorizontal: 12,
        marginTop: 10,
        backgroundColor: CARD,
        borderWidth: 3,
        borderColor: INK,
        ...hard,
        paddingVertical: 12,
        paddingHorizontal: 14,
      }}
    >
      <Text style={display(18)}>{label}</Text>
    </Pressable>
  );
}

function HazardMark() {
  return (
    <View accessibilityElementsHidden importantForAccessibility="no" style={{ width: 44, height: 38, alignItems: "center" }}>
      <View
        style={{
          width: 0,
          height: 0,
          borderLeftWidth: 22,
          borderRightWidth: 22,
          borderBottomWidth: 38,
          borderLeftColor: "transparent",
          borderRightColor: "transparent",
          borderBottomColor: INK,
        }}
      />
      <View
        style={{
          position: "absolute",
          top: 5,
          width: 0,
          height: 0,
          borderLeftWidth: 17,
          borderRightWidth: 17,
          borderBottomWidth: 29,
          borderLeftColor: "transparent",
          borderRightColor: "transparent",
          borderBottomColor: PAPER,
        }}
      />
      <Text style={{ position: "absolute", top: 16, fontFamily: DISPLAY, fontSize: 16, lineHeight: 18, color: INK }}>!</Text>
    </View>
  );
}

export function EmptyNote() {
  return (
    <View style={{ flex: 1, alignItems: "center", paddingHorizontal: 32, paddingTop: 168 }}>
      <HazardMark />
      <Text
        style={{
          marginTop: 14,
          fontFamily: DISPLAY,
          fontSize: 28,
          lineHeight: 32,
          letterSpacing: 0.5,
          textTransform: "uppercase",
          textAlign: "center",
          color: INK,
        }}
      >
        Nothing here yet
      </Text>
    </View>
  );
}

export function display(size: number): TextStyle {
  return {
    fontFamily: DISPLAY,
    fontSize: size,
    letterSpacing: 0.4,
    textTransform: "uppercase",
    color: INK,
  };
}

export const kicker: TextStyle = {
  fontFamily: DISPLAY,
  fontSize: 12,
  letterSpacing: 1.6,
  textTransform: "uppercase",
  color: RED,
  marginBottom: 8,
};

export const frame: ViewStyle = {
  backgroundColor: CARD,
  borderWidth: 3,
  borderColor: INK,
  ...hard,
};
