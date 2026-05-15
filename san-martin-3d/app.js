import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const CENTER = [-58.5640721, -34.5434998];
const SCALE = 51000;
const BUILDING_SCALE = 0.72;

const FALLBACK_BOUNDARY = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {
        name: "General San Martín",
        source: "fallback aproximado"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-58.6182, -34.5474],
          [-58.5998, -34.4894],
          [-58.5685, -34.5175],
          [-58.5407, -34.5422],
          [-58.5291, -34.5424],
          [-58.5247, -34.5501],
          [-58.5099, -34.5693],
          [-58.5226, -34.5976],
          [-58.5622, -34.5913],
          [-58.5903, -34.5690],
          [-58.6182, -34.5474]
        ]]
      }
    }
  ]
};

const statusEl = document.getElementById("status");
const fatalEl = document.getElementById("fatal-error");
const container = document.getElementById("map");

function setStatus(message) {
  if (statusEl) {
    statusEl.textContent = message;
  }
}

function showFatal(message) {
  if (fatalEl) {
    fatalEl.textContent = message;
    fatalEl.hidden = false;
  }
}

function projectCoordinate(coordinate) {
  const lng = coordinate[0];
  const lat = coordinate[1];
  const x = (lng - CENTER[0]) * SCALE * Math.cos((CENTER[1] * Math.PI) / 180);
  const z = -(lat - CENTER[1]) * SCALE;
  return new THREE.Vector2(x, z);
}

function firstPolygon(featureCollection) {
  const feature = featureCollection && featureCollection.features && featureCollection.features[0];
  if (!feature || !feature.geometry) {
    return FALLBACK_BOUNDARY.features[0].geometry.coordinates[0];
  }

  if (feature.geometry.type === "Polygon") {
    return feature.geometry.coordinates[0];
  }

  if (feature.geometry.type === "MultiPolygon") {
    return feature.geometry.coordinates[0][0];
  }

  return FALLBACK_BOUNDARY.features[0].geometry.coordinates[0];
}

function polygonBounds(polygon) {
  return polygon.reduce((bounds, coordinate) => ({
    minLng: Math.min(bounds.minLng, coordinate[0]),
    minLat: Math.min(bounds.minLat, coordinate[1]),
    maxLng: Math.max(bounds.maxLng, coordinate[0]),
    maxLat: Math.max(bounds.maxLat, coordinate[1])
  }), {
    minLng: Infinity,
    minLat: Infinity,
    maxLng: -Infinity,
    maxLat: -Infinity
  });
}

function pointInPolygon(point, polygon) {
  const x = point[0];
  const y = point[1];
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0];
    const yi = polygon[i][1];
    const xj = polygon[j][0];
    const yj = polygon[j][1];
    const intersects = ((yi > y) !== (yj > y)) &&
      (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi);

    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
}

function seededRandom(seed) {
  let value = seed % 2147483647;
  if (value <= 0) {
    value += 2147483646;
  }

  return function random() {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function createSimulatedBuildings(boundaryData, count = 180) {
  const polygon = firstPolygon(boundaryData);
  const bounds = polygonBounds(polygon);
  const random = seededRandom(25021978);
  const features = [];
  let attempts = 0;

  while (features.length < count && attempts < count * 70) {
    attempts += 1;
    const lng = bounds.minLng + random() * (bounds.maxLng - bounds.minLng);
    const lat = bounds.minLat + random() * (bounds.maxLat - bounds.minLat);

    if (!pointInPolygon([lng, lat], polygon)) {
      continue;
    }

    const width = 0.00065 + random() * 0.00125;
    const depth = 0.00050 + random() * 0.00105;
    const skew = (random() - 0.5) * 0.00018;
    const height = Math.round(8 + Math.pow(random(), 1.7) * 62);
    const west = lng - width / 2;
    const east = lng + width / 2;
    const south = lat - depth / 2;
    const north = lat + depth / 2;

    features.push({
      type: "Feature",
      properties: {
        height,
        simulated: true
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [west + skew, south],
          [east + skew, south + skew],
          [east - skew, north],
          [west - skew, north - skew],
          [west + skew, south]
        ]]
      }
    });
  }

  return {
    type: "FeatureCollection",
    features
  };
}

