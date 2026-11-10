import { AnimationMixer, Box3, Group, Mesh, SkinnedMesh, Texture, Vector3, type AnimationClip, type Material } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

/*
 * Loads the AR Elemental Arena creatures for CreatureViewer. Each .glb is fetched only when first
 * chosen and then cached; disposeCreatures() frees everything when the viewer unmounts. Only
 * imported by the lazy viewer chunk.
 */

// Every creature is scaled to this height, with its footprint capped so it never leaves the frame
// while it turns (the bat and the drake are much wider than they are tall).
const TARGET_HEIGHT = 1.6;
const MAX_RADIUS = 1;

export type LoadedCreature = {
  /** Scaled and centred: feet at y = 0, middle on the y axis. */
  root: Group;
  mixer: AnimationMixer;
  rest: AnimationClip;
  /** The other clips, in file order, without any Death clip. */
  moves: readonly AnimationClip[];
};

const cache = new Map<string, Promise<LoadedCreature>>();
let loader: GLTFLoader | undefined;

function fit(scene: Group): Group {
  scene.updateMatrixWorld(true);
  const box = new Box3().setFromObject(scene);
  const size = box.getSize(new Vector3());
  const center = box.getCenter(new Vector3());
  const radius = Math.hypot(size.x, size.z) / 2;
  const scale = Math.min(TARGET_HEIGHT / size.y, MAX_RADIUS / radius);

  const root = new Group();
  root.scale.setScalar(scale);
  root.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);
  root.add(scene);
  return root;
}

export function loadCreature(url: string, restClip: string): Promise<LoadedCreature> {
  let pending = cache.get(url);
  if (!pending) {
    loader ??= new GLTFLoader();
    pending = loader.loadAsync(url).then((gltf) => {
      // Clip names carry an armature prefix ("CharacterArmature|Idle"), so match the end.
      const clips = gltf.animations.filter((clip) => !/death/i.test(clip.name));
      const rest = clips.find((clip) => clip.name.endsWith(restClip)) ?? clips[0];
      return {
        root: fit(gltf.scene),
        mixer: new AnimationMixer(gltf.scene),
        rest,
        moves: clips.filter((clip) => clip !== rest),
      };
    });
    // A failed fetch isn't cached, so choosing the creature again retries.
    pending.catch(() => cache.delete(url));
    cache.set(url, pending);
  }
  return pending;
}

function disposeMaterial(material: Material) {
  for (const value of Object.values(material)) if (value instanceof Texture) value.dispose();
  material.dispose();
}

function dispose({ root, mixer }: LoadedCreature) {
  mixer.stopAllAction();
  mixer.uncacheRoot(mixer.getRoot());
  root.removeFromParent();
  root.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    object.geometry.dispose();
    const materials: Material[] = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach(disposeMaterial);
    if (object instanceof SkinnedMesh) object.skeleton.dispose();
  });
}

/** Frees every loaded creature (geometries, materials, textures, skeletons) and empties the cache. */
export function disposeCreatures() {
  for (const pending of cache.values()) pending.then(dispose, () => {});
  cache.clear();
}
