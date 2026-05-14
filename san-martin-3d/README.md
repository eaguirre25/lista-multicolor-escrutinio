# General San Martín 3D

Visualización web estática del Partido de General San Martín, Provincia de Buenos Aires, en una vista oblicua 3D con MapLibre GL JS y una base raster de OpenStreetMap.

## Cómo verla en GitHub Pages

La URL pública esperada es:

https://eaguirre25.github.io/lista-multicolor-escrutinio/san-martin-3d/

La página no requiere tokens, claves de API ni procesos de compilación.

## Cómo abrirla localmente

Se puede abrir directamente desde `san-martin-3d/index.html`. Si el navegador bloquea la lectura de GeoJSON por usar `file://`, la aplicación usa datos embebidos y volúmenes generados en memoria para evitar una pantalla en blanco.

Para probarla en condiciones similares a GitHub Pages, conviene servir el repositorio con un servidor estático:

```bash
python -m http.server 8000
```

Luego abrir:

http://localhost:8000/san-martin-3d/

## Archivos

- `index.html`: estructura mínima de la página y carga de MapLibre desde CDN.
- `styles.css`: estilos de pantalla completa, panel superior izquierdo, botones e indicador de estado.
- `app.js`: inicialización del mapa, carga de capas, controles de vista y fallbacks.
- `data/san_martin_boundary.geojson`: límite provisorio aproximado del partido.
- `data/buildings.geojson`: volúmenes urbanos simulados con propiedad `height`.

## Datos provisorios

El límite territorial incluido es aproximado y no debe usarse como dato oficial. Sirve solo para esta primera prueba visual.

Los volúmenes urbanos son simulados. No representan catastro real, alturas reales, huellas edilicias oficiales ni edificios de OpenStreetMap. Fueron distribuidos dentro del polígono aproximado para comprobar la vista 3D.

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

Una próxima versión debería incorporar límite oficial validado, edificios reales de OSM o catastro municipal, cálculo robusto de alturas, recorte exacto de edificios al límite del partido y controles para activar/desactivar capas analíticas futuras.
