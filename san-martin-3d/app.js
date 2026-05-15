document.addEventListener('DOMContentLoaded', () => {
    const statusEl = document.getElementById('status');

    // Initialize MapLibre GL JS
    const map = new maplibregl.Map({
        container: 'map',
        style: {
            version: 8,
            sources: {
                'osm-tiles': {
                    type: 'raster',
                    tiles: [
                        'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
                    ],
                    tileSize: 256,
                    attribution: '© OpenStreetMap contributors'
                }
            },
            layers: [
                {
                    id: 'osm-tiles-layer',
                    type: 'raster',
                    source: 'osm-tiles',
                    minzoom: 0,
                    maxzoom: 19
                }
            ]
        },
        center: [-58.557, -34.562],
        zoom: 12,
        pitch: 60,
        bearing: -25,
        antialias: true
    });

    // Add navigation controls
    map.addControl(new maplibregl.NavigationControl());

    map.on('load', async () => {
        try {
            // Add Boundary Source & Layers
            try {
                const boundaryRes = await fetch('./data/san_martin_boundary.geojson');
                if (!boundaryRes.ok) throw new Error('No boundary data');
                const boundaryData = await boundaryRes.json();
                
                map.addSource('sanmartin-boundary', {
                    type: 'geojson',
                    data: boundaryData
                });

                map.addLayer({
                    id: 'sanmartin-fill',
                    type: 'fill',
                    source: 'sanmartin-boundary',
                    paint: {
                        'fill-color': '#007BFF',
                        'fill-opacity': 0.1
                    }
                });

                map.addLayer({
                    id: 'sanmartin-outline',
                    type: 'line',
                    source: 'sanmartin-boundary',
                    paint: {
                        'line-color': '#FFFFFF',
                        'line-width': 2,
                        'line-opacity': 0.8
                    }
                });
            } catch (err) {
                console.warn('Fallback: Could not load boundary geojson', err);
                statusEl.textContent = 'Advertencia: Límite no disponible.';
            }

            // Add Building Volumes Source & Layers
            try {
                const buildingsRes = await fetch('./data/buildings.geojson');
                if (!buildingsRes.ok) throw new Error('No buildings data');
                const buildingsData = await buildingsRes.json();

                map.addSource('buildings', {
                    type: 'geojson',
                    data: buildingsData
                });

                map.addLayer({
                    id: 'urban-volume',
                    type: 'fill-extrusion',
                    source: 'buildings',
                    paint: {
                        'fill-extrusion-color': '#6e798c',
                        'fill-extrusion-height': ['get', 'height'],
                        'fill-extrusion-base': 0,
                        'fill-extrusion-opacity': 0.75
                    }
                });

                statusEl.textContent = 'Mapa listo';
            } catch (err) {
                console.warn('Fallback: Could not load buildings geojson', err);
                statusEl.textContent = 'Mapa listo (sin volúmenes)';
            }
        } catch (error) {
            console.error('Error initializing map layers:', error);
            statusEl.textContent = 'Error cargando capas.';
        }
    });

    // Event Listeners for Buttons
    document.getElementById('btn-3d').addEventListener('click', () => {
        map.flyTo({
            center: [-58.557, -34.562],
            zoom: 12.1,
            pitch: 60,
            bearing: -25,
            duration: 1500
        });
    });

    document.getElementById('btn-zenith').addEventListener('click', () => {
        map.flyTo({
            center: [-58.557, -34.562],
            zoom: 12.2,
            pitch: 0,
            bearing: 0,
            duration: 1500
        });
    });
});
