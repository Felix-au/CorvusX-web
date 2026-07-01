"use client";

import { useEffect, useRef } from "react";
import rawParticles from "../data/particles.json";
import { type AppSettings } from "../types";

const PARTICLE_COUNT = 7000;
const shapes = ["circle", "triangle", "diamond", "square"] as const;

type Shape = (typeof shapes)[number];

interface ParticleData {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  colorIndex: number;
  shape: Shape;
  opacity: number;
  springFactor: number;
  damping: number;
  driftOffset: number;
  scaleFactor: number;
  tempY?: number;
}

interface ParticleCanvasProps {
  settings: AppSettings;
}

function randomRange(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function lerp(start: number, end: number, t: number) {
  return start * (1 - t) + end * t;
}

export default function ParticleCanvas({ settings }: ParticleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const settingsRef = useRef<AppSettings>(settings);

  // Sync settings updates to ref without re-triggering main useEffect hook
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W = window.innerWidth;
    let H = window.innerHeight;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    const mouse = { x: -1000, y: -1000, active: false };
    let mouseInfluenceX = 0;
    let mouseInfluenceY = 0;
    let mouseVx = 0;
    let mouseVy = 0;
    let prevMouseX = -1000;
    let prevMouseY = -1000;

    let gyroX = 0;
    let gyroY = 0;
    let hasGyro = false;

    // ─── 3D Coordinates Setup ──────────────────────────────────────────────
    const sortedBrain = [...rawParticles.brain].slice(0, PARTICLE_COUNT).map((p) => ({ x: p.x, y: p.y, z: p.z }));
    // Expand lightbulb by 1.25 and rotate -45 degrees around X-axis
    const angle45 = -Math.PI / 4; // -45 degrees in radians
    const cos45 = Math.cos(angle45);
    const sin45 = Math.sin(angle45);
    const sortedLightbulb = [...rawParticles.lightbulb].slice(0, PARTICLE_COUNT).map((p) => {
      const ex = p.x * 1.25;
      const ey = p.y * 1.25;
      const ez = p.z * 1.25;
      return {
        x: ex,
        y: ey * cos45 - ez * sin45,
        z: ey * sin45 + ez * cos45,
      };
    });
    // Programmatic 3D Sphere Generator (100% outline as alternating latitude/longitude lines, no face/surface fill)
    const sortedSphere: { x: number; y: number; z: number }[] = new Array(PARTICLE_COUNT);
    const sphereRadius = 0.45;

    const N_lat = 10; // 10 latitude lines
    const N_lon = 12; // 12 longitude lines

    for (let c = 0; c < 4; c++) {
      const bandStart = c * 1750;

      // Generate all 1750 particles as outlines
      for (let i = 0; i < 1750; i++) {
        let x = 0, y = 0, z = 0;

        if (c === 0 || c === 1) {
          // Latitudes: Color 0 even lines, Color 1 odd lines
          const availableIndices = [];
          for (let k = 1; k <= N_lat; k++) {
            if (c === 0 && k % 2 === 0) availableIndices.push(k);
            if (c === 1 && k % 2 !== 0) availableIndices.push(k);
          }
          const k = availableIndices[i % availableIndices.length];
          const phi = (k / (N_lat + 1)) * Math.PI;
          const theta = Math.random() * Math.PI * 2;

          x = Math.sin(phi) * Math.cos(theta);
          y = Math.cos(phi); // Y is vertical axis
          z = Math.sin(phi) * Math.sin(theta);
        } else {
          // Longitudes: Color 2 even lines, Color 3 odd lines
          const availableIndices = [];
          for (let j = 0; j < N_lon; j++) {
            if (c === 2 && j % 2 === 0) availableIndices.push(j);
            if (c === 3 && j % 2 !== 0) availableIndices.push(j);
          }
          const j = availableIndices[i % availableIndices.length];
          const theta = (j / N_lon) * Math.PI * 2;
          const phi = Math.random() * Math.PI;

          x = Math.sin(phi) * Math.cos(theta);
          y = Math.cos(phi); // Y is vertical axis
          z = Math.sin(phi) * Math.sin(theta);
        }

        // Add noise
        const noise = 0.015;
        x += randomRange(-noise, noise);
        y += randomRange(-noise, noise);
        z += randomRange(-noise, noise);

        sortedSphere[bandStart + i] = {
          x: x * sphereRadius,
          y: y * sphereRadius,
          z: z * sphereRadius
        };
      }
    }

    // 1. Programmatic 3D Cube Generator (hollow, with distinct edge outlines and solid-colored edges)
    const sortedCube: { x: number; y: number; z: number }[] = new Array(PARTICLE_COUNT);
    const fillIndices: number[] = [];
    const fillCoordinates: { x: number; y: number; z: number }[] = [];

    // Define 4 alternate (non-adjacent) corners of the cube to assign adjacent edges to colors
    const corners = [
      { x: 1.0, y: 1.0, z: 1.0 },   // Corner 0
      { x: 1.0, y: -1.0, z: -1.0 }, // Corner 1
      { x: -1.0, y: 1.0, z: -1.0 }, // Corner 2
      { x: -1.0, y: -1.0, z: 1.0 }  // Corner 3
    ];

    // Generate edge and fill coordinates
    for (let c = 0; c < 4; c++) {
      const bandStart = c * 1750;
      const corner = corners[c];

      // A: Generate edge particles (1312 particles)
      for (let i = 0; i < 1312; i++) {
        const edgeIndex = i % 3;
        const t = randomRange(-1.0, 1.0);
        let x = 0, y = 0, z = 0;

        if (edgeIndex === 0) {
          x = t;
          y = corner.y;
          z = corner.z;
        } else if (edgeIndex === 1) {
          x = corner.x;
          y = t;
          z = corner.z;
        } else {
          x = corner.x;
          y = corner.y;
          z = t;
        }

        // Add noise
        const noise = 0.025;
        x += randomRange(-noise, noise);
        y += randomRange(-noise, noise);
        z += randomRange(-noise, noise);

        sortedCube[bandStart + i] = {
          x: x * 0.42,
          y: y * 0.42,
          z: z * 0.42
        };
      }

      // B: Generate fill particles (438 particles)
      for (let i = 1312; i < 1750; i++) {
        const idx = bandStart + i;
        fillIndices.push(idx);

        const face = i % 6;
        let x = randomRange(-1.0, 1.0);
        let y = randomRange(-1.0, 1.0);
        let z = randomRange(-1.0, 1.0);
        if (face === 0) x = -1.0;
        else if (face === 1) x = 1.0;
        else if (face === 2) y = -1.0;
        else if (face === 3) y = 1.0;
        else if (face === 4) z = -1.0;
        else if (face === 5) z = 1.0;

        // Add noise
        const noise = 0.025;
        x += randomRange(-noise, noise);
        y += randomRange(-noise, noise);
        z += randomRange(-noise, noise);

        fillCoordinates.push({
          x: x * 0.42,
          y: y * 0.42,
          z: z * 0.42
        });
      }
    }

    // Shuffle the fill coordinates so that fill colors are randomly mixed and scattered
    for (let i = fillCoordinates.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = fillCoordinates[i];
      fillCoordinates[i] = fillCoordinates[j];
      fillCoordinates[j] = temp;
    }

    // Put shuffled fill coordinates back into their reserved slots in sortedCube
    for (let i = 0; i < fillIndices.length; i++) {
      sortedCube[fillIndices[i]] = fillCoordinates[i];
    }

    // 2. Programmatic 3D Torus Generator (with slight organic noise)
    const sortedTorus: { x: number; y: number; z: number }[] = [];
    const R_torus = 0.75;
    const r_torus = 0.22;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 2;
      let x = (R_torus + r_torus * Math.cos(phi)) * Math.cos(theta);
      let y = (R_torus + r_torus * Math.cos(phi)) * Math.sin(theta);
      let z = r_torus * Math.sin(phi);

      // Add noise
      const noise = 0.02;
      x += randomRange(-noise, noise);
      y += randomRange(-noise, noise);
      z += randomRange(-noise, noise);

      // Rotate by 90 degrees around Y-axis sideways (swap x and z)
      sortedTorus.push({ x: z, y: y * 0.95, z: -x });
    }
    // Shuffle the torus coordinates so that colors are randomly mixed and scattered rather than height-banded
    for (let i = sortedTorus.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = sortedTorus[i];
      sortedTorus[i] = sortedTorus[j];
      sortedTorus[j] = temp;
    }

    // 3. Programmatic DNA Double Helix Generator
    const sortedDNA: { x: number; y: number; z: number }[] = [];
    const helixRadius = 0.52;
    const helixHeight = 1.6;
    const turns = 2.0;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const isStrand = Math.random() < 0.7;
      const strandIndex = i % 2;
      const pct = Math.random();
      const y = pct * helixHeight - (helixHeight / 2);
      const angle = pct * turns * Math.PI * 2 + (strandIndex * Math.PI);
      let x = 0;
      let z = 0;
      if (isStrand) {
        x = Math.cos(angle) * helixRadius;
        z = Math.sin(angle) * helixRadius;
      } else {
        const t_rung = randomRange(-1.0, 1.0);
        x = Math.cos(pct * turns * Math.PI * 2) * helixRadius * t_rung;
        z = Math.sin(pct * turns * Math.PI * 2) * helixRadius * t_rung;
      }
      const n = 0.02;
      sortedDNA.push({
        x: x + randomRange(-n, n),
        y: y + randomRange(-n, n),
        z: z + randomRange(-n, n),
      });
    }

    // 4. Programmatic 3D Octahedron/Pyramid Generator (with distinct edge outlines and solid-colored edges)
    const sortedPyramid: { x: number; y: number; z: number }[] = new Array(PARTICLE_COUNT);
    const pyrScale = 0.85;

    // Vertices of the Octahedron
    const vertices = [
      { x: 1.0, y: 0.0, z: 0.0 },   // V0
      { x: -1.0, y: 0.0, z: 0.0 },  // V1
      { x: 0.0, y: 1.0, z: 0.0 },   // V2
      { x: 0.0, y: -1.0, z: 0.0 },  // V3
      { x: 0.0, y: 0.0, z: 1.0 },   // V4
      { x: 0.0, y: 0.0, z: -1.0 }   // V5
    ];

    // Partition edges into 4 groups of 3 adjacent edges meeting at a vertex:
    const octahedronColorGroups = [
      [[4, 0], [4, 1], [4, 2]], // Group 0 (meets at V4)
      [[5, 0], [5, 1], [5, 3]], // Group 1 (meets at V5)
      [[2, 1], [2, 0], [2, 5]], // Group 2 (meets at V2)
      [[3, 0], [3, 1], [3, 4]]  // Group 3 (meets at V3)
    ];

    const pyrFillIndices: number[] = [];
    const pyrFillCoordinates: { x: number; y: number; z: number }[] = [];

    // Generate edge and fill coordinates for Octahedron
    for (let c = 0; c < 4; c++) {
      const bandStart = c * 1750;

      // A: Generate edge particles (1312 particles)
      for (let i = 0; i < 1312; i++) {
        const edge = octahedronColorGroups[c][i % 3];
        const v1 = vertices[edge[0]];
        const v2 = vertices[edge[1]];
        const t = Math.random();
        let x = v1.x + t * (v2.x - v1.x);
        let y = v1.y + t * (v2.y - v1.y);
        let z = v1.z + t * (v2.z - v1.z);

        // Add noise
        const n = 0.025;
        x += randomRange(-n, n);
        y += randomRange(-n, n);
        z += randomRange(-n, n);

        sortedPyramid[bandStart + i] = {
          x: x * pyrScale,
          y: y * pyrScale,
          z: z * pyrScale
        };
      }

      // B: Generate fill particles (438 particles)
      for (let i = 1312; i < 1750; i++) {
        const idx = bandStart + i;
        pyrFillIndices.push(idx);

        const face = i % 8;
        const xSign = (face & 1) ? 1.0 : -1.0;
        const ySign = (face & 2) ? 1.0 : -1.0;
        const zSign = (face & 4) ? 1.0 : -1.0;
        const A = { x: xSign, y: 0.0, z: 0.0 };
        const B = { x: 0.0, y: ySign, z: 0.0 };
        const C = { x: 0.0, y: 0.0, z: zSign };
        let r1 = Math.random();
        let r2 = Math.random();
        if (r1 + r2 > 1.0) {
          r1 = 1.0 - r1;
          r2 = 1.0 - r2;
        }
        let x = A.x + r1 * (B.x - A.x) + r2 * (C.x - A.x);
        let y = A.y + r1 * (B.y - A.y) + r2 * (C.y - A.y);
        let z = A.z + r1 * (B.z - A.z) + r2 * (C.z - A.z);

        // Add noise
        const n = 0.025;
        x += randomRange(-n, n);
        y += randomRange(-n, n);
        z += randomRange(-n, n);

        pyrFillCoordinates.push({
          x: x * pyrScale,
          y: y * pyrScale,
          z: z * pyrScale
        });
      }
    }

    // Shuffle the fill coordinates so that fill colors are randomly mixed and scattered
    for (let i = pyrFillCoordinates.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = pyrFillCoordinates[i];
      pyrFillCoordinates[i] = pyrFillCoordinates[j];
      pyrFillCoordinates[j] = temp;
    }

    // Put shuffled fill coordinates back into their reserved slots in sortedPyramid
    for (let i = 0; i < pyrFillIndices.length; i++) {
      sortedPyramid[pyrFillIndices[i]] = pyrFillCoordinates[i];
    }


    // 5. Programmatic Trefoil Knot Generator
    const sortedTrefoil: { x: number; y: number; z: number }[] = [];
    const trefoilScale = 0.38;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const t = (i / PARTICLE_COUNT) * Math.PI * 2 * 3;
      const x = Math.sin(t) + 2.0 * Math.sin(2.0 * t);
      const y = Math.cos(t) - 2.0 * Math.cos(2.0 * t);
      const z = -Math.sin(3.0 * t);
      const n = 0.02;
      sortedTrefoil.push({
        x: (x + randomRange(-n, n)) * trefoilScale,
        y: (y + randomRange(-n, n)) * trefoilScale,
        z: (z + randomRange(-n, n)) * trefoilScale,
      });
    }

    // 6. Programmatic 3D Astroid Star Generator
    const sortedAstroid: { x: number; y: number; z: number }[] = [];
    const astroidScale = 0.95;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const u = randomRange(-Math.PI / 2, Math.PI / 2);
      const v = randomRange(-Math.PI, Math.PI);
      const cosU = Math.cos(u);
      const sinU = Math.sin(u);
      const cosV = Math.cos(v);
      const sinV = Math.sin(v);
      const x = cosU * cosU * cosU * cosV * cosV * cosV;
      const y = sinU * sinU * sinU * cosV * cosV * cosV;
      const z = sinV * sinV * sinV;
      const n = 0.02;
      sortedAstroid.push({
        x: (x + randomRange(-n, n)) * astroidScale,
        y: (y + randomRange(-n, n)) * astroidScale,
        z: (z + randomRange(-n, n)) * astroidScale,
      });
    }

    // 10. Programmatic Scattered Generator
    const sortedScattered: { x: number; y: number; z: number }[] = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      sortedScattered.push({
        x: randomRange(-2.0, 2.0),
        y: randomRange(-1.2, 1.2),
        z: randomRange(-0.8, 0.8),
      });
    }
    // Shuffle the scattered coordinates so that colors are randomly mixed and scattered rather than height-banded
    for (let i = sortedScattered.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = sortedScattered[i];
      sortedScattered[i] = sortedScattered[j];
      sortedScattered[j] = temp;
    }

    // 11. Programmatic 3D Email/Envelope Generator
    const sortedEnvelope: { x: number; y: number; z: number }[] = new Array(PARTICLE_COUNT);
    const envFillIndices: number[] = [];
    const envFillCoordinates: { x: number; y: number; z: number }[] = [];

    // Group 0: Flap Diagonals (\/) - Color 1
    const group0Segments = [
      [{ x: -0.7, y: 0.35, z: 0.05 }, { x: 0.0, y: -0.1, z: 0.05 }],
      [{ x: 0.7, y: 0.35, z: 0.05 }, { x: 0.0, y: -0.1, z: 0.05 }],
      [{ x: -0.7, y: 0.35, z: -0.05 }, { x: 0.0, y: -0.1, z: -0.05 }],
      [{ x: 0.7, y: 0.35, z: -0.05 }, { x: 0.0, y: -0.1, z: -0.05 }],
      [{ x: 0.0, y: -0.1, z: -0.05 }, { x: 0.0, y: -0.1, z: 0.05 }]
    ];

    // Group 1: Side Verticals (| |) - Color 2
    const group1Segments = [
      [{ x: -0.7, y: -0.45, z: 0.05 }, { x: -0.7, y: 0.35, z: 0.05 }],
      [{ x: 0.7, y: -0.45, z: 0.05 }, { x: 0.7, y: 0.35, z: 0.05 }],
      [{ x: -0.7, y: -0.45, z: -0.05 }, { x: -0.7, y: 0.35, z: -0.05 }],
      [{ x: 0.7, y: -0.45, z: -0.05 }, { x: 0.7, y: 0.35, z: -0.05 }]
    ];

    // Group 2: Top Outline - Color 3
    const group2Segments = [
      [{ x: -0.7, y: 0.35, z: 0.05 }, { x: 0.7, y: 0.35, z: 0.05 }],
      [{ x: -0.7, y: 0.35, z: -0.05 }, { x: 0.7, y: 0.35, z: -0.05 }],
      [{ x: -0.7, y: 0.35, z: -0.05 }, { x: -0.7, y: 0.35, z: 0.05 }],
      [{ x: 0.7, y: 0.35, z: -0.05 }, { x: 0.7, y: 0.35, z: 0.05 }]
    ];

    // Group 3: Bottom Outline - Color 4
    const group3Segments = [
      [{ x: -0.7, y: -0.45, z: 0.05 }, { x: 0.7, y: -0.45, z: 0.05 }],
      [{ x: -0.7, y: -0.45, z: -0.05 }, { x: 0.7, y: -0.45, z: -0.05 }],
      [{ x: -0.7, y: -0.45, z: -0.05 }, { x: -0.7, y: -0.45, z: 0.05 }],
      [{ x: 0.7, y: -0.45, z: -0.05 }, { x: 0.7, y: -0.45, z: 0.05 }]
    ];

    const allGroupSegments = [group0Segments, group1Segments, group2Segments, group3Segments];

    const tiltAngle = (25 * Math.PI) / 180; // 25 degrees
    const cosTilt = Math.cos(tiltAngle);
    const sinTilt = Math.sin(tiltAngle);

    for (let c = 0; c < 4; c++) {
      const bandStart = c * 1750;
      const segments = allGroupSegments[c];

      // A: Generate outline particles (1312 particles)
      for (let i = 0; i < 1312; i++) {
        const segIndex = i % segments.length;
        const [p1, p2] = segments[segIndex];
        const t_val = Math.random();
        let x = p1.x + t_val * (p2.x - p1.x);
        let y = p1.y + t_val * (p2.y - p1.y);
        let z = p1.z + t_val * (p2.z - p1.z);

        // Add noise
        const noise = 0.015;
        x += randomRange(-noise, noise);
        y += randomRange(-noise, noise);
        z += randomRange(-noise, noise);

        // Swap x and z, then apply Y rotation tilt of 30 degrees so it starts rotated
        sortedEnvelope[bandStart + i] = {
          x: (z * cosTilt + x * sinTilt) * 0.95,
          y: y * 0.95,
          z: (z * sinTilt - x * cosTilt) * 0.95
        };
      }

      // B: Generate body/scattered particles (438 particles)
      for (let i = 1312; i < 1750; i++) {
        const idx = bandStart + i;
        envFillIndices.push(idx);

        // Sample inside the envelope box volume
        let x = randomRange(-0.7, 0.7);
        let y = randomRange(-0.45, 0.35);
        let z = randomRange(-0.05, 0.05);

        // Add scattering noise
        const noise = 0.04;
        x += randomRange(-noise, noise);
        y += randomRange(-noise, noise);
        z += randomRange(-noise, noise);

        envFillCoordinates.push({
          x: (z * cosTilt + x * sinTilt) * 0.95,
          y: y * 0.95,
          z: (z * sinTilt - x * cosTilt) * 0.95
        });
      }
    }

    // Shuffle the fill coordinates so that fill colors are randomly mixed and scattered
    for (let i = envFillCoordinates.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = envFillCoordinates[i];
      envFillCoordinates[i] = envFillCoordinates[j];
      envFillCoordinates[j] = temp;
    }

    // Put shuffled fill coordinates back into their reserved slots in sortedEnvelope
    for (let i = 0; i < envFillIndices.length; i++) {
      sortedEnvelope[envFillIndices[i]] = envFillCoordinates[i];
    }

    // Mathematically center each shape's 3D coordinates on startup (once on initialization)
    [
      sortedBrain,
      sortedScattered,
      sortedDNA,
      sortedPyramid,
      sortedCube,
      sortedTorus,
      sortedTrefoil,
      sortedAstroid,
      sortedEnvelope,
      sortedSphere,
      sortedLightbulb
    ].forEach((shape) => {
      if (!shape || shape.length === 0) return;

      let minY = Infinity;
      let maxY = -Infinity;
      let minX = Infinity;
      let maxX = -Infinity;
      let minZ = Infinity;
      let maxZ = -Infinity;

      for (let i = 0; i < shape.length; i++) {
        const p = shape[i];
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.z < minZ) minZ = p.z;
        if (p.z > maxZ) maxZ = p.z;
      }

      const offsetY = (minY + maxY) / 2;
      const offsetX = (minX + maxX) / 2;
      const offsetZ = (minZ + maxZ) / 2;

      for (let i = 0; i < shape.length; i++) {
        shape[i].x -= offsetX;
        shape[i].y -= offsetY;
        shape[i].z -= offsetZ;
      }
    });

    // Sort coordinates by Y (bottom-to-top) so colors blend beautifully
    sortedBrain.sort((a, b) => a.y - b.y);
    sortedLightbulb.sort((a, b) => a.y - b.y);
    sortedDNA.sort((a, b) => a.y - b.y);
    sortedTrefoil.sort((a, b) => a.y - b.y);
    sortedAstroid.sort((a, b) => a.y - b.y);

    // ─── Init Particles ───────────────────────────────────────────────────
    const particles: ParticleData[] = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: randomRange(0, W),
        y: randomRange(0, H),
        vx: 0,
        vy: 0,
        size: randomRange(1.8, 4.2),
        colorIndex: Math.floor(Math.random() * 4),
        shape: shapes[Math.floor(Math.random() * shapes.length)],
        opacity: randomRange(0.2, 0.95),
        springFactor: randomRange(0.015, 0.04),
        damping: randomRange(0.85, 0.92),
        driftOffset: randomRange(0, 1000),
        scaleFactor: 1.0,
      });
    }

    // Sort particles by color group index to align with depth bands
    particles.sort((a, b) => a.colorIndex - b.colorIndex);

    // Sprite Cache (recreated dynamically when settings.colors change)
    const sprites: { [color: string]: HTMLCanvasElement } = {};
    const spriteSize = 32;
    let activeColors = ["", "", "", ""];

    let lastFrameTime = Date.now();
    let currentScrollRatio = 0;
    let timelineTime = 0;
    const localTimes = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let animId: number;

    // ─── Absorption Particle System ───────────────────────────────────────
    const absorbParticles: Array<{
      x: number; y: number; vx: number; vy: number;
      life: number; size: number; logoX: number; logoY: number;
    }> = [];
    const cardAbsorbed: boolean[] = new Array(8).fill(false);
    let wasInSection0 = true; // used for replay detection

    interface CardData {
      text: string;
      isLoad: boolean;
      redIndex: number; // 0 to 7 for red cards, -1 for green cards
      angle: number;
    }
    const cards: CardData[] = [
      // Row 0 (Top row of stack - all red)
      { text: "Syntax", isLoad: true, redIndex: 3, angle: 0 },
      { text: "Formula", isLoad: true, redIndex: 4, angle: Math.PI * 0.25 },
      { text: "Commands", isLoad: true, redIndex: 5, angle: Math.PI * 1.0 },
      { text: "API Docs", isLoad: true, redIndex: 6, angle: Math.PI * 0.5 },
      { text: "Dates", isLoad: true, redIndex: 7, angle: Math.PI * 0.75 },

      // Row 1 (Middle row of stack - all red)
      { text: "References", isLoad: true, redIndex: 0, angle: Math.PI * 1.25 },
      { text: "Error Codes", isLoad: true, redIndex: 1, angle: Math.PI * 1.5 },
      { text: "Shortcuts", isLoad: true, redIndex: 2, angle: Math.PI * 1.75 },

      // Row 2 (top green row: Reasoning, Strategy, Concepts)
      { text: "Reasoning", isLoad: false, redIndex: -1, angle: 0 },
      { text: "Strategy", isLoad: false, redIndex: -1, angle: 0 },
      { text: "Concepts", isLoad: false, redIndex: -1, angle: 0 },

      // Row 3 (bottom green row: Problem Solving, Creativity, Intuition)
      { text: "Problem Solving", isLoad: false, redIndex: -1, angle: 0 },
      { text: "Creativity", isLoad: false, redIndex: -1, angle: 0 },
      { text: "Intuition", isLoad: false, redIndex: -1, angle: 0 }
    ];

    const neuralWaves: { progress: number; speed: number; intensity: number }[] = [];
    let lastWaveSpawn = 0;

    function animate() {
      ctx!.clearRect(0, 0, W, H);
      const now = Date.now();
      const delta = now - lastFrameTime;
      lastFrameTime = now;
      timelineTime += delta;

      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const targetScrollRatio = scrollHeight > 0 ? scrollTop / scrollHeight : 0;
      currentScrollRatio += (targetScrollRatio - currentScrollRatio) * 0.05;

      const isMobile = W < 768;

      // Real-time configurations from ref
      const currentCount = Math.min(particles.length, settingsRef.current.particleCount);
      // Resolve white/black colors depending on theme to prevent them from disappearing
      const theme = settingsRef.current.theme;
      const currentColors = settingsRef.current.colors.map((c) => {
        const lower = c.trim().toLowerCase();
        if (theme === "white") {
          // If light theme, convert complete white to red
          if (lower === "#ffffff" || lower === "#fff" || lower === "rgb(255,255,255)" || lower === "white") {
            return "#ff0000";
          }
        } else if (theme === "black") {
          // If dark theme, convert complete black to white
          if (lower === "#000000" || lower === "#000" || lower === "rgb(0,0,0)" || lower === "black") {
            return "#ffffff";
          }
        }
        return c;
      }) as [string, string, string, string];
      const stiffnessMultiplier = settingsRef.current.springStiffness / 0.03;
      const dampingMultiplier = settingsRef.current.damping / 0.90;
      const sizeMultiplier = (settingsRef.current.particleSize / 3.0) * (isMobile ? 0.90 : 1.0);

      // ─── Sprite Cache Sync ────────────────────────────────────────────────
      let colorsChanged = false;
      for (let c = 0; c < 4; c++) {
        if (currentColors[c] !== activeColors[c]) {
          colorsChanged = true;
          break;
        }
      }

      if (colorsChanged) {
        activeColors = [...currentColors];
        currentColors.forEach((color) => {
          const offscreen = sprites[color] || document.createElement("canvas");
          offscreen.width = spriteSize;
          offscreen.height = spriteSize;
          const octx = offscreen.getContext("2d");
          if (octx) {
            octx.clearRect(0, 0, spriteSize, spriteSize);
            const r = spriteSize / 2;
            const grad = octx.createRadialGradient(
              r - r * 0.3,
              r - r * 0.3,
              r * 0.1,
              r,
              r,
              r
            );
            grad.addColorStop(0, "#ffffff");
            grad.addColorStop(0.15, color);
            grad.addColorStop(0.95, color);
            grad.addColorStop(1.0, "rgba(0, 0, 0, 0)");

            octx.fillStyle = grad;
            octx.beginPath();
            octx.arc(r, r, r, 0, Math.PI * 2);
            octx.fill();
          }
          sprites[color] = offscreen;
        });
      }

      const configs = [
        { cx: isMobile ? W * 0.5 : W * 0.72, cy: H * 0.5, scale: isMobile ? 360 : 550 }, // Brain (Right)
        { cx: isMobile ? W * 0.5 : W * 0.5, cy: H * 0.5, scale: isMobile ? 288 : 445 },  // Scattered (Center)
        { cx: isMobile ? W * 0.5 : W * 0.72, cy: H * 0.5, scale: isMobile ? 270 : 420 }, // DNA Helix (Right)
        { cx: isMobile ? W * 0.5 : W * 0.28, cy: H * 0.5, scale: isMobile ? 270 : 388.5 }, // Octahedron (Left) - Desktop reduced by 7.5%
        { cx: isMobile ? W * 0.5 : W * 0.72, cy: H * 0.5, scale: isMobile ? 198 : 330 }, // Cube (Right)
        { cx: isMobile ? W * 0.5 : W * 0.28, cy: H * 0.5, scale: isMobile ? 216 : 356.4 }, // Torus (Left, rotated sideways) - Desktop reduced by 1%
        { cx: isMobile ? W * 0.5 : W * 0.72, cy: H * 0.5, scale: isMobile ? 270 : 315 }, // Trefoil Knot (Right) - Desktop reduced by 25%
        { cx: isMobile ? W * 0.5 : W * 0.28, cy: H * 0.5, scale: isMobile ? 270 : 357 }, // Astroid Star (Left) - Desktop reduced by 15%
        { cx: isMobile ? W * 0.5 : W * 0.28, cy: H * 0.5, scale: isMobile ? 288 : 445 }, // Email Envelope (Left)
        { cx: isMobile ? W * 0.5 : W * 0.5, cy: H * 0.5, scale: isMobile ? 342 : 520 },  // Sphere (Center)
        { cx: isMobile ? W * 0.5 : W * 0.28, cy: H * 0.5, scale: isMobile ? 288 : 445 }, // Lightbulb (Left)
      ];

      // ─── Math for Multisection Morphing ──────────────────────────────────
      const shapesList = [
        sortedBrain,
        sortedScattered,
        sortedDNA,
        sortedPyramid,
        sortedCube,
        sortedTorus,
        sortedTrefoil,
        sortedAstroid,
        sortedEnvelope,
        sortedSphere,
        sortedLightbulb
      ];
      const K = shapesList.length; // 11
      const N = K - 1; // 10

      const scaledRatio = currentScrollRatio * N;
      let index = Math.floor(scaledRatio);
      let t = scaledRatio - index;

      if (index >= N) {
        index = N - 1;
        t = 1.0;
      } else if (index < 0) {
        index = 0;
        t = 0.0;
      }

      if (index !== 0) {
        const heroContentEl = document.querySelector('.hero-experiment-wrapper .hero-content') as HTMLElement;
        if (heroContentEl) {
          heroContentEl.style.transform = '';
        }
      }

      // Scroll Snap Dead Zone curve
      if (settingsRef.current.deadZoneEnabled) {
        const p = settingsRef.current.deadZonePercentage / 100;
        const halfP = p / 2;
        if (t < halfP) {
          t = 0;
        } else if (t > 1 - halfP) {
          t = 1;
        } else {
          t = (t - halfP) / (1 - p);
        }
      }

      // Interpolate center and scale between the two active shapes
      const conf1 = configs[index];
      const conf2 = configs[index + 1] || conf1;

      const cx = lerp(conf1.cx, conf2.cx, t);
      const cy = lerp(conf1.cy, conf2.cy, t);
      const baseScale = lerp(conf1.scale, conf2.scale, t);

      // Track mouse velocity
      if (mouse.active) {
        if (prevMouseX !== -1000) {
          mouseVx = mouse.x - prevMouseX;
          mouseVy = mouse.y - prevMouseY;
        }
        prevMouseX = mouse.x;
        prevMouseY = mouse.y;
      } else {
        mouseVx = 0;
        mouseVy = 0;
        prevMouseX = -1000;
        prevMouseY = -1000;
      }

      let targetInfluenceX = 0;
      let targetInfluenceY = 0;
      if (hasGyro && settingsRef.current.gyroEnabled) {
        // gyroscope influence
        targetInfluenceX = gyroX;
        targetInfluenceY = gyroY;
      } else if (mouse.active) {
        // 3× mouse hover influence
        targetInfluenceX = ((mouse.x - W / 2) / (W / 2)) * 0.24;
        targetInfluenceY = ((mouse.y - H / 2) / (H / 2)) * 0.18;
      }
      mouseInfluenceX += (targetInfluenceX - mouseInfluenceX) * 0.05;
      mouseInfluenceY += (targetInfluenceY - mouseInfluenceY) * 0.05;

      // Offsets for [rotateX, rotateY, rotateZ] for each of the 11 shapes:
      // Index 1 (Lightbulb): -30 degrees (-0.5236 rad) Y-rotation offset
      // Index 4 (Cube): +15 degrees (+0.2618 rad) X-rotation offset, +30 degrees (+0.5236 rad) Y-rotation offset
      // Index 5 (Torus): +25 degrees (+0.4363 rad) Y-rotation offset
      // Index 6 (Trefoil Knot): +100 degrees (+1.7453 rad) Y-rotation offset
      const shapeOffsets = [
        { rx: 0, ry: 0, rz: 0 },         // 0: Brain
        { rx: 0, ry: 0, rz: 0 },         // 1: Scattered
        { rx: 0, ry: 0, rz: 0 },         // 2: DNA
        { rx: 0, ry: 0, rz: 0 },         // 3: Octahedron
        { rx: 0.2618, ry: 0.5236, rz: 0 },// 4: Cube
        { rx: 0, ry: 0.4363, rz: 0 },    // 5: Torus
        { rx: 0, ry: 1.7453, rz: 0 },    // 6: Trefoil Knot
        { rx: 0, ry: 0, rz: 0 },         // 7: Astroid
        { rx: 0, ry: 0, rz: 0 },         // 8: Envelope
        { rx: 0, ry: 0, rz: 0 },         // 9: Sphere
        { rx: 0, ry: -0.5236, rz: 0 }    // 10: Lightbulb
      ];

      const desktopSizeReductions = [
        1.0,   // 0: Brain
        1.0,   // 1: Scattered
        1.0,   // 2: DNA
        0.925, // 3: Octahedron (7.5% reduction)
        1.0,   // 4: Cube
        0.99,  // 5: Torus (1% reduction)
        0.75,  // 6: Trefoil (25% reduction)
        0.85,  // 7: Astroid (15% reduction)
        1.0,   // 8: Envelope
        1.0,   // 9: Sphere
        1.0    // 10: Lightbulb
      ];

      const r1_size = desktopSizeReductions[index];
      const r2_size = desktopSizeReductions[index + 1] || r1_size;
      const desktopSizeScale = isMobile ? 1.0 : lerp(r1_size, r2_size, t);

      // Update local timers for all shapes based on active/inactive states
      for (let i = 0; i < 11; i++) {
        const active = (i === index && t < 1) || (i === index + 1 && t > 0);
        if (active) {
          localTimes[i] += delta;
        } else {
          localTimes[i] = 0;
        }
      }

      const off1 = shapeOffsets[index];
      const off2 = shapeOffsets[index + 1] || off1;

      const t1 = localTimes[index] * 0.00015 * settingsRef.current.autoRotateSpeed;
      const ry1 = 1.60 + off1.ry + t1 * 0.12 + mouseInfluenceX;
      const rx1 = 0.25 + off1.rx + Math.sin(t1 * 0.15) * 0.05 + mouseInfluenceY;
      const rz1 = off1.rz + Math.cos(t1 * 0.12) * 0.03;

      const t2 = localTimes[index + 1] * 0.00015 * settingsRef.current.autoRotateSpeed;
      const ry2 = 1.60 + off2.ry + t2 * 0.12 + mouseInfluenceX;
      const rx2 = 0.25 + off2.rx + Math.sin(t2 * 0.15) * 0.05 + mouseInfluenceY;
      const rz2 = off2.rz + Math.cos(t2 * 0.12) * 0.03;

      const rotateY = lerp(ry1, ry2, t);
      const rotateX = lerp(rx1, rx2, t);
      const rotateZ = lerp(rz1, rz2, t);

      // Timeline constants for cards and brain activation
      const START_DRIFT_TIME = 3000;        // 1-second hold before first card moves
      const CARD_DRIFT_INTERVAL = 900;       // deliberate one-by-one stagger
      const DRIFT_DURATION = 1500;
      const ROW1_END_TIME = START_DRIFT_TIME + 2 * CARD_DRIFT_INTERVAL + DRIFT_DURATION; // 6300ms
      const ROW0_START_TIME = ROW1_END_TIME; // 6300ms
      const ALL_DRIFTED_TIME = ROW0_START_TIME + 4 * CARD_DRIFT_INTERVAL + DRIFT_DURATION; // 11400ms
      // ELEVATED starts when 2 cards have been fully absorbed (card redIndex 1 done)
      const ELEVATED_START_TIME = START_DRIFT_TIME + 1 * CARD_DRIFT_INTERVAL + DRIFT_DURATION; // 5400ms

      const brainTransitionT = Math.min(1.0, Math.max(0.0, (timelineTime - ALL_DRIFTED_TIME) / 1000));
      const brainActiveFactor = (index === 0 ? (1.0 - t) : 0) * brainTransitionT;

      // ─── Replay detection: reset when user scrolls back into hero ────────────
      const isNowInSection0 = index === 0 && t < 0.05;
      if (isNowInSection0 && !wasInSection0) {
        timelineTime = 0;
        cardAbsorbed.fill(false);
        absorbParticles.length = 0;
      }
      wasInSection0 = isNowInSection0;

      // Dim, slow brain pulse on size and opacity
      const pulseSizeFactor = 1.0 + Math.sin(now * 0.002) * 0.12 * brainActiveFactor;
      const pulseOpacityFactor = 1.0 + Math.sin(now * 0.002) * 0.18 * brainActiveFactor;

      // Spawn neural waves if brain is active and fully transitioned
      if (index === 0 && brainTransitionT > 0.0 && now - lastWaveSpawn > 800) {
        neuralWaves.push({ progress: 0.0, speed: 0.025, intensity: 1.2 });
        lastWaveSpawn = now;
      }

      // Update neural waves
      for (let w = neuralWaves.length - 1; w >= 0; w--) {
        neuralWaves[w].progress += neuralWaves[w].speed;
        if (neuralWaves[w].progress > 1.0) {
          neuralWaves.splice(w, 1);
        }
      }

      // ─── Update Loop ──────────────────────────────────────────────────────
      for (let i = 0; i < currentCount; i++) {
        const p = particles[i];

        const pt1 = shapesList[index][i] || { x: 0, y: 0, z: 0 };
        const pt2 = shapesList[index + 1]?.[i] || pt1;

        const rx = lerp(pt1.x, pt2.x, t);
        const ry = lerp(pt1.y, pt2.y, t);
        const rz = lerp(pt1.z, pt2.z, t);
        p.tempY = ry;

        // 3D Rotation Matrices
        const cosY = Math.cos(rotateY);
        const sinY = Math.sin(rotateY);
        const x1 = rx * cosY - rz * sinY;
        const z1 = rx * sinY + rz * cosY;

        const cosX = Math.cos(rotateX);
        const sinX = Math.sin(rotateX);
        const y1 = ry * cosX - z1 * sinX;
        const z2 = ry * sinX + z1 * cosX;

        const cosZ = Math.cos(rotateZ);
        const sinZ = Math.sin(rotateZ);
        const x2 = x1 * cosZ - y1 * sinZ;
        const y2 = x1 * sinZ + y1 * cosZ;

        // Perspective Projection
        const fov = 400;
        const perspective = fov / Math.max(50, fov + z2 * 250);
        p.scaleFactor = perspective;

        const scale = baseScale * perspective;
        const targetX = cx + x2 * scale;
        let targetY = cy - y2 * scale;

        // Wave drift in Scattered phase (Index 0 to 1 transition)
        if (index === 0) {
          const waveTime = Date.now() * 0.001 + p.driftOffset;
          targetY += Math.sin(waveTime) * 15 * t;
        }

        // Spring Physics
        const ax = (targetX - p.x) * p.springFactor * stiffnessMultiplier;
        const ay = (targetY - p.y) * p.springFactor * stiffnessMultiplier;
        p.vx = (p.vx + ax) * p.damping * dampingMultiplier;
        p.vy = (p.vy + ay) * p.damping * dampingMultiplier;

        p.x += p.vx;
        p.y += p.vy;

        // Proximity-based Mouse Interaction Modes
        if (mouse.active && settingsRef.current.interactionMode !== "disabled") {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const radius = settingsRef.current.interactionRadius;

          if (dist < radius && dist > 0) {
            const factor = (radius - dist) / radius;
            const smoothFactor = factor * factor * (3 - 2 * factor);
            const force = smoothFactor * settingsRef.current.interactionForce;

            const mode = settingsRef.current.interactionMode;
            if (mode === "repel") {
              p.vx += (dx / dist) * force * 0.4;
              p.vy += (dy / dist) * force * 0.4;
            } else if (mode === "attract") {
              p.vx -= (dx / dist) * force * 0.4;
              p.vy -= (dy / dist) * force * 0.4;
            } else if (mode === "swarm") {
              // Orbit velocity + slight gravity pull towards center
              p.vx += (-dy / dist) * force * 0.5 - (dx / dist) * force * 0.08;
              p.vy += (dx / dist) * force * 0.5 - (dy / dist) * force * 0.08;
            } else if (mode === "ripple") {
              // Proximity Breathing wave ripple
              const waveTime = Date.now() * 0.005 + p.driftOffset;
              const waveX = Math.sin(waveTime) * (1.0 + Math.abs(mouseVx) * 0.8) * force * smoothFactor;
              const waveY = Math.cos(waveTime) * (1.0 + Math.abs(mouseVy) * 0.8) * force * smoothFactor;
              p.x += waveX;
              p.y += waveY;
            }
          }
        }
      }

      // ─── Render circular particles (spheres sprites) ──────────────────────
      for (let i = 0; i < currentCount; i++) {
        const p = particles[i];
        if (p.shape !== "circle") continue;

        let colorHex = currentColors[p.colorIndex];
        let particleSizeMultiplier = 1.0;

        // Neural waves logic on active brain (Shape 0)
        if (index === 0 && p.tempY !== undefined) {
          // Brain Y coordinates range from roughly -0.65 to 0.65 after centering
          const normY = (p.tempY + 0.65) / 1.3;
          for (let w = 0; w < neuralWaves.length; w++) {
            const wave = neuralWaves[w];
            const dist = Math.abs(normY - wave.progress);
            if (dist < 0.08) {
              const factor = (0.08 - dist) / 0.08;
              colorHex = "#22d3ee"; // glowing cyan
              particleSizeMultiplier = 1.0 + factor * 1.5;
            }
          }
        }

        ctx!.globalAlpha = Math.min(1.0, p.opacity * settingsRef.current.particleOpacity * pulseOpacityFactor);
        const size = p.size * p.scaleFactor * sizeMultiplier * desktopSizeScale * pulseSizeFactor * particleSizeMultiplier;
        let sprite = sprites[colorHex];
        if (!sprite) {
          const offscreen = document.createElement("canvas");
          offscreen.width = spriteSize;
          offscreen.height = spriteSize;
          const octx = offscreen.getContext("2d");
          if (octx) {
            octx.clearRect(0, 0, spriteSize, spriteSize);
            const r = spriteSize / 2;
            const grad = octx.createRadialGradient(
              r - r * 0.3,
              r - r * 0.3,
              r * 0.1,
              r,
              r,
              r
            );
            grad.addColorStop(0, "#ffffff");
            grad.addColorStop(0.15, colorHex);
            grad.addColorStop(0.95, colorHex);
            grad.addColorStop(1.0, "rgba(0, 0, 0, 0)");
            octx.fillStyle = grad;
            octx.beginPath();
            octx.arc(r, r, r, 0, Math.PI * 2);
            octx.fill();
          }
          sprites[colorHex] = offscreen;
          sprite = offscreen;
        }
        if (sprite) {
          ctx!.drawImage(
            sprite,
            p.x - size / 2,
            p.y - size / 2,
            size,
            size
          );
        }
      }

      // ─── Render vector particles (triangle, diamond, square) ──────────────
      ctx!.globalAlpha = 0.68 * settingsRef.current.particleOpacity * pulseOpacityFactor;

      for (let c = 0; c < 4; c++) {
        const colorHex = currentColors[c];

        shapes.forEach((shape) => {
          if (shape === "circle") return;

          ctx!.fillStyle = colorHex;
          ctx!.beginPath();

          for (let i = 0; i < currentCount; i++) {
            const p = particles[i];
            if (p.colorIndex !== c || p.shape !== shape) continue;

            const size = p.size * p.scaleFactor * sizeMultiplier * desktopSizeScale * pulseSizeFactor;
            const halfSize = size / 2;

            switch (shape) {
              case "triangle":
                ctx!.moveTo(p.x, p.y - halfSize);
                ctx!.lineTo(p.x - halfSize, p.y + halfSize);
                ctx!.lineTo(p.x + halfSize, p.y + halfSize);
                ctx!.closePath();
                break;
              case "diamond":
                ctx!.moveTo(p.x, p.y - halfSize);
                ctx!.lineTo(p.x + halfSize, p.y);
                ctx!.lineTo(p.x, p.y + halfSize);
                ctx!.lineTo(p.x - halfSize, p.y);
                ctx!.closePath();
                break;
              case "square":
                ctx!.rect(p.x - halfSize, p.y - halfSize, size, size);
                break;
            }
          }

          ctx!.fill();
        });
      }

      // ─── Render HUD & Flanking/Stacked Cards (Only in Section 0) ──────────
      if (index === 0) {
        const hudX = isMobile ? W * 0.5 : W * 0.72;
        const baseFontSize = isMobile ? 10.3 : 13; // +8% card size
        const baseRectHeight = baseFontSize + baseFontSize * 0.9;
        const hGap = isMobile ? 8 : 12;
        const vGap = isMobile ? 8 : 12;
        const hudHeight = isMobile ? 26 : 30; // +8% for readability
        const rowHeight = baseRectHeight + vGap;
        // Calculate step-based row absorption:
        // Row 1 finishes absorption at 6300ms. Shift starts at 6300ms and finishes at 7300ms
        const row1AbsorbedT = Math.min(1.0, Math.max(0.0, (timelineTime - 6300) / 1000));
        // Row 0 finishes absorption at 11400ms. Shift starts at 11400ms and finishes at 12400ms
        const row0AbsorbedT = Math.min(1.0, Math.max(0.0, (timelineTime - 11400) / 1000));

        // Total shift progress (0.0 to 1.0)
        const shiftUpT = (row0AbsorbedT + row1AbsorbedT) / 2;

        // Get Logo & Subtext elements
        const logoEl = document.querySelector('.hero-experiment-wrapper .hero-logo');
        const subtextEl = document.querySelector('.hero-experiment-wrapper .hero-subtext');
        const heroContentEl = document.querySelector('.hero-experiment-wrapper .hero-content') as HTMLElement;

        let logoX = isMobile ? W * 0.5 : W * 0.25; // fallback center of left 50%
        let logoY = isMobile ? H * 0.22 : H * 0.5; // fallback center vertically
        if (logoEl) {
          const rect = logoEl.getBoundingClientRect();
          logoX = rect.left + rect.width / 2;
          logoY = rect.top + rect.height / 2;
        }

        // Bounding boxes for mobile vertical centering
        // To avoid coordinate feedback loops in requestAnimationFrame:
        // temporarily reset transform before reading untransformed bounds
        if (heroContentEl) {
          heroContentEl.style.transform = '';
        }

        let subtextBottom = H * 0.65; // fallback
        if (subtextEl) {
          const rect = subtextEl.getBoundingClientRect();
          subtextBottom = rect.bottom;
        }

        // Translate the DOM element on mobile to center the combined DOM + Canvas elements
        if (heroContentEl && isMobile) {
          const activeRowsCount = 4 - 2 * shiftUpT;
          const canvasHeight = activeRowsCount * rowHeight;
          const domShiftUp = canvasHeight / 2;
          heroContentEl.style.transform = `translateY(-${domShiftUp}px)`;
          subtextBottom -= domShiftUp;
        }

        // Calculate HUD Y position:
        let hudY = 0;
        if (isMobile) {
          const activeRowsCount = 4 - 2 * shiftUpT;
          hudY = subtextBottom + 12 + activeRowsCount * rowHeight + hudHeight / 2;
        } else {
          const footerElHud = document.querySelector('.persistent-footer');
          let footerTop = H - 62;
          if (footerElHud) {
            const footerRect = footerElHud.getBoundingClientRect();
            footerTop = footerRect.top;
          }
          hudY = (footerTop - 26) - rowHeight * (row0AbsorbedT + row1AbsorbedT);
        }

        // Calculate logo attraction glow strength based on drifting bad cards
        let logoGlowStrength = 0;
        cards.forEach((c) => {
          if (c.isLoad && c.redIndex >= 0) {
            let st = 0;
            if (c.redIndex < 3) {
              st = START_DRIFT_TIME + c.redIndex * CARD_DRIFT_INTERVAL;
            } else {
              st = ROW0_START_TIME + (c.redIndex - 3) * CARD_DRIFT_INTERVAL;
            }
            const et = st + DRIFT_DURATION;
            if (timelineTime > st && timelineTime < et) {
              const progress = (timelineTime - st) / DRIFT_DURATION;
              logoGlowStrength += Math.sin(progress * Math.PI) * 0.78; // peak contribution
            }
          }
        });
        logoGlowStrength = Math.min(1.0, logoGlowStrength);
        // After all cards absorbed: hold full glow for 5 s, then fade over 1.5 s
        const GLOW_HOLD_MS = 5000;
        const GLOW_FADE_MS = 1500;
        const postOptimal = timelineTime - ALL_DRIFTED_TIME;
        if (postOptimal >= 0) {
          if (postOptimal < GLOW_HOLD_MS) {
            logoGlowStrength = 1.0;
          } else {
            const fadeT = Math.min(1.0, (postOptimal - GLOW_HOLD_MS) / GLOW_FADE_MS);
            logoGlowStrength = Math.max(logoGlowStrength, 1.0 - fadeT);
          }
        }

        // Apply silhouette glow directly to logo DOM element
        if (logoEl) {
          if (logoGlowStrength > 0.01) {
            const pxBlur = logoGlowStrength * (isMobile ? 12 : 22);
            (logoEl as HTMLImageElement).style.filter = `drop-shadow(0 0 ${pxBlur}px rgba(34, 211, 238, ${logoGlowStrength * 0.85}))`;
          } else {
            (logoEl as HTMLImageElement).style.filter = '';
          }
        }

        // 3-phase brain meter: OVERLOAD → ELEVATED (after 2 absorbed) → OPTIMAL
        const isOverloaded = timelineTime < ELEVATED_START_TIME;
        const isOptimal = timelineTime >= ALL_DRIFTED_TIME;
        const isElevated = !isOverloaded && !isOptimal;
        const blinkOpacity = 0.35 + Math.abs(Math.sin(now * 0.003)) * 0.65;

        const phaseColor = isOverloaded ? '#ef4444' : isElevated ? '#f59e0b' : '#22c55e';
        const dotColor = isOverloaded
          ? `rgba(239, 68, 68, ${blinkOpacity})`
          : isElevated
            ? `rgba(245, 158, 11, ${blinkOpacity})`
            : `rgba(34, 197, 94, ${blinkOpacity})`;
        const dotGlowColor = isOverloaded
          ? `rgba(239, 68, 68, ${blinkOpacity * 0.4})`
          : isElevated
            ? `rgba(245, 158, 11, ${blinkOpacity * 0.4})`
            : `rgba(34, 197, 94, ${blinkOpacity * 0.4})`;

        const statusText = isOverloaded ? 'OVERLOAD' : isElevated ? 'ELEVATED' : 'OPTIMAL';
        const statusColor = phaseColor;

        // Draw HUD container background
        ctx!.font = `600 ${isMobile ? 10 : 12}px 'Outfit', 'Inter', system-ui, sans-serif`;
        const hudLabel = "Cognitive Function: ";
        const labelWidth = ctx!.measureText(hudLabel).width;
        const statusWidth = ctx!.measureText(statusText).width;
        const hudTotalWidth = 24 + labelWidth + statusWidth;

        const hx = hudX - hudTotalWidth / 2;
        const hy = hudY - hudHeight / 2;

        ctx!.globalAlpha = (1.0 - t) * settingsRef.current.particleOpacity;
        ctx!.fillStyle = theme === "black" ? "rgba(10, 10, 12, 0.75)" : "rgba(255, 255, 255, 0.85)";
        ctx!.strokeStyle = theme === "black" ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)";
        ctx!.beginPath();
        ctx!.roundRect(hx, hy, hudTotalWidth, hudHeight, hudHeight * 0.5);
        ctx!.fill();
        ctx!.stroke();

        // Draw Blinking Dot
        ctx!.fillStyle = dotColor;
        ctx!.beginPath();
        ctx!.arc(hx + 12, hudY, isMobile ? 3 : 4, 0, Math.PI * 2);
        ctx!.fill();
        // Dot Glow
        ctx!.shadowColor = phaseColor;
        ctx!.shadowBlur = 8;
        ctx!.fillStyle = dotGlowColor;
        ctx!.beginPath();
        ctx!.arc(hx + 12, hudY, isMobile ? 5 : 6, 0, Math.PI * 2);
        ctx!.fill();
        ctx!.shadowBlur = 0; // reset

        // Draw Label Text
        ctx!.fillStyle = theme === "black" ? "#9ca3af" : "#4b5563";
        ctx!.textBaseline = "middle";
        ctx!.textAlign = "left";
        ctx!.fillText(hudLabel, hx + 22, hudY);

        // Draw Status Value
        ctx!.fillStyle = statusColor;
        ctx!.fillText(statusText, hx + 22 + labelWidth, hudY);

        // Precalculate stacked card coordinates in horizontally centered rows
        const stackCoords: { x: number; y: number }[] = [];
        const rowIndices = [[0, 1, 2, 3, 4], [5, 6, 7], [8, 9, 10], [11, 12, 13]];

        ctx!.font = `600 ${Math.round(baseFontSize)}px 'Outfit', 'Inter', system-ui, sans-serif`;

        rowIndices.forEach((row, r) => {
          let rowY = 0;
          if (isMobile) {
            // Mobile: stack starts at subtextBottom + 12 and stacks downward.
            // When red rows (r=0, 1) disappear, the green rows (r=2, 3) slide up.
            const shiftOffset = (r >= 2) ? (2 * rowHeight * shiftUpT) : 0;
            rowY = subtextBottom + 12 + r * rowHeight + 0.5 * baseRectHeight - shiftOffset;
          } else {
            // Desktop: stack starts at hudY_desktop and stacks upward.
            const footerElCards = document.querySelector('.persistent-footer');
            let footerTop = H - 62;
            if (footerElCards) {
              const footerRect = footerElCards.getBoundingClientRect();
              footerTop = footerRect.top;
            }
            const baseDesktopY = footerTop - 26;
            if (r === 0) {
              rowY = baseDesktopY - 4 * rowHeight;
            } else if (r === 1) {
              rowY = baseDesktopY - 3 * rowHeight;
            } else if (r === 2) {
              rowY = baseDesktopY - 2 * rowHeight - 2 * rowHeight * shiftUpT;
            } else { // r === 3
              rowY = baseDesktopY - 1 * rowHeight - 2 * rowHeight * shiftUpT;
            }
          }

          let rowWidth = 0;
          const cardWidths = row.map((idx) => {
            const txtWidth = ctx!.measureText(cards[idx].text).width;
            const w = txtWidth + baseFontSize * 1.3;
            rowWidth += w;
            return w;
          });
          rowWidth += (row.length - 1) * hGap;

          let currentX = hudX - rowWidth / 2;
          row.forEach((idx, colIndex) => {
            const w = cardWidths[colIndex];
            stackCoords[idx] = {
              x: currentX + w / 2,
              y: rowY
            };
            currentX += w + hGap;
          });
        });


        cards.forEach((card, i) => {
          let t_card = 0.0;
          // If it is a load card (redIndex >= 0), it drifts based on its timeline slot
          if (card.isLoad && card.redIndex >= 0) {
            let startTime = 0;
            if (card.redIndex < 3) {
              startTime = START_DRIFT_TIME + card.redIndex * CARD_DRIFT_INTERVAL;
            } else {
              startTime = ROW0_START_TIME + (card.redIndex - 3) * CARD_DRIFT_INTERVAL;
            }
            const endTime = startTime + DRIFT_DURATION;
            if (timelineTime >= endTime) {
              t_card = 1.0;
            } else if (timelineTime > startTime) {
              t_card = (timelineTime - startTime) / DRIFT_DURATION;
            }
          }

          // Smoothstep easing
          const easeT = t_card * t_card * (3 - 2 * t_card);

          // Get coordinates
          const stackX = stackCoords[i].x;
          const stackY = stackCoords[i].y;

          // Burst landing position: alternates left/right of logo based on redIndex
          let burstX = stackX;
          let burstY = stackY;
          if (card.isLoad && card.redIndex >= 0) {
            const isLeft = card.redIndex % 2 === 0;
            const burstOffset = isMobile ? W * 0.20 : 145;
            burstX = isLeft ? logoX - burstOffset : logoX + burstOffset;
            // Slight Y spread so simultaneous bursts don't overlap
            burstY = logoY + (Math.floor(card.redIndex / 2) - 1.5) * (isMobile ? 22 : 32);
          }

          // Arced flight path: card lifts upward at midpoint, lands at burst position
          const arcLift = Math.sin(easeT * Math.PI) * (isMobile ? 32 : 63);
          const screenX = lerp(stackX, burstX, easeT);
          const screenY = lerp(stackY, burstY, easeT) - arcLift;

          // Card fades out as it reaches the logo (alpha drops over final 30% of journey)
          const cardAlpha = easeT > 0.7 ? (1.0 - easeT) / 0.3 : 1.0;

          // Card size stays constant during flight (+8% base)
          const fontSize = isMobile ? 10.3 : 13;

          // Draw card only if not yet absorbed (t_card < 1)
          if (t_card < 1.0 && screenX >= -100 && screenX <= W + 100 && screenY >= -100 && screenY <= H + 100) {
            ctx!.font = `600 ${Math.round(fontSize)}px 'Outfit', 'Inter', system-ui, sans-serif`;
            const textWidth = ctx!.measureText(card.text).width;
            const px = fontSize * 0.65;
            const py = fontSize * 0.45;
            const rectWidth = textWidth + px * 2;
            const rectHeight = fontSize + py * 2;

            const rx = screenX - rectWidth / 2;
            const ry = screenY - rectHeight / 2;

            // Global alpha: scroll fade × card fade-out on approach to logo
            ctx!.globalAlpha = (1.0 - t) * settingsRef.current.particleOpacity * cardAlpha;

            // Background rounded rect style
            ctx!.fillStyle = theme === "black" ? "rgba(10, 10, 12, 0.78)" : "rgba(255, 255, 255, 0.88)";

            // Border: cyan glow that intensifies as the card approaches the logo
            const isTransitioning = t_card > 0.0 && t_card < 1.0;
            if (isTransitioning) {
              const cyanAlpha = 0.30 + easeT * 0.55;
              ctx!.strokeStyle = `rgba(34, 211, 238, ${cyanAlpha})`;
              ctx!.shadowColor = '#22d3ee';
              ctx!.shadowBlur = 5 + easeT * 14;
            } else {
              ctx!.strokeStyle = card.isLoad ? 'rgba(239, 68, 68, 0.35)' : 'rgba(34, 197, 94, 0.35)';
            }

            ctx!.lineWidth = 1.0;
            ctx!.beginPath();
            ctx!.roundRect(rx, ry, rectWidth, rectHeight, fontSize * 0.5);
            ctx!.fill();
            ctx!.stroke();
            ctx!.shadowBlur = 0; // reset glow

            // Text color stays consistent — no flash during pull
            ctx!.fillStyle = card.isLoad ? '#f87171' : '#4ade80';

            ctx!.textBaseline = "middle";
            ctx!.textAlign = "center";
            ctx!.fillText(card.text, screenX, screenY + 0.5);
          }

          // Spawn absorption burst at the burst position (left/right of logo) when card fully arrives
          if (card.isLoad && card.redIndex >= 0 && t_card >= 1.0 && !cardAbsorbed[card.redIndex]) {
            cardAbsorbed[card.redIndex] = true;
            // Burst origin is where the card dissolved (beside the logo, not behind it)
            for (let ap = 0; ap < 30; ap++) {
              const angle = (ap / 30) * Math.PI * 2 + Math.random() * 0.4;
              const spd = 1.8 + Math.random() * 3.5;
              absorbParticles.push({
                x: burstX + (Math.random() - 0.5) * 22,
                y: burstY + (Math.random() - 0.5) * 22,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd,
                life: 1.0,
                size: 2.0 + Math.random() * 3.0,
                logoX,
                logoY,
              });
            }
          }
        });

        // ─── Render Absorption Particles ─────────────────────────────────────
        // 3-phase over ~2200ms:
        //   Phase 1 (life > 0.62): scatter outward, decelerating
        //   Phase 2 (0.28 < life ≤ 0.62): slow drift / hang in air
        //   Phase 3 (life ≤ 0.28): gradually pull toward logo center
        for (let ap = absorbParticles.length - 1; ap >= 0; ap--) {
          const abp = absorbParticles[ap];
          abp.life -= delta / 2200; // ~2200 ms total lifetime
          if (abp.life <= 0) { absorbParticles.splice(ap, 1); continue; }

          if (abp.life > 0.62) {
            // Phase 1: burst outward, decelerating
            abp.vx *= 0.90;
            abp.vy *= 0.90;
          } else if (abp.life > 0.28) {
            // Phase 2: slow drift — particles hang and scatter lightly
            abp.vx *= 0.94;
            abp.vy *= 0.94;
            // Small turbulence so they don't look frozen
            abp.vx += (Math.random() - 0.5) * 0.15;
            abp.vy += (Math.random() - 0.5) * 0.15;
          } else {
            // Phase 3: gradually attract to logo center, accelerating as they approach
            const dxL = abp.logoX - abp.x;
            const dyL = abp.logoY - abp.y;
            const dstL = Math.sqrt(dxL * dxL + dyL * dyL) + 0.001;
            const pullStrength = (0.28 - abp.life) / 0.28; // 0→1 as life goes 0.28→0
            abp.vx += (dxL / dstL) * (0.4 + pullStrength * 1.6);
            abp.vy += (dyL / dstL) * (0.4 + pullStrength * 1.6);
            abp.vx *= 0.87;
            abp.vy *= 0.87;
          }
          abp.x += abp.vx;
          abp.y += abp.vy;

          // Alpha: full brightness during scatter, fades only in final attraction phase
          const fadeStart = 0.22;
          const abpAlpha = abp.life > fadeStart
            ? (1.0 - t) * settingsRef.current.particleOpacity
            : (abp.life / fadeStart) * (1.0 - t) * settingsRef.current.particleOpacity;
          ctx!.globalAlpha = Math.min(1.0, abpAlpha);
          ctx!.fillStyle = '#22d3ee';
          ctx!.shadowColor = '#22d3ee';
          ctx!.shadowBlur = 10;
          ctx!.beginPath();
          ctx!.arc(abp.x, abp.y, abp.size * Math.max(0.25, abp.life), 0, Math.PI * 2);
          ctx!.fill();
          ctx!.shadowBlur = 0;
        }
      }

      ctx!.globalAlpha = 1.0;
      animId = requestAnimationFrame(animate);
    }

    animId = requestAnimationFrame(animate);

    // ─── Event Listeners ──────────────────────────────────────────────────
    const handleResize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.scale(dpr, dpr);
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    };

    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
      mouse.active = false;
    };

    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (!settingsRef.current.gyroEnabled) return;
      if (e.gamma !== null && e.beta !== null) {
        hasGyro = true;
        const gammaClamped = Math.max(-30, Math.min(30, e.gamma));
        const betaClamped = Math.max(-30, Math.min(30, e.beta - 60));

        gyroX = (gammaClamped / 30) * 0.90 * settingsRef.current.gyroSensitivity;
        gyroY = (betaClamped / 30) * 0.60 * settingsRef.current.gyroSensitivity;
      }
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("deviceorientation", handleOrientation);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("deviceorientation", handleOrientation);
    };
  }, []);

  return (
    <div className="canvas-container">
      <canvas ref={canvasRef} id="particle-canvas" />
    </div>
  );
}
