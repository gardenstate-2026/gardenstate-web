import * as THREE from "three";

// All geometry is positioned in the host plan's east/south meter grid.
export function buildLandscape(scene, site, addLabel) {
  const cube = new THREE.BoxGeometry(1, 1, 1);
  const cylinder = new THREE.CylinderGeometry(0.5, 0.5, 1, 24);
  const crown = new THREE.IcosahedronGeometry(0.5, 1);
  const roof = new THREE.ConeGeometry(0.7, 1, 4);
  const batches = new Map();
  const transform = new THREE.Object3D();
  const tint = new THREE.Color();

  function part(shape, color, x, y, z, w, h, d, yaw = 0, pitch = 0) {
    transform.position.set(x, y, z);
    transform.rotation.set(pitch, yaw, 0);
    transform.scale.set(w, h, d);
    transform.updateMatrix();
    if (!batches.has(shape)) batches.set(shape, []);
    batches.get(shape).push([transform.matrix.clone(), color]);
  }
  const box = (...args) => part(cube, ...args);
  const round = (...args) => part(cylinder, ...args);
  const stone = "#e0ded5", frame = "#f2f0e8", metal = "#5a676c", wood = "#aa8764";
  const { minX, maxX, minZ, maxZ } = site.bounds;
  box("#bdc9ae", (minX + maxX) / 2, -0.48, (minZ + maxZ) / 2, maxX - minX + 3, 0.9, maxZ - minZ + 3);
  for (const b of site.buildings) {
    box("#d4d0c3", b.x, 0.01, b.z, b.width + 4, 0.12, b.depth + 4);
    for (const side of [-1, 1]) {
      box("#989d81", b.x + side * b.width * 0.31, 0.23, b.z + b.depth / 2 + 1.8, b.width * 0.29, 0.42, 1.4);
      for (let i = 0; i < 9; i++) {
        part(crown, i % 3 ? "#69815d" : "#8b995e", b.x + side * b.width * 0.31 + (i - 4), 0.82,
          b.z + b.depth / 2 + 1.8, 1.4, 1.1, 1.3, i * 1.3);
      }
    }
  }
  for (const path of site.paths) {
    for (let i = 1; i < path.points.length; i++) {
      const [x, z] = path.points[i - 1], [u, v] = path.points[i];
      box("#e4daca", (x + u) / 2, 0.03, (z + v) / 2, 3, 0.12, Math.hypot(x - u, z - v) + 2.4, Math.atan2(u - x, v - z));
    }
  }

  function tower(b, index) {
    const { x, z, width: w, depth: d } = b;
    const floors = [12, 14, 10, 11][index % 4], step = 2.55, podium = 2.7, h = floors * step + podium;
    const mid = x - w * 0.08;
    box("#b5aea3", x, 0.13, z, w + 1.9, 0.25, d + 1.9);
    box("#657078", x, podium / 2, z, w, podium, d);
    box(stone, x, (h + podium) / 2, z, w, h - podium, d);
    box("#727e85", mid, h / 2, z, 3, h, d + 0.65);
    // A recessed penthouse and screened end bays break up the roofline.
    const wing = x + w * 0.23;
    box(stone, wing, h + 1.45, z, w * 0.32, 2.8, d * 0.86);
    box(frame, wing, h + 2.94, z, w * 0.33, 0.22, d * 0.89);
    for (const sign of [-1, 1]) {
      box("#71858d", wing, h + 1.55, z + sign * d * 0.435, w * 0.27, 1.65, 0.12);
      const end = x + sign * w / 2;
      box("#879394", end, (h + podium) / 2, z - 0.2, 0.32, h - podium, 3.65);
      for (let level = 0; level < floors; level++) {
        box("#566c73", end + sign * 0.19, podium + (level + 0.52) * step, z - 0.2, 0.12, 1.55, 1.65);
      }
    }
    for (const side of [-1, 1]) {
      const front = z + side * d / 2;
      for (let bay = 0; bay < 7; bay++) {
        const cx = x + w * ((bay + 0.5) / 7 - 0.5);
        const bw = w / 7 - 0.44;
        const balcony = bay === 1 || bay === 5;
        box(metal, cx, (h + podium) / 2, front + side * 0.04, bw, h - podium - 0.35, 0.12);
        for (let level = 0; level < floors; level++) {
          const y = podium + (level + 0.5) * step;
          const glass = ["#6d8691", "#91a6ac", "#728892", "#a5b3b5"][(bay * 5 + level * 3 + index) % 4];
          box(glass, cx, y, front + side * 0.13, bw - 0.25, 1.9, 0.14);
          box("#c2c8c6", cx + bw * 0.1, y, front + side * 0.23, 0.09, 1.9, 0.12);
          if (balcony) {
            box(frame, cx, y - 1.04, front + side * 0.44, bw + 0.22, 0.18, 0.95);
            box("#a5b9bc", cx, y - 0.64, front + side * 0.87, bw, 0.62, 0.12);
            box(metal, cx, y - 0.31, front + side * 0.87, bw, 0.06, 0.14);
          }
        }
      }
      box("#777f80", mid, 2.55, front + side * 0.75, 4.3, 0.27, 1.85);
      for (const dx of [-1.72, 1.72]) box(stone, mid + dx, 1.2, front + side, 0.24, 2.4, 0.24);
      box(frame, x, h + 0.18, front, w + 0.6, 0.6, 0.32);
      box(frame, x + side * w / 2, h + 0.18, z, 0.32, 0.6, d);
    }
    box("#a6ada9", x, h + 0.07, z, w, 0.18, d);
    box("#b9c0bc", mid, h + 1.25, z, 5.1, 2.5, 4.3);
    box(frame, mid, h + 2.55, z, 5.5, 0.2, 4.7);
    addLabel(b.name, x, h + 3.5, z);
  }
  site.buildings.forEach(tower);

  function tree(x, z, i, s = 1) {
    const h = (3.4 + (i % 4) * 0.48) * s;
    round("#817560", x, h * 0.35, z, 0.42 * s, 0.7 * h, 0.42 * s);
    for (let j = 0; j < 4; j++) {
      const angle = i * 1.7 + j * 2.1;
      part(crown, ["#5f845e", "#73946a", "#87a479", "#6c9068"][(i + j) % 4],
        x + Math.sin(angle) * s * 0.8, h * (0.8 + j * 0.09), z + Math.cos(angle) * s * 0.8,
        2.7 * s, 3.6 * s, 2.9 * s, angle);
    }
  }
  site.trees.forEach(([x,z], i) => tree(x,z,i));
  for (const [x, z] of site.trees) {
    round("#a8b991", x, 0.065, z, 4.1, 0.14, 3.5);
    for (let i = 0; i < 5; i++) {
      const a = i * 1.35 + x;
      part(crown, i % 2 ? "#839965" : "#95a774", x + 1.63 * Math.cos(a), 0.43, z + 1.28 * Math.sin(a), 1.45, 0.96, 1.14, a);
    }
  }

  for (const f of site.facilities) {
    const { x, z, width: w, depth: d } = f;
    if (f.kind === "playground") {
      round("#9bbfba", x, 0.14, z, w, 0.24, d);
      for (const offset of [-3.8, 2.3]) {
        for (const dx of [-1,1]) for (const dz of [-1,1])
          round(wood, x + offset + dx, 1.6, z + dz, 0.16, 3.2, 0.16);
        box(wood, x + offset, 1.55, z, 2.5, 0.25, 2.5);
        part(roof, "#4b8c60", x + offset, 3.8, z, 3.6, 1.4, 3.6, Math.PI / 4);
        box("#72a35b", x + offset, 1, z + 2.5, 1.2, 0.18, 3.5, 0, 0.44);
      }
      box(wood, x - 0.75, 1.5, z, 4.6, 0.2, 1.25);
      for (const side of [-0.67,0.67]) {
        box(metal, x - 0.75, 2.22, z + side, 4.6, 0.12, 0.12);
        for (let i = 0; i < 8; i++) round(wood, x - 2.8 + 0.6*i, 1.86, z + side, 0.08, 0.78, 0.08);
      }
    } else if (f.kind === "court") {
      box("#749993", x, 0.12, z, w, 0.2, d);
      for (const side of [-1,1]) {
        box(frame, x, 0.25, z + side * (d/2-0.7), w-1.2, 0.04, 0.13);
        box(frame, x + side*(w/2-0.65), 0.25, z, 0.13, 0.04, d-1.3);
        box(metal, x + side*(w/2-0.8), 1.62, z, 0.18, 3.2, 0.18);
        box(frame, x + side*(w/2-1), 3.2, z, 0.12, 0.95, 1.5);
      }
      box(frame, x, 0.25, z, 0.12, 0.04, d-1.4);
    } else if (f.kind === "dogpark") {
      box("#a5b77f", x, 0.12, z, w, 0.22, d);
      for (const side of [-1,1]) {
        box(wood, x, 0.95, z + side*d/2, w, 0.13, 0.13);
        for (let i=0; i<=8; i++) box(wood, x+w*(i/8-0.5), 0.62, z+side*d/2, 0.16, 1.25, 0.16);
      }
      for (const dx of [-3,0,3]) {
        box(frame,x+dx,0.65,z-0.7,0.13,1.2,0.13);
        box(frame,x+dx,0.65,z+0.7,0.13,1.2,0.13);
        box("#ce9274",x+dx,1,z,0.13,0.13,1.55);
      }
    } else if (f.kind === "recycle") {
      box("#c6c5b9", x, 0.12, z, w, 0.23, d);
      for (const dx of [-3,3]) for (const dz of [-2,2]) box(metal,x+dx,1.45,z+dz,0.13,2.9,0.13);
      box("#819895",x,3,z,w-1,0.2,d-0.5);
      for (const dx of [-2,0,2]) box("#698684",x+dx,0.82,z,1.3,1.4,1.6);
    } else if (f.kind === "garden") {
      round("#d7d0bd",x,0.12,z,w,0.22,d);
      round("#839e72",x,0.25,z,w-1.4,0.24,d-1.1);
      for (const dx of [-7,7]) tree(x+dx,z,4,0.8);
      round("#c9c7bc",x,0.52,z,4.5,0.4,4.5);
      round("#94b7b5",x,0.75,z,3.8,0.1,3.8);
    }
    addLabel(f.name,x,4.6,z);
  }
  const surface = new THREE.MeshStandardMaterial({ roughness: 0.82 });
  for (const [geometry, instances] of batches) {
    const mesh = new THREE.InstancedMesh(geometry, surface, instances.length);
    instances.forEach(([matrix,color], i) => {
      mesh.setMatrixAt(i,matrix);
      mesh.setColorAt(i,tint.set(color));
    });
    mesh.castShadow = mesh.receiveShadow = true;
    scene.add(mesh);
  }
}