function createSyntheticRoads(boundaryData) {
  const polygon = firstPolygon(boundaryData);
  const bounds = polygonBounds(polygon);
  const roads = [];

  for (let i = 1; i < 9; i += 1) {
    const t = i / 9;
    const lat = bounds.minLat + t * (bounds.maxLat - bounds.minLat);
    roads.push([
      [bounds.minLng + 0.006, lat],
      [bounds.maxLng - 0.006, lat + (i % 2 === 0 ? 0.004 : -0.003)]
    ]);
  }

  for (let i = 1; i < 7; i += 1) {
    const t = i / 7;
    const lng = bounds.minLng + t * (bounds.maxLng - bounds.minLng);
    roads.push([
      [lng, bounds.minLat + 0.007],
      [lng + (i % 2 === 0 ? 0.004 : -0.004), bounds.maxLat - 0.007]
    ]);
  }

  return roads;
}

async function loadGeoJson(url, fallbackData, warningMessage) {
  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }
    return {
      data: await response.json(),
      fallback: false
    };
  } catch (error) {
    console.warn(warningMessage, error);
    return {
      data: fallbackData,
      fallback: true
    };
  }
}

function makeShapeFromCoordinates(coordinates) {
  const points = coordinates.map(projectCoordinate);
  if (!points[0].equals(points[points.length - 1])) {
    points.push(points[0].clone());
  }
  return new THREE.Shape(points);
}

function makeLine(coordinates, material, y = 0.35) {
  const points = coordinates.map((coordinate) => {
    const p = projectCoordinate(coordinate);
    return new THREE.Vector3(p.x, y, p.y);
  });
  return new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), material);
}

function lonToTileX(lng, zoom) {
  return Math.floor(((lng + 180) / 360) * 2 ** zoom);
}

function latToTileY(lat, zoom) {
  const latRad = (lat * Math.PI) / 180;
  return Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * 2 ** zoom
  );
}

function tileXToLon(x, zoom) {
  return (x / 2 ** zoom) * 360 - 180;
}

function tileYToLat(y, zoom) {
  const n = Math.PI - (2 * Math.PI * y) / 2 ** zoom;
  return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = url;
  });
}

async function addStreetBase(scene, boundaryData, renderer) {
  const zoom = 14;
  const tileSize = 256;
  const bounds = polygonBounds(firstPolygon(boundaryData));
  const xMin = lonToTileX(bounds.minLng, zoom);
  const xMax = lonToTileX(bounds.maxLng, zoom);
  const yMin = latToTileY(bounds.maxLat, zoom);
  const yMax = latToTileY(bounds.minLat, zoom);
  const cols = xMax - xMin + 1;
  const rows = yMax - yMin + 1;

  if (cols <= 0 || rows <= 0 || cols * rows > 80) {
    return false;
  }

  const canvas = document.createElement("canvas");
  canvas.width = cols * tileSize;
  canvas.height = rows * tileSize;
  const context = canvas.getContext("2d");
  context.fillStyle = "#eef2f3";
  context.fillRect(0, 0, canvas.width, canvas.height);

  let loadedTiles = 0;
  const jobs = [];
  for (let x = xMin; x <= xMax; x += 1) {
    for (let y = yMin; y <= yMax; y += 1) {
      const url = `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`;
      jobs.push(
        loadImage(url)
          .then((image) => {
            context.drawImage(image, (x - xMin) * tileSize, (y - yMin) * tileSize, tileSize, tileSize);
            loadedTiles += 1;
          })
          .catch((error) => {
            console.warn("No se pudo cargar una tesela OSM.", url, error);
          })
      );
    }
  }

  await Promise.all(jobs);
  if (loadedTiles === 0) {
    return false;
  }

  const west = tileXToLon(xMin, zoom);
  const east = tileXToLon(xMax + 1, zoom);
  const north = tileYToLat(yMin, zoom);
  const south = tileYToLat(yMax + 1, zoom);
  const southWest = projectCoordinate([west, south]);
  const northEast = projectCoordinate([east, north]);
  const width = Math.abs(northEast.x - southWest.x);
  const depth = Math.abs(northEast.y - southWest.y);
  const centerX = (northEast.x + southWest.x) / 2;
  const centerZ = (northEast.y + southWest.y) / 2;

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();

  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity: 0.9
  });
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), material);
  plane.rotation.x = -Math.PI / 2;
  plane.position.set(centerX, -0.08, centerZ);
  scene.add(plane);

  return true;
}

