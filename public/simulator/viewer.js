import * as THREE from "three";
import { OrbitControls } from "./vendor/three/addons/controls/OrbitControls.js";
import { buildLandscape } from "./landscape.js";

const host = document.getElementById("scene");
const labels = document.getElementById("labels");
const scene = new THREE.Scene();
scene.background = new THREE.Color("#e8ece5");
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 650);
camera.position.set(37, 153, 135);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
host.append(renderer.domElement);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 10, 0);
controls.enablePan = false;
controls.minZoom = 0.75;
controls.maxZoom = 5;
controls.maxPolarAngle = Math.PI / 2.6;
controls.update();
scene.add(new THREE.HemisphereLight(0xfffbef, 0xc1c6b7, 1.9));
const light = new THREE.DirectionalLight(0xfff4db, 2.1);
light.position.set(-58, 96, 48);
light.castShadow = true;
Object.assign(light.shadow.camera, { left: -85, right: 85, top: 80, bottom: -80, far: 260 });
light.shadow.camera.updateProjectionMatrix();
light.shadow.mapSize.set(2048, 2048);
light.shadow.bias = -0.0004;
light.shadow.normalBias = 0.065;
scene.add(light);

const anchors = [];
const pins = new Map();
const projected = new THREE.Vector3();
let layoutReady = false;
let pending = 0;
function draw() {
  pending = 0;
  renderer.render(scene, camera);
  for (const { element, position } of [...anchors, ...pins.values()]) {
    projected.copy(position).project(camera);
    const left = (1 + projected.x) * host.clientWidth / 2;
    const top = (1 - projected.y) * host.clientHeight / 2;
    element.style.transform = `translate(${left}px,${top}px) translate(-50%,-50%)`;
    element.hidden = Math.abs(projected.z) > 1 || Math.abs(projected.x) > 1 || Math.abs(projected.y) > 1;
  }
}
function invalidate() {
  if (!pending) pending = requestAnimationFrame(draw);
}
function resize() {
  const w = host.clientWidth, h = host.clientHeight;
  if (!w || !h) return;
  const span = Math.max(104, 148 * h / w);
  camera.top = span / 2;
  camera.bottom = -span / 2;
  camera.right = span * w / h / 2;
  camera.left = -camera.right;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  invalidate();
}
controls.addEventListener("change", invalidate);
new ResizeObserver(resize).observe(host);
resize();

function addLabel(text, x, y, z) {
  const element = document.createElement("span");
  element.className = "label";
  element.textContent = text;
  labels.append(element);
  anchors.push({ element, position: new THREE.Vector3(x,y,z) });
}

const stamp = document.createElement("canvas");
stamp.width = stamp.height = 128;
const context = stamp.getContext("2d");
const gradient = context.createRadialGradient(64,64,0,64,64,64);
gradient.addColorStop(0, "rgba(214,69,58,0.75)");
gradient.addColorStop(0.5, "rgba(227,108,66,0.46)");
gradient.addColorStop(1, "rgba(227,108,66,0)");
context.fillStyle = gradient;
context.fillRect(0,0,128,128);
const heatTexture = new THREE.CanvasTexture(stamp);
heatTexture.colorSpace = THREE.SRGBColorSpace;
const heatMaterial = new THREE.MeshBasicMaterial({ map: heatTexture, transparent: true, depthWrite: false });
const heatGeometry = new THREE.PlaneGeometry(22,22);
const heatLayer = new THREE.Group();
scene.add(heatLayer);

function setComplaints(payload) {
  const current = new Set();
  for (const complaint of payload.complaints) {
    const { id, x, z } = complaint;
    if (typeof id !== "string" || !Number.isFinite(x) || !Number.isFinite(z)) continue;
    current.add(id);
    let pin = pins.get(id);
    if (!pin) {
      const element = document.createElement("button");
      element.type = "button";
      element.className = "pin";
      element.addEventListener("click", () => parent.postMessage({type:"gardenstate:select", id}, location.origin));
      const heat = new THREE.Mesh(heatGeometry, heatMaterial);
      heat.rotation.x = -Math.PI / 2;
      heatLayer.add(heat);
      labels.append(element);
      pin = { element, heat, position: new THREE.Vector3() };
      pins.set(id, pin);
    }
    pin.position.set(x, 1.15, z);
    pin.heat.position.set(x, 0.98, z);
    pin.element.style.backgroundColor = payload.colors?.[complaint.analysis?.category ?? complaint.category] || "#6f7672";
    pin.element.title = complaint.analysis?.summary || complaint.text || "민원 위치";
    pin.element.setAttribute("aria-label", pin.element.title);
    pin.element.setAttribute("aria-pressed", String(id === payload.selectedId));
  }
  for (const [id, pin] of pins) {
    if (current.has(id)) continue;
    pin.element.remove();
    heatLayer.remove(pin.heat);
    pins.delete(id);
  }
  heatLayer.visible = payload.showHeatmap;
  invalidate();
}
window.addEventListener("message", (event) => {
  if (event.source !== parent || event.origin !== location.origin || event.data?.type !== "gardenstate:complaints") return;
  const payload = event.data.payload;
  if (!Array.isArray(payload?.complaints) || !payload.layout) return;
  if (!layoutReady) {
    buildLandscape(scene, payload.layout, addLabel);
    layoutReady = true;
  }
  setComplaints(payload);
});
renderer.domElement.addEventListener("webglcontextlost", () => parent.postMessage({type:"gardenstate:unavailable"}, location.origin));
parent.postMessage({type:"gardenstate:ready"}, location.origin);
