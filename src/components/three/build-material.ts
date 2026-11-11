import { Color } from "three";

/*
 * "The Build": the block material, shared by the companion and anything that previews its shapes.
 * Accent edges from the face UVs over a softly shaded surface, coloured from the site's tokens. A
 * per-instance glow (0..1) tints a block's faces towards the accent (the headset's lenses, the stack's
 * request). Only imported by lazy 3D code.
 */

export const vertexShader = /* glsl */ `
  attribute float instanceGlow;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying float vGlow;
  void main() {
    vUv = uv;
    vGlow = instanceGlow;
    vNormal = normalize(normalMatrix * mat3(instanceMatrix) * normal);
    gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
  }
`;

// Accent edges (about 1.5 device px wide at any DPR) over a softly shaded surface.
export const fragmentShader = /* glsl */ `
  uniform vec3 uAccent;
  uniform vec3 uSurface;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying float vGlow;
  void main() {
    vec2 d = min(vUv, 1.0 - vUv);
    float edge = min(d.x, d.y);
    float px = fwidth(edge);
    float line = 1.0 - smoothstep(px, px * 2.0, edge);
    float light = 0.8 + 0.2 * dot(normalize(vNormal), normalize(vec3(0.3, 0.8, 0.5)));
    // Mixed in linear space, so a small accent share already reads clearly after sRGB output.
    vec3 face = mix(uSurface, uAccent, 0.025 + 0.6 * vGlow) * light;
    gl_FragColor = vec4(mix(face, uAccent, line), 1.0);
    #include <colorspace_fragment>
  }
`;

export type BlockUniforms = { uAccent: { value: Color }; uSurface: { value: Color } };

export function createBlockUniforms(): BlockUniforms {
  return { uAccent: { value: new Color() }, uSurface: { value: new Color() } };
}

/** Reads --accent and --surface from <html>, so the blocks follow the theme. */
export function readTokenColors(target: BlockUniforms) {
  const styles = getComputedStyle(document.documentElement);
  target.uAccent.value.setStyle(styles.getPropertyValue("--accent").trim());
  target.uSurface.value.setStyle(styles.getPropertyValue("--surface").trim());
}
