/** Shared Perlin noise + halftone draw for DotField-adjacent surfaces. */

const NOISE_SCALE = 220;
const NOISE_SPEED = 0.11;
const TONE_STEP = 3;
const BUCKETS = 9;

export function createNoise(seed: number) {
  const p = Array.from({ length: 256 }, (_, i) => i);
  let state = seed >>> 0 || 1;
  const random = () => {
    state = (state * 1_664_525 + 1_013_904_223) >>> 0;
    return state / 4_294_967_296;
  };
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
  }
  const perm = new Uint8Array(512);
  for (let i = 0; i < 512; i++) {
    perm[i] = p[i & 255];
  }
  const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const grad = (hash: number, x: number, y: number, z: number) => {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    let v = z;
    if (h < 4) {
      v = y;
    } else if (h === 12 || h === 14) {
      v = x;
    }
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  };

  return (x: number, y: number, z: number) => {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const Z = Math.floor(z) & 255;
    const fx = x - Math.floor(x);
    const fy = y - Math.floor(y);
    const fz = z - Math.floor(z);
    const u = fade(fx);
    const v = fade(fy);
    const w = fade(fz);
    const A = perm[X] + Y;
    const AA = perm[A] + Z;
    const AB = perm[A + 1] + Z;
    const B = perm[X + 1] + Y;
    const BA = perm[B] + Z;
    const BB = perm[B + 1] + Z;
    return lerp(
      lerp(
        lerp(grad(perm[AA], fx, fy, fz), grad(perm[BA], fx - 1, fy, fz), u),
        lerp(
          grad(perm[AB], fx, fy - 1, fz),
          grad(perm[BB], fx - 1, fy - 1, fz),
          u,
        ),
        v,
      ),
      lerp(
        lerp(
          grad(perm[AA + 1], fx, fy, fz - 1),
          grad(perm[BA + 1], fx - 1, fy, fz - 1),
          u,
        ),
        lerp(
          grad(perm[AB + 1], fx, fy - 1, fz - 1),
          grad(perm[BB + 1], fx - 1, fy - 1, fz - 1),
          u,
        ),
        v,
      ),
      w,
    );
  };
}

function buildToneGrid(
  width: number,
  height: number,
  spacing: number,
  time: number,
  noise: (x: number, y: number, z: number) => number,
) {
  const cols = Math.ceil(width / spacing) + 2;
  const rows = Math.ceil(height / spacing) + 2;
  const originX = (width - (cols - 1) * spacing) / 2;
  const originY = (height - (rows - 1) * spacing) / 2;
  const tone = new Float32Array(cols * rows);
  const z = time * NOISE_SPEED;
  const step = spacing * TONE_STEP;
  const coarseCols = Math.ceil((cols - 1) / TONE_STEP) + 1;
  const coarseRows = Math.ceil((rows - 1) / TONE_STEP) + 1;
  const coarse = new Float32Array(coarseCols * coarseRows);

  for (let j = 0; j < coarseRows; j++) {
    const ny = (originY + j * step) / NOISE_SCALE;
    for (let i = 0; i < coarseCols; i++) {
      const nx = (originX + i * step) / NOISE_SCALE;
      const n =
        noise(nx, ny, z) * 0.7 +
        noise(nx * 2.3 + 4.1, ny * 2.3 - 2.8, z * 1.4) * 0.3;
      coarse[j * coarseCols + i] = Math.min(1, Math.max(0, 0.48 + n * 1.15));
    }
  }

  for (let j = 0; j < rows; j++) {
    const cj = Math.min(Math.floor(j / TONE_STEP), coarseRows - 2);
    const fy = j / TONE_STEP - cj;
    for (let i = 0; i < cols; i++) {
      const ci = Math.min(Math.floor(i / TONE_STEP), coarseCols - 2);
      const fx = i / TONE_STEP - ci;
      const a = cj * coarseCols + ci;
      const top = coarse[a] + (coarse[a + 1] - coarse[a]) * fx;
      const bottom =
        coarse[a + coarseCols] +
        (coarse[a + coarseCols + 1] - coarse[a + coarseCols]) * fx;
      tone[j * cols + i] = top + (bottom - top) * fy;
    }
  }

  return { cols, rows, originX, originY, tone };
}

export type HalftonePointer = {
  x: number;
  y: number;
  active: boolean;
};

export type HalftoneFieldOptions = {
  alphaMin?: number;
  alphaMax?: number;
  pointerRadius?: number;
  maxRadiusScale?: number;
  pointerBoost?: number;
};

export function drawHalftoneField(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  spacing: number,
  time: number,
  noise: (x: number, y: number, z: number) => number,
  color: string,
  pointer?: HalftonePointer,
  options?: HalftoneFieldOptions,
) {
  const alphaMin = options?.alphaMin ?? 0.16;
  const alphaMax = options?.alphaMax ?? 0.54;
  const pointerRadius = options?.pointerRadius ?? 96;
  const pointerBoost = options?.pointerBoost ?? 1.35;
  const maxRadius = spacing * (options?.maxRadiusScale ?? 0.4);
  const { cols, rows, originX, originY, tone } = buildToneGrid(
    width,
    height,
    spacing,
    time,
    noise,
  );
  const paths = Array.from({ length: BUCKETS }, () => new Path2D());
  const filled = new Uint8Array(BUCKETS);

  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const k = j * cols + i;
      const x = originX + i * spacing;
      const y = originY + j * spacing;
      let amount = 0.1 + 0.58 * tone[k];

      if (pointer?.active) {
        const dist = Math.hypot(x - pointer.x, y - pointer.y);
        if (dist < pointerRadius) {
          const falloff = 1 - dist / pointerRadius;
          amount *= 1 + pointerBoost * falloff * falloff;
        }
      }

      const bucket = Math.round(
        Math.min(1, Math.max(0, amount)) * (BUCKETS - 1),
      );
      if (bucket === 0) {
        continue;
      }
      const radius = (maxRadius * bucket) / (BUCKETS - 1);
      const path = paths[bucket];
      path.moveTo(x + radius, y);
      path.arc(x, y, radius, 0, Math.PI * 2);
      filled[bucket] = 1;
    }
  }

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = color;
  for (let b = 1; b < BUCKETS; b++) {
    if (!filled[b]) {
      continue;
    }
    ctx.globalAlpha =
      alphaMin + ((alphaMax - alphaMin) * b) / (BUCKETS - 1);
    ctx.fill(paths[b]);
  }
  ctx.globalAlpha = 1;
}

export function seedFromCode(code: string): number {
  let hash = 0;
  for (let i = 0; i < code.length; i++) {
    hash = (hash * 31 + code.charCodeAt(i)) >>> 0;
  }
  return hash || 7;
}
