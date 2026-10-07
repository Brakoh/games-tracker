import { Image, Text, View } from "react-native";

import { useGameDetails } from "../game-details";
import { BODY, CARD, DISPLAY, hardSm, INK, PAPER, RED } from "../theme";
import { display } from "./bits";
import { BannerDither, CaseFace } from "./chrome";
import { Tap } from "./tap";

const BANNER_HEIGHT = 220;
const OVERLAP = 72;

export function GameSheet({
  title,
  platformId,
  platformName,
  cover,
  finished,
  children,
}: {
  title: string;
  platformId: string;
  platformName: string;
  cover?: string;
  finished?: boolean;
  children?: React.ReactNode;
}) {
  const details = useGameDetails(title, platformId);
  const info = details.data;
  const banner = details.isLoading || Boolean(info?.banner);
  const facts = [
    { label: "Developer", value: info?.developer },
    { label: "Publisher", value: info?.publisher && info.publisher !== info.developer ? info.publisher : undefined },
    { label: "Released", value: info?.year ? String(info.year) : undefined },
    { label: "Genre", value: info?.genres.length ? info.genres.join(", ") : undefined },
  ].filter((fact): fact is { label: string; value: string } => Boolean(fact.value));

  return (
    <>
      {banner ? (
        <View style={{ height: BANNER_HEIGHT, overflow: "hidden" }}>
          {info?.banner ? <Image source={{ uri: info.banner }} resizeMode="cover" style={{ width: "100%", height: "100%" }} /> : null}
          <BannerDither />
        </View>
      ) : null}
      <View style={{ paddingHorizontal: 16, paddingBottom: 16, paddingTop: banner ? 0 : 16, gap: 12 }}>
        <View style={{ flexDirection: "row", gap: 14, alignItems: "flex-start", marginTop: banner ? -OVERLAP : 0 }}>
          <View style={{ flex: 1, gap: 6, paddingTop: banner ? OVERLAP + 4 : 0 }}>
            <Text style={display(22)}>{title}</Text>
            <Text style={{ fontFamily: BODY, fontSize: 12, letterSpacing: 1.2, textTransform: "uppercase", color: INK }}>{platformName}</Text>
            <View style={{ gap: 4, marginTop: 4 }}>
              {details.isLoading ? <Fact label="Developer" value="…" /> : null}
              {facts.map((fact) => (
                <Fact key={fact.label} label={fact.label} value={fact.value} />
              ))}
            </View>
          </View>
          <View style={{ width: 112 }}>
            <CaseFace platformId={platformId} cover={cover} finished={finished} badge={30} />
          </View>
        </View>
        {children ? <View style={{ gap: 10, marginTop: 4 }}>{children}</View> : null}
      </View>
    </>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text style={{ fontFamily: BODY, fontSize: 9, letterSpacing: 1.2, textTransform: "uppercase", color: "rgba(12,11,8,0.55)" }}>{label}</Text>
      <Text style={{ fontFamily: BODY, fontSize: 12, lineHeight: 16, color: INK }}>{value}</Text>
    </View>
  );
}

export function Checkbox({ label, checked, onPress }: { label: string; checked: boolean; onPress: () => void }) {
  return (
    <Tap
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 12,
        paddingHorizontal: 12,
        backgroundColor: CARD,
        borderWidth: 3,
        borderColor: INK,
        ...hardSm,
      }}
    >
      <View
        style={{
          width: 26,
          height: 26,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 3,
          borderColor: INK,
          backgroundColor: checked ? RED : PAPER,
        }}
      >
        {checked ? <Text style={{ color: "#FFFFFF", fontFamily: DISPLAY, fontSize: 16, lineHeight: 18 }}>✓</Text> : null}
      </View>
      <Text style={{ ...display(18), color: INK }}>{label}</Text>
    </Tap>
  );
}
