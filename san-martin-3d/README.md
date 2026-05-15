# General San Martín 3D

Visualización web estática del Partido de General San Martín, Provincia de Buenos Aires, en una escena 3D inspirada en `cartesiancs/map3d`.

Esta versión usa Three.js desde CDN para proyectar coordenadas geográficas a un plano local y extruir polígonos como volúmenes urbanos. No usa React, build step, Mapbox, Cesium, claves de API ni servicios pagos.

## Cómo verla en GitHub Pages

La URL pública esperada es:

https://eaguirre25.github.io/lista-multicolor-escrutinio/san-martin-3d/

## Cómo abrirla localmente

Se puede abrir directamente desde `san-martin-3d/index.html`. Para probarla en condiciones similares a GitHub Pages, conviene servir el repositorio con un servidor estático:

```bash
python -m http.server 8000
```

Luego abrir:

http://localhost:8000/san-martin-3d/

## Archivos

- `index.html`: estructura mínima de la página y carga de la aplicación como módulo JavaScript.
- `styles.css`: estilos de pantalla completa, panel, botones, indicador de estado y fondo visual.
- `app.js`: escena Three.js, cámara orbital, proyección local, geometrías extruidas, controles y fallbacks.
- `data/san_martin_boundary.geojson`: límite del Partido de General San Martín obtenido de OpenStreetMap/Nominatim.
- `data/buildings.geojson`: volúmenes urbanos simulados con propiedad `height`.

## Base técnica

La lógica imita la base de `map3d`:

- proyecta latitud/longitud a coordenadas planas locales;
- convierte polígonos GeoJSON en `THREE.Shape`;
- usa `THREE.ExtrudeGeometry` para levantar volúmenes;
- agrega luces, niebla, grilla, contorno y líneas tipo caminos;
- permite orbitar con mouse y cambiar entre vista 3D y cenital.

## Datos

El límite territorial incluido corresponde a la relación OSM `1719022`, `Partido de General San Martín, Buenos Aires, Argentina`, descargada como GeoJSON estático desde Nominatim. Debe validarse contra una fuente oficial antes de usarlo en análisis institucionales.

Los volúmenes urbanos son simulados. No representan catastro real, alturas reales, huellas edilicias oficiales ni edificios de OpenStreetMap. Fueron distribuidos dentro del polígono del partido para comprobar la vista 3D.

## Reemplazar el límite por un GeoJSON oficial

1. Descargar un límite oficial o validado del Partido de General San Martín desde una fuente confiable, por ejemplo IGN, datos abiertos provinciales/municipales u OpenStreetMap revisado.
2. Convertirlo a GeoJSON en EPSG:4326, con coordenadas `[longitud, latitud]`.
3. Reemplazar `data/san_martin_boundary.geojson`.
4. Mantener una `FeatureCollection` con geometría `Polygon` o `MultiPolygon`.

La aplicación también contiene un polígono embebido como respaldo por si ese archivo no carga.

## Reemplazar los volúmenes simulados por edificios reales de OSM

1. Obtener edificios de OpenStreetMap para General San Martín con una herramienta externa como Overpass Turbo.
2. Exportar el resultado como GeoJSON.
3. Normalizar cada feature para que tenga una propiedad numérica `height`.
4. Reemplazar `data/buildings.geojson`.

Si no hay altura real disponible, una opción razonable para una segunda etapa es estimar `height` desde `building:levels`, por ejemplo `levels * 3`.

## Segunda versión

Una próxima versión debería incorporar límite oficial validado, edificios reales de OSM o catastro municipal, caminos reales exportados previamente, cálculo robusto de alturas, recorte exacto de edificios al límite del partido y opción de exportar GLB como en el proyecto de referencia.
