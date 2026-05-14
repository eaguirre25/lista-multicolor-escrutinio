(function () {
  const CENTER = [-58.557, -34.562];
  const INITIAL_VIEW = {
    center: CENTER,
    zoom: 12.1,
    pitch: 60,
    bearing: -25
  };

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
            [-58.5965, -34.5412],
            [-58.5742, -34.5358],
            [-58.5488, -34.5404],
            [-58.5238, -34.5544],
            [-58.5164, -34.5786],
            [-58.5268, -34.6037],
            [-58.5525, -34.6122],
            [-58.5798, -34.6049],
            [-58.5992, -34.5834],
            [-58.6035, -34.5578],
            [-58.5965, -34.5412]
          ]]
        }
      }
    ]
  };

  const statusEl = document.getElementById("status");
  const fatalEl = document.getElementById("fatal-error");

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
    setStatus("Mapa cargado con advertencias");
  }

  function getBoundaryPolygon(boundaryData) {
    const feature = boundaryData && boundaryData.features && boundaryData.features[0];
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

  function polygonBounds(polygon) {
    return polygon.reduce((bounds, coordinate) => {
      return {
        minLng: Math.min(bounds.minLng, coordinate[0]),
        minLat: Math.min(bounds.minLat, coordinate[1]),
        maxLng: Math.max(bounds.maxLng, coordinate[0]),
        maxLat: Math.max(bounds.maxLat, coordinate[1])
      };
    }, {
      minLng: Infinity,
      minLat: Infinity,
      maxLng: -Infinity,
      maxLat: -Infinity
    });
  }

  function createSimulatedBuildings(boundaryData, count = 180) {
    const polygon = getBoundaryPolygon(boundaryData);
    const bounds = polygonBounds(polygon);
    const random = seededRandom(25021978);
    const features = [];
    let attempts = 0;

    while (features.length < count && attempts < count * 35) {
      attempts += 1;
      const lng = bounds.minLng + random() * (bounds.maxLng - bounds.minLng);
      const lat = bounds.minLat + random() * (bounds.maxLat - bounds.minLat);

      if (!pointInPolygon([lng, lat], polygon)) {
        continue;
      }

      const width = 0.00065 + random() * 0.00125;
      const depth = 0.00050 + random() * 0.00105;
      const jitterLng = (random() - 0.5) * 0.00020;
      const jitterLat = (random() - 0.5) * 0.00020;
      const height = Math.round(8 + Math.pow(random(), 1.8) * 62);
      const west = lng - width / 2 + jitterLng;
      const east = lng + width / 2 + jitterLng;
      const south = lat - depth / 2 + jitterLat;
      const north = lat + depth / 2 + jitterLat;

      features.push({
        type: "Feature",
        properties: {
          height,
          simulated: true
        },
        geometry: {
          type: "Polygon",
          coordinates: [[
            [west, south],
            [east, south],
            [east, north],
            [west, north],
            [west, south]
          ]]
        }
      });
    }

    return {
      type: "FeatureCollection",
      features
    };
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

  function addBoundaryLayers(map, boundaryData) {
    map.addSource("sanmartin-boundary", {
      type: "geojson",
      data: boundaryData
    });

    map.addLayer({
      id: "sanmartin-fill",
      type: "fill",
      source: "sanmartin-boundary",
      paint: {
        "fill-color": "#65d4ff",
        "fill-opacity": 0.12
      }
    });

    map.addLayer({
      id: "sanmartin-outline",
      type: "line",
      source: "sanmartin-boundary",
      paint: {
        "line-color": "#dff7ff",
        "line-width": 2.6,
        "line-opacity": 0.94
      }
    });
  }

  function addBuildingLayer(map, buildingData) {
    map.addSource("buildings", {
      type: "geojson",
      data: buildingData
    });

    map.addLayer({
      id: "urban-volume",
      type: "fill-extrusion",
      source: "buildings",
      paint: {
        "fill-extrusion-color": [
          "interpolate",
          ["linear"],
          ["coalesce", ["get", "height"], 18],
          8,
          "#45b9d6",
          30,
          "#567da6",
          70,
          "#8165b7"
        ],
        "fill-extrusion-height": ["coalesce", ["to-number", ["get", "height"]], 18],
        "fill-extrusion-base": 0,
        "fill-extrusion-opacity": 0.8
      }
    });
  }

  function wireViewButtons(map) {
    const view3d = document.getElementById("view-3d");
    const viewTop = document.getElementById("view-top");

    if (view3d) {
      view3d.addEventListener("click", () => {
        map.easeTo({
          center: [-58.557, -34.562],
          zoom: 12.1,
          pitch: 60,
          bearing: -25,
          duration: 900
        });
      });
    }

    if (viewTop) {
      viewTop.addEventListener("click", () => {
        map.easeTo({
          center: [-58.557, -34.562],
          zoom: 12.2,
          pitch: 0,
          bearing: 0,
          duration: 900
        });
      });
    }
  }

  function initMap() {
    if (!window.maplibregl || !window.maplibregl.Map) {
      showFatal("No se pudo cargar el motor del mapa.");
      return;
    }

    setStatus("Cargando mapa...");

    const map = new maplibregl.Map({
      container: "map",
      style: {
        version: 8,
        glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
        sources: {
          osm: {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            maxzoom: 19,
            attribution: "&copy; OpenStreetMap contributors"
          }
        },
        layers: [
          {
            id: "background",
            type: "background",
            paint: {
              "background-color": "#101720"
            }
          },
          {
            id: "osm",
            type: "raster",
            source: "osm"
          }
        ]
      },
      center: INITIAL_VIEW.center,
      zoom: INITIAL_VIEW.zoom,
      pitch: INITIAL_VIEW.pitch,
      bearing: INITIAL_VIEW.bearing,
      antialias: true,
      attributionControl: true
    });

    window.sanMartin3DMap = map;
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");
    wireViewButtons(map);

    map.on("error", (event) => {
      console.warn("MapLibre aviso/error no critico:", event && event.error ? event.error : event);
      setStatus("Mapa cargado con advertencias");
    });

    let appLayersStarted = false;

    async function addAppLayers() {
      if (appLayersStarted) {
        return;
      }

      appLayersStarted = true;
      let boundaryResult;
      let buildingsWereSimulated = false;
      let hadWarnings = false;

      try {
        boundaryResult = await loadGeoJson(
          "./data/san_martin_boundary.geojson",
          FALLBACK_BOUNDARY,
          "No se pudo cargar san_martin_boundary.geojson. Se usa fallback embebido."
        );
        hadWarnings = hadWarnings || boundaryResult.fallback;
        addBoundaryLayers(map, boundaryResult.data);
      } catch (error) {
        hadWarnings = true;
        boundaryResult = { data: FALLBACK_BOUNDARY, fallback: true };
        console.warn("Fallo al agregar el limite. Se reintenta con fallback embebido.", error);
        addBoundaryLayers(map, FALLBACK_BOUNDARY);
      }

      try {
        const buildingsResult = await loadGeoJson(
          "./data/buildings.geojson",
          null,
          "No se pudo cargar buildings.geojson. Se generan volumenes simulados."
        );
        const buildingsData = buildingsResult.fallback || !buildingsResult.data
          ? createSimulatedBuildings(boundaryResult.data)
          : buildingsResult.data;

        buildingsWereSimulated = buildingsResult.fallback ||
          !buildingsResult.data ||
          buildingsData.features.some((feature) => feature.properties && feature.properties.simulated);
        hadWarnings = hadWarnings || buildingsResult.fallback;
        addBuildingLayer(map, buildingsData);
        map.moveLayer("sanmartin-outline");
      } catch (error) {
        hadWarnings = true;
        buildingsWereSimulated = true;
        console.warn("Fallo al agregar edificios. Se generan volumenes simulados.", error);
        addBuildingLayer(map, createSimulatedBuildings(boundaryResult.data));
        map.moveLayer("sanmartin-outline");
      }

      if (buildingsWereSimulated) {
        setStatus("Mapa listo con volúmenes simulados");
      } else if (hadWarnings) {
        setStatus("Mapa cargado con advertencias");
      } else {
        setStatus("Mapa listo");
      }
    }

    map.once("style.load", addAppLayers);
    map.once("load", addAppLayers);
    window.setTimeout(() => {
      if (!appLayersStarted && map.isStyleLoaded()) {
        addAppLayers();
      }
    }, 2500);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initMap);
  } else {
    initMap();
  }
}());
