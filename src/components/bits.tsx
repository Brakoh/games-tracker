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
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <View className="bg-paper px-3 pb-3 pt-3" style={{ borderBottomWidth: 3, borderBottomColor: INK }}>
      <Text style={kicker}>Search</Text>
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

export function PlusButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Add platforms"
      onPress={onPress}
      style={{
        marginHorizontal: 28,
        marginTop: 12,
        marginBottom: 4,
        transform: [{ skewX: "-12deg" }],
        backgroundColor: RED,
        borderWidth: 3,
        borderColor: INK,
        ...hard,
        paddingVertical: 4,
        alignItems: "center",
      }}
    >
      <Text style={{ transform: [{ skewX: "12deg" }], color: "#FFFFFF", fontFamily: DISPLAY, fontSize: 28, lineHeight: 32 }}>+</Text>
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
