export interface GlassGradientOptions {
  /** 상단 알파값 (기본 0.88) */
  topAlpha?: number;
  /** 하단 알파값 (기본 0.65) */
  bottomAlpha?: number;
  /** 상단 색상 어둡게 할 오프셋 (기본 30) */
  darkOffset?: number;
  /** gradient 각도 (기본 180deg) */
  angle?: number;
}

/**
 * hex 색상을 글래스 그라디언트로 변환.
 * 상단: 어두운 색(높은 알파) → 하단: 밝은 색(낮은 알파)
 */
export function hexToGlassGradient(hex: string, options?: GlassGradientOptions): string {
  const { topAlpha = 0.88, bottomAlpha = 0.65, darkOffset = 30, angle = 180 } = options ?? {};
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `linear-gradient(${angle}deg, rgba(${Math.max(0, r - darkOffset)},${Math.max(0, g - darkOffset)},${Math.max(0, b - darkOffset)},${topAlpha}) 0%, rgba(${r},${g},${b},${bottomAlpha}) 100%)`;
}
