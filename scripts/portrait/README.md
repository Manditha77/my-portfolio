# Portrait relief (offline)

Turns the source photo into the hero's block portrait (CLAUDE.md §6): voxel relief data (one pin per block,
with a depth and a shade) and the static posters drawn from it. One-off and offline: not part of
`pnpm build`.

- The source photo lives at `docs/portrait-source.jpeg` and is git-ignored. Never copy it into `public/` or
  commit it.
- The venv (`.venv/`), the background-removal model (`.models/`, ~170 MB) and experiment output (`out/`) are
  git-ignored too.
- What ships: `src/components/three/portrait.json` (grids of characters: no pixels and no photo metadata)
  and the posters in `public/images/hero/`.

```sh
python -m venv scripts/portrait/.venv
scripts/portrait/.venv/Scripts/python -m pip install -r scripts/portrait/requirements.txt   # Windows
# macOS/Linux: use scripts/portrait/.venv/bin/python instead

# 1. Photo -> src/components/three/portrait.json (needs the photo and downloads the model on first run).
scripts/portrait/.venv/Scripts/python scripts/portrait/make_portrait.py
#    Try other block counts without touching the site: --targets 2500 3500 --out scripts/portrait/out
#    --debug-dir <folder outside the repo> writes the mask, crop and grid previews.

# 2. portrait.json -> public/images/hero/portrait-{dark,light}.{avif,webp} (no photo needed).
scripts/portrait/.venv/Scripts/python scripts/portrait/render_poster.py
```

Re-run step 2 whenever the data, the block layout (`src/components/three/build-portrait.ts`), the block
shading (`src/components/three/build-material.ts`) or the `--accent`/`--surface` tokens change: the poster
must stay pixel-identical to the 3D portrait at rest, which takes its place on desktop.

## Data format (`portrait.json`)

```json
{
  "cols": 75, "rows": 83, "depthLevels": 8, "shadeLevels": 16, "blocks": 2986, "dissolveFrom": 67,
  "depth": ["   1122  ", "..."], "shade": ["   a9f8  ", "..."], "loose": [[12, 80], "..."],
  "margin": 1, "posterHeight": 675
}
```

- `depth` and `shade` have one string per row, top row first: a space is an empty cell, any other character
  is a block, as one hex digit. Depth `0..depthLevels-1` is how far the pin stands out (0 = nearest the
  backplate); shade `0..shadeLevels-1` is the cell's lightness (0 = darkest).
- From row `dissolveFrom` down, the shoulders thin out and their blocks drift a little, more the lower they
  sit; `loose` lists `[col, row]` of the few that drifted further.
- The poster frames the grid with `margin` empty cells on every side and is `posterHeight` px tall
  (450 CSS px at 1.5x); the 3D portrait uses the same frame, so it fills the hero visual's height exactly.
