/**
 * Utility functions for theme color management
 * Supports hexadecimal color input and converts to OKLCH format
 */

/**
 * Converts hex color to RGB
 */
function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  return [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16),
  ];
}

/**
 * Converts RGB to linear RGB
 */
function rgbToLinear(rgb: number): number {
  const v = rgb / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

/**
 * Converts RGB to XYZ
 */
function rgbToXyz(r: number, g: number, b: number): [number, number, number] {
  const [lr, lg, lb] = [rgbToLinear(r), rgbToLinear(g), rgbToLinear(b)];
  
  return [
    (lr * 0.4124 + lg * 0.3576 + lb * 0.1805) * 100,
    (lr * 0.2126 + lg * 0.7152 + lb * 0.0722) * 100,
    (lr * 0.0193 + lg * 0.1192 + lb * 0.9505) * 100,
  ];
}

/**
 * Converts XYZ to Lab
 */
function xyzToLab(x: number, y: number, z: number): [number, number, number] {
  const [xn, yn, zn] = [95.047, 100.0, 108.883];
  const [fx, fy, fz] = [
    labF(x / xn),
    labF(y / yn),
    labF(z / zn),
  ];
  
  return [
    116 * fy - 16,
    500 * (fx - fy),
    200 * (fy - fz),
  ];
}

function labF(t: number): number {
  return t > 0.008856
    ? Math.pow(t, 1 / 3)
    : (7.787 * t + 16 / 116);
}

/**
 * Converts Lab to OKLCH
 */
function labToOklch(l: number, a: number, b: number): [number, number, number] {
  // Simplified conversion - in production, use a proper color library
  // This is an approximation
  const c = Math.sqrt(a * a + b * b);
  let h = Math.atan2(b, a) * (180 / Math.PI);
  if (h < 0) h += 360;
  
  // Convert Lab L to OKLCH L (approximation)
  const l_ok = (l + 16) / 116;
  
  return [l_ok, c / 150, h];
}

/**
 * Converts hex color to OKLCH string
 * @param hex - Hexadecimal color (e.g., "#8b5cf6" or "8b5cf6")
 * @returns OKLCH color string (e.g., "oklch(0.65 0.18 285)")
 */
export function hexToOklch(hex: string): string {
  try {
    const rgb = hexToRgb(hex);
    const xyz = rgbToXyz(...rgb);
    const lab = xyzToLab(...xyz);
    const [l, c, h] = labToOklch(...lab);
    
    // Normalize values for OKLCH format
    const lNorm = Math.max(0, Math.min(1, l));
    const cNorm = Math.max(0, Math.min(0.4, c));
    const hNorm = Math.round(h);
    
    return `oklch(${lNorm.toFixed(3)} ${cNorm.toFixed(3)} ${hNorm})`;
  } catch (error) {
    console.warn(`Failed to convert hex ${hex} to OKLCH, using default violet`, error);
    return "oklch(0.65 0.18 285)"; // Default violet
  }
}

/**
 * Gets the primary color from environment variable or returns default violet
 */
export function getPrimaryColor(): string {
  const envColor = import.meta.env.VITE_PRIMARY_COLOR;
  
  if (envColor) {
    // Remove all whitespace (spaces, tabs, newlines) and trim
    const cleanColor = envColor.replace(/\s/g, '').trim();
    
    // Validate hex format (with or without #)
    if (/^#?[0-9A-Fa-f]{6}$/i.test(cleanColor)) {
      const hex = cleanColor.startsWith('#') ? cleanColor : `#${cleanColor}`;
      const oklch = hexToOklch(hex);
      console.log('[Theme] ✅ Using color from .env:', hex, '->', oklch);
      return oklch;
    }
    
    // If it's already OKLCH format, use it directly
    if (cleanColor.toLowerCase().startsWith('oklch')) {
      console.log('[Theme] ✅ Using OKLCH color directly:', cleanColor);
      return cleanColor;
    }
    
    console.warn(`[Theme] ⚠️ Invalid color format: "${cleanColor}", using default`);
  } else {
    console.log('[Theme] ℹ️ No VITE_PRIMARY_COLOR found, using default violet');
  }
  
  // Default modern violet color
  return "oklch(0.65 0.18 285)";
}

/**
 * Generates color variants based on primary color
 */
export function generateColorVariants(baseOklch: string) {
  // Extract values from OKLCH string
  const match = baseOklch.match(/oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)\)/);
  if (!match) {
    return {
      primary: baseOklch,
      primaryLight: "oklch(0.75 0.20 285)",
      primaryDark: "oklch(0.55 0.15 285)",
    };
  }
  
  const [, l, c, h] = match;
  const lightness = parseFloat(l);
  const chroma = parseFloat(c);
  const hue = parseFloat(h);
  
  return {
    primary: baseOklch,
    primaryLight: `oklch(${Math.min(0.85, lightness + 0.15).toFixed(3)} ${Math.min(0.25, chroma + 0.05).toFixed(3)} ${hue})`,
    primaryDark: `oklch(${Math.max(0.45, lightness - 0.15).toFixed(3)} ${Math.max(0.10, chroma - 0.05).toFixed(3)} ${hue})`,
  };
}

