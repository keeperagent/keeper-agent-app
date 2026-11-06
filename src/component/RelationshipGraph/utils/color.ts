export const hexToRgba = (
  hex: string,
  alpha = 1,
): [number, number, number, number] => {
  const normalizedHex = hex.replace("#", "");
  const red = parseInt(normalizedHex.substring(0, 2), 16) / 255;
  const green = parseInt(normalizedHex.substring(2, 4), 16) / 255;
  const blue = parseInt(normalizedHex.substring(4, 6), 16) / 255;

  return [red, green, blue, alpha];
};

export const hexToHsl = (hex: string): [number, number, number] => {
  const normalizedHex = hex.replace("#", "");
  const red = parseInt(normalizedHex.substring(0, 2), 16) / 255;
  const green = parseInt(normalizedHex.substring(2, 4), 16) / 255;
  const blue = parseInt(normalizedHex.substring(4, 6), 16) / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const lightness = (max + min) / 2;
  let hue = 0;
  let saturation = 0;

  if (max !== min) {
    const delta = max - min;
    saturation =
      lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);
    if (max === red) {
      hue = ((green - blue) / delta + (green < blue ? 6 : 0)) * 60;
    } else if (max === green) {
      hue = ((blue - red) / delta + 2) * 60;
    } else {
      hue = ((red - green) / delta + 4) * 60;
    }
  }

  return [hue, saturation, lightness];
};

export const hslToHex = (
  hue: number,
  saturation: number,
  lightness: number,
): string => {
  const normalizedHue = ((hue % 360) + 360) % 360;
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const xValue = chroma * (1 - Math.abs(((normalizedHue / 60) % 2) - 1));
  const matchValue = lightness - chroma / 2;
  let red = 0;
  let green = 0;
  let blue = 0;

  if (normalizedHue < 60) {
    [red, green, blue] = [chroma, xValue, 0];
  } else if (normalizedHue < 120) {
    [red, green, blue] = [xValue, chroma, 0];
  } else if (normalizedHue < 180) {
    [red, green, blue] = [0, chroma, xValue];
  } else if (normalizedHue < 240) {
    [red, green, blue] = [0, xValue, chroma];
  } else if (normalizedHue < 300) {
    [red, green, blue] = [xValue, 0, chroma];
  } else {
    [red, green, blue] = [chroma, 0, xValue];
  }

  const toHex = (value: number) =>
    Math.round((value + matchValue) * 255)
      .toString(16)
      .padStart(2, "0");

  return `#${toHex(red)}${toHex(green)}${toHex(blue)}`;
};

export const SUB_CLUSTER_HUE_STEP = 137.508;

const CLUSTER_EDGE_FADE_MIN_SATURATION_SCALE = 0.55;
const CLUSTER_EDGE_FADE_LIGHTNESS_LIFT = 0.22;

export const fadeTowardClusterEdge = (
  hex: string,
  distanceRatio: number,
): string => {
  const clamped = Math.min(1, Math.max(0, distanceRatio));
  if (clamped === 0) {
    return hex;
  }

  const [hue, saturation, lightness] = hexToHsl(hex);
  const fadedSaturation =
    saturation * (1 - clamped * (1 - CLUSTER_EDGE_FADE_MIN_SATURATION_SCALE));
  const fadedLightness = Math.min(
    0.92,
    lightness + clamped * CLUSTER_EDGE_FADE_LIGHTNESS_LIFT,
  );

  return hslToHex(hue, fadedSaturation, fadedLightness);
};