function addGround(scene, boundaryData) {
  const shape = makeShapeFromCoordinates(firstPolygon(boundaryData));
  const geometry = new THREE.ShapeGeometry(shape);
  geometry.rotateX(-Math.PI / 2);

  const fill = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({
      color: 0xc7e8ef,
      transparent: true,
      opacity: 0.18,
      roughness: 0.82,
      metalness: 0.02,
      side: THREE.DoubleSide
    })
  );
  fill.position.y = 0.02;
  scene.add(fill);

  const outlineMaterial = new THREE.LineBasicMaterial({ color: 0x33e4ff, linewidth: 2 });
  const outline = makeLine(firstPolygon(boundaryData), outlineMaterial, 0.55);
  scene.add(outline);
}

function featurePolygons(feature) {
  if (!feature || !feature.geometry) {
    return [];
  }

  if (feature.geometry.type === "Polygon") {
    return [feature.geometry.coordinates[0]];
  }

  if (feature.geometry.type === "MultiPolygon") {
    return feature.geometry.coordinates.map((polygon) => polygon[0]);
  }

  return [];
}

function addBuildings(scene, buildingsData) {
  const group = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({
    color: 0x9da0a3,
    roughness: 0.56,
    metalness: 0.04
  });
  const highlight = new THREE.MeshStandardMaterial({
    color: 0x5e8edc,
    roughness: 0.54,
    metalness: 0.05
  });

  buildingsData.features.forEach((feature, index) => {
    featurePolygons(feature).forEach((coordinates) => {
      if (coordinates.length < 4) {
        return;
      }

      const shape = makeShapeFromCoordinates(coordinates);
      const height = Number(feature.properties && feature.properties.height) || 12;
      const geometry = new THREE.ExtrudeGeometry(shape, {
        depth: Math.max(8, Math.min(70, height)) * BUILDING_SCALE,
        bevelEnabled: false,
        steps: 1
      });
      geometry.rotateX(-Math.PI / 2);

      const mesh = new THREE.Mesh(geometry, index % 9 === 0 ? highlight : material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
    });
  });

  scene.add(group);
  return group.children.length;
}

function addRoads(scene, boundaryData) {
  const material = new THREE.LineBasicMaterial({ color: 0x34f516, linewidth: 1 });
  const roads = createSyntheticRoads(boundaryData);
  roads.forEach((road) => scene.add(makeLine(road, material, 0.28)));
}

function addReferenceGrid(scene, boundaryData) {
  const bounds = polygonBounds(firstPolygon(boundaryData));
  const westSouth = projectCoordinate([bounds.minLng, bounds.minLat]);
  const eastNorth = projectCoordinate([bounds.maxLng, bounds.maxLat]);
  const width = Math.abs(eastNorth.x - westSouth.x);
  const depth = Math.abs(eastNorth.y - westSouth.y);
  const grid = new THREE.GridHelper(Math.max(width, depth) * 1.15, 28, 0xaeb8c2, 0xd1d7dd);
  const materials = Array.isArray(grid.material) ? grid.material : [grid.material];
  materials.forEach((material) => {
    material.transparent = true;
    material.opacity = 0.28;
  });
  grid.position.y = -0.03;
  scene.add(grid);
}

function easeCamera(camera, controls, targetPosition, targetLookAt, duration = 850) {
  const startPosition = camera.position.clone();
  const startTarget = controls.target.clone();
  const endPosition = new THREE.Vector3(targetPosition[0], targetPosition[1], targetPosition[2]);
  const endTarget = new THREE.Vector3(targetLookAt[0], targetLookAt[1], targetLookAt[2]);
  const startTime = performance.now();

  function step(now) {
    const t = Math.min(1, (now - startTime) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    camera.position.lerpVectors(startPosition, endPosition, eased);
    controls.target.lerpVectors(startTarget, endTarget, eased);
    controls.update();

    if (t < 1) {
      requestAnimationFrame(step);
    }
  }

  requestAnimationFrame(step);
}

function resizeRenderer(renderer, camera) {
  const width = container.clientWidth || window.innerWidth;
  const height = container.clientHeight || window.innerHeight;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

async function init() {
  if (!container || !window.WebGLRenderingContext) {
    showFatal("No se pudo cargar el motor del mapa.");
    return;
  }

  setStatus("Cargando mapa...");

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xd8e6f5);
  scene.fog = new THREE.Fog(0xd8e6f5, 5200, 14000);

  const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 9000);
  camera.position.set(2600, 2400, 3200);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.target.set(0, 25, 0);
  controls.maxPolarAngle = Math.PI * 0.48;
  controls.minDistance = 450;
  controls.maxDistance = 9200;
  controls.update();

  resizeRenderer(renderer, camera);
  window.addEventListener("resize", () => resizeRenderer(renderer, camera));

  scene.add(new THREE.HemisphereLight(0xffffff, 0x7d8791, 2.8));

  const sun = new THREE.DirectionalLight(0xffffff, 2.7);
  sun.position.set(-700, 1200, 900);
  sun.castShadow = true;
  sun.shadow.camera.left = -1800;
  sun.shadow.camera.right = 1800;
  sun.shadow.camera.top = 1800;
  sun.shadow.camera.bottom = -1800;
  sun.shadow.mapSize.width = 2048;
  sun.shadow.mapSize.height = 2048;
  scene.add(sun);

  const boundaryResult = await loadGeoJson(
    "./data/san_martin_boundary.geojson",
    FALLBACK_BOUNDARY,
    "No se pudo cargar san_martin_boundary.geojson. Se usa fallback embebido."
  );

  const buildingResult = await loadGeoJson(
    "./data/buildings.geojson",
    null,
    "No se pudo cargar buildings.geojson. Se generan volúmenes simulados."
  );

  const buildingsData = buildingResult.data || createSimulatedBuildings(boundaryResult.data);
  const simulatedVolumes = buildingResult.fallback ||
    buildingsData.features.some((feature) => feature.properties && feature.properties.simulated);

  const streetsLoaded = await addStreetBase(scene, boundaryResult.data, renderer);
  addReferenceGrid(scene, boundaryResult.data);
  addGround(scene, boundaryResult.data);
  if (!streetsLoaded) {
    console.warn("No se pudo cargar la capa de calles OSM. Se usan líneas sintéticas como respaldo visual.");
    addRoads(scene, boundaryResult.data);
  }
  const volumeCount = addBuildings(scene, buildingsData);

  document.getElementById("view-3d").addEventListener("click", () => {
    easeCamera(camera, controls, [2600, 2400, 3200], [0, 25, 0]);
  });

  document.getElementById("view-top").addEventListener("click", () => {
    easeCamera(camera, controls, [0, 8200, 0.01], [0, 0, 0]);
  });

  function render() {
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(render);
  }

  render();
  window.sanMartin3DReady = true;
  window.sanMartin3DScene = { scene, camera, renderer, controls, volumeCount };

  if (simulatedVolumes) {
    setStatus("Mapa listo con volúmenes simulados");
  } else if (boundaryResult.fallback) {
    setStatus("Mapa cargado con advertencias");
  } else {
    setStatus("Mapa listo");
  }
}

init().catch((error) => {
  console.error("No se pudo inicializar la escena 3D.", error);
  showFatal("No se pudo cargar el motor del mapa.");
});
