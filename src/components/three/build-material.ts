import { Color } from "three";

/*
 * "The Build": the block and beam materials, shared by the companion and anything that previews its shapes.
 * Accent edges from the face UVs over a softly shaded surface, coloured from the site's tokens. A
 * per-instance glow (0..1) tints a block's faces towards the accent (the headset's lenses, the stack's
 * request). In the light theme (uSolid, only while the light-only --solid-* tokens exist) the faces take
 * three tones by the way they look (top, left, right), with dark-teal edges, so the blocks read as solid
 * and match the poster's faces at rest. Only imported by lazy 3D code.
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
// Light theme (uSolid): three tones by the way a face looks in view space, by the poster's rule (top when its
// normal points up past 0.5, else left or right; bySide in src/lib/build-marks.ts), each blended over a
// narrow band so a turning face changes tone smoothly; at rest they match the poster's.
export const fragmentShader = /* glsl */ `
  uniform vec3 uAccent;
  uniform vec3 uSurface;
  uniform float uSolid;
  uniform vec3 uTop;
  uniform vec3 uLeft;
  uniform vec3 uRight;
  uniform vec3 uEdge;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying float vGlow;
  void main() {
    vec2 d = min(vUv, 1.0 - vUv);
    float edge = min(d.x, d.y);
    float px = fwidth(edge);
    float line = 1.0 - smoothstep(px, px * 2.0, edge);
    if (uSolid < 0.5) {
      float light = 0.8 + 0.2 * dot(normalize(vNormal), normalize(vec3(0.3, 0.8, 0.5)));
      // Mixed in linear space, so a small accent share already reads clearly after sRGB output.
      vec3 face = mix(uSurface, uAccent, 0.025 + 0.6 * vGlow) * light;
      gl_FragColor = vec4(mix(face, uAccent, line), 1.0);
    } else {
      vec3 n = normalize(vNormal);
      vec3 tone = mix(uLeft, uRight, smoothstep(-0.08, 0.08, n.x));
      tone = mix(tone, uTop, smoothstep(0.45, 0.55, n.y));
      vec3 face = mix(tone, uAccent, 0.6 * vGlow);
      gl_FragColor = vec4(mix(face, uEdge, line), 1.0);
    }
    #include <colorspace_fragment>
  }
`;

/*
 * The build beam: a unit plane stretched across the free box, a few px tall. A thin accent core with a
 * soft halo that trails a little further behind the line (uTrail: +1 below while it rises, -1 above while
 * it falls), fading out towards both ends.
 */
export const beamVertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const beamFragmentShader = /* glsl */ `
  uniform vec3 uAccent;
  uniform float uOpacity;
  uniform float uTrail;
  varying vec2 vUv;
  void main() {
    float y = vUv.y * 2.0 - 1.0;
    float core = exp(-pow(y * 13.0, 2.0));
    float halo = exp(-pow(y * 2.5, 2.0)) * (y * uTrail < 0.0 ? 0.35 : 0.15);
    float ends = smoothstep(0.0, 0.2, vUv.x) * smoothstep(0.0, 0.2, 1.0 - vUv.x);
    gl_FragColor = vec4(uAccent, min(1.0, core + halo) * ends * uOpacity);
    #include <colorspace_fragment>
  }
`;

export type BeamUniforms = {
  uAccent: { value: Color };
  uOpacity: { value: number };
  uTrail: { value: number };
};

/** Shares the blocks' accent, so the theme recolours both at once. */
export function createBeamUniforms(blocks: BlockUniforms): BeamUniforms {
  return { uAccent: blocks.uAccent, uOpacity: { value: 0 }, uTrail: { value: 1 } };
}

export type BlockUniforms = {
  uAccent: { value: Color };
  uSurface: { value: Color };
  /** 1: three-tone solid faces (light theme), 0: the shaded surface (dark). */
  uSolid: { value: number };
  uTop: { value: Color };
  uLeft: { value: Color };
  uRight: { value: Color };
  uEdge: { value: Color };
};

export function createBlockUniforms(): BlockUniforms {
  return {
    uAccent: { value: new Color() },
    uSurface: { value: new Color() },
    uSolid: { value: 0 },
    uTop: { value: new Color() },
    uLeft: { value: new Color() },
    uRight: { value: new Color() },
    uEdge: { value: new Color() },
  };
}

// Light-only tokens (globals.css): the solid faces' tones and edges, in the uniforms' order.
const SOLID_TOKENS = ["--solid-top", "--solid-left", "--solid-right", "--solid-edge"] as const;

/**
 * Reads the block colours from <html>, so the blocks follow the theme. Three-tone faces only while every
 * --solid-* token is defined, which only the light theme does; otherwise the dark shading, which never reads
 * the tone uniforms, so a light colour left in them can't show.
 */
export function readTokenColors(target: BlockUniforms) {
  const styles = getComputedStyle(document.documentElement);
  const token = (name: string) => styles.getPropertyValue(name).trim();
  target.uAccent.value.setStyle(token("--accent"));
  target.uSurface.value.setStyle(token("--surface"));

  const solid = SOLID_TOKENS.map(token);
  target.uSolid.value = solid.every(Boolean) ? 1 : 0;
  if (!target.uSolid.value) return;
  const [top, left, right, edge] = solid;
  target.uTop.value.setStyle(top);
  target.uLeft.value.setStyle(left);
  target.uRight.value.setStyle(right);
  target.uEdge.value.setStyle(edge);
}

/** Calls `onChange` whenever the theme toggle (or the OS theme) changes data-theme on <html>; returns a cleanup. */
export function onThemeChange(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}
