import React from 'react';
import Svg, {
  Circle,
  Defs,
  G,
  Line,
  LinearGradient,
  Rect,
  Stop,
} from 'react-native-svg';

export function Logo({ size = 64 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <LinearGradient id="logoBg" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#263449" />
          <Stop offset="0.55" stopColor="#1E293B" />
          <Stop offset="1" stopColor="#0B1220" />
        </LinearGradient>
        <LinearGradient id="logoCyan" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#7DD3FC" />
          <Stop offset="0.5" stopColor="#38BDF8" />
          <Stop offset="1" stopColor="#0EA5E9" />
        </LinearGradient>
      </Defs>

      <Rect
        x="1"
        y="1"
        width="62"
        height="62"
        rx="15"
        fill="url(#logoBg)"
        stroke="rgba(56,189,248,0.35)"
        strokeWidth="1.2"
      />

      <G fill="none" stroke="url(#logoCyan)" strokeWidth="2.8">
        <Rect x="12.5" y="12.5" width="12.5" height="12.5" rx="2.2" />
        <Rect x="12.5" y="39" width="12.5" height="12.5" rx="2.2" />
        <Rect x="39" y="39" width="12.5" height="12.5" rx="2.2" />
      </G>

      <G fill="url(#logoCyan)">
        <Rect x="16.7" y="16.7" width="4.1" height="4.1" rx="0.8" />
        <Rect x="16.7" y="43.2" width="4.1" height="4.1" rx="0.8" />
        <Rect x="43.2" y="43.2" width="4.1" height="4.1" rx="0.8" />
        <Rect x="30.5" y="12.5" width="4" height="4" rx="0.8" />
        <Rect x="12.5" y="30.5" width="4" height="4" rx="0.8" />
        <Rect x="30.5" y="30.5" width="4" height="4" rx="0.8" />
        <Rect x="39" y="30.5" width="4" height="4" rx="0.8" />
        <Rect x="46" y="30.5" width="4" height="4" rx="0.8" />
        <Rect x="30.5" y="46" width="4" height="4" rx="0.8" />
      </G>

      <Circle
        cx="45.2"
        cy="19.8"
        r="9.2"
        fill="#0B1220"
        stroke="url(#logoCyan)"
        strokeWidth="2.4"
      />
      <Circle
        cx="45.2"
        cy="19.8"
        r="5.2"
        fill="none"
        stroke="#7DD3FC"
        strokeWidth="1.5"
        opacity="0.85"
      />
      <Circle cx="45.2" cy="19.8" r="2.1" fill="#38BDF8" />

      <Line
        x1="12.5"
        y1="31.8"
        x2="51.5"
        y2="31.8"
        stroke="#10B981"
        strokeWidth="1.5"
        opacity="0.75"
        strokeLinecap="round"
      />
    </Svg>
  );
}
