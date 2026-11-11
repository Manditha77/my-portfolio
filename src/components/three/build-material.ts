import { Color } from "three";

/*
 * "The Build": the block material. Accent edges from the face UVs over a softly shaded surface, coloured from
 * the site's tokens. One per-instance "look" (vec4) carries everything else:
 * - x, glow (0..1): tints a block's faces towards the accent (the headset's lenses, the stack's request).
 * - y, shade (0..1): a portrait block's lightness from the photo.
 * - z, portrait (0..1): how far a block wears the portrait's look rather than the plain block look. Portrait
 *   blocks are pins: their tips carry the picture as accent "ink" (dark theme: light cells glow; light theme:
 *   dark cells are inked), and their edge lines fade when cells are only a few pixels across (uEdge).
 * - w, opacity: portrait blocks fade as they fall away.
 * scripts/portrait/render_poster.py mirrors this shading for the static posters; keep the two in step.
 * Only imported by lazy 3D code.
 */

export const vertexShader = /* glsl */ `
  attribute vec4 instanceLook;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec4 vLook;
  varying float vTip;
  void main() {
    vUv = uv;
    vLook = instanceLook;
    // 1 on a block's front and back, 0 on its sides (box normals are axis-aligned before the instance matrix).
    vTip = abs(normal.z);
    vNormal = normalize(normalMatrix * mat3(instanceMatrix) * normal);
    gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
  }
`;

// Accent edges (about 1.5 device px wide at any DPR) over a softly shaded surface. Colours mix in linear
// space, so a small accent share already reads clearly after sRGB output.
export const fragmentShader = /* glsl */ `
  uniform vec3 uAccent;
  uniform vec3 uSurface;
  uniform float uInvert;
  uniform float uEdge;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec4 vLook;
  varying float vTip;
  void main() {
    vec2 d = min(vUv, 1.0 - vUv);
    float edge = min(d.x, d.y);
    float px = fwidth(edge);
    float line = 1.0 - smoothstep(px, px * 2.0, edge);
    float facing = dot(normalize(vNormal), normalize(vec3(0.3, 0.8, 0.5)));

    vec3 block = mix(uSurface, uAccent, 0.025 + 0.6 * vLook.x) * (0.8 + 0.2 * facing);

    float tone = mix(vLook.y, 1.0 - vLook.y, uInvert);
    float ink = pow(tone, mix(1.6, 0.75, uInvert)) * mix(0.25, 1.0, vTip);
    vec3 pin = mix(uSurface, uAccent, 0.03 + mix(0.8, 0.94, uInvert) * ink) * (0.62 + 0.38 * facing);
    float pinLine = line * (0.2 + 0.7 * ink) * uEdge;

    vec3 face = mix(block, pin, vLook.z);
    gl_FragColor = vec4(mix(face, uAccent, mix(line, pinLine, vLook.z)), vLook.w);
    #include <colorspace_fragment>
  }
`;

export type BlockUniforms = {
  uAccent: { value: Color };
  uSurface: { value: Color };
  /** 1 in the light theme: the portrait inks its dark cells instead of lighting its light ones. */
  uInvert: { value: number };
  /** Portrait edge-line strength, from its cell size on screen (portraitEdge in build-portrait.ts). */
  uEdge: { value: number };
};

export function createBlockUniforms(): BlockUniforms {
  return { uAccent: { value: new Color() }, uSurface: { value: new Color() }, uInvert: { value: 0 }, uEdge: { value: 1 } };
}

/** Reads --accent and --surface from <html>, and the theme, so the blocks follow it. */
export function readTokenColors(target: BlockUniforms) {
  const root = document.documentElement;
  const styles = getComputedStyle(root);
  target.uAccent.value.setStyle(styles.getPropertyValue("--accent").trim());
  target.uSurface.value.setStyle(styles.getPropertyValue("--surface").trim());
  target.uInvert.value = root.dataset.theme === "light" ? 1 : 0;
}
