document.addEventListener('DOMContentLoaded', async () => {
    const statusEl = document.getElementById('status');

    // =========================================================================
    // IMPORTANTE: REEMPLAZA ESTA CLAVE POR TU API KEY DE GOOGLE CLOUD
    // La clave debe tener habilitada la "Map Tiles API".
    // =========================================================================
    const GOOGLE_MAPS_API_KEY = "TU_GOOGLE_API_KEY_AQUI"; 

    if (GOOGLE_MAPS_API_KEY === "TU_GOOGLE_API_KEY_AQUI") {
        statusEl.innerHTML = '<span style="color: #ffaa00;">Falta configurar la API Key de Google en app.js</span>';
        console.error("No se ha configurado la API Key de Google Maps.");
    } else {
        statusEl.textContent = 'Iniciando Cesium...';
    }

    // Initialize Cesium Viewer
    // We disable many default UI elements for a cleaner look.
    const viewer = new Cesium.Viewer('cesiumContainer', {
        terrainProvider: await Cesium.createWorldTerrainAsync(),
        animation: false,
        baseLayerPicker: false,
        fullscreenButton: false,
        geocoder: false,
        homeButton: false,
        infoBox: false,
        sceneModePicker: false,
        selectionIndicator: false,
        timeline: false,
        navigationHelpButton: false,
        navigationInstructionsInitiallyVisible: false,
        scene3DOnly: true,
        shadows: true,
    });

    // Remove the default base layer (we will only see the 3D tiles)
    viewer.imageryLayers.removeAll();

    try {
        if (GOOGLE_MAPS_API_KEY !== "TU_GOOGLE_API_KEY_AQUI") {
            // Configure the Google Photorealistic 3D Tileset
            Cesium.GoogleMaps.defaultApiKey = GOOGLE_MAPS_API_KEY;
            
            const tileset = await Cesium.createGooglePhotorealistic3DTileset();
            viewer.scene.primitives.add(tileset);
            
            statusEl.textContent = 'Cargando malla 3D de Google...';
        }
    } catch (error) {
        console.error("Error loading Google 3D Tiles:", error);
        statusEl.innerHTML = '<span style="color: #ff5555;">Error al cargar datos 3D. Verifica la API Key.</span>';
    }

    // Coordinates for General San Martin
    const smLon = -58.557;
    const smLat = -34.562;
    const height3D = 800; // meters
    const heightZenith = 4000; // meters

    // Function to set camera to 3D perspective
    const setView3D = () => {
        viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(smLon, smLat - 0.015, height3D),
            orientation: {
                heading: Cesium.Math.toRadians(0), // look north
                pitch: Cesium.Math.toRadians(-30), // tilt down 30 degrees
                roll: 0.0
            },
            duration: 2.0
        });
    };

    // Function to set camera to Zenith (top-down) perspective
    const setViewZenith = () => {
        viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(smLon, smLat, heightZenith),
            orientation: {
                heading: 0.0,
                pitch: Cesium.Math.toRadians(-90), // look straight down
                roll: 0.0
            },
            duration: 2.0
        });
    };

    // Initial view
    setView3D();
    if (GOOGLE_MAPS_API_KEY !== "TU_GOOGLE_API_KEY_AQUI") {
        statusEl.textContent = 'Mapa listo';
    }

    // Event Listeners for Buttons
    document.getElementById('btn-3d').addEventListener('click', setView3D);
    document.getElementById('btn-zenith').addEventListener('click', setViewZenith);
});
