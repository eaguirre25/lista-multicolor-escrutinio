# General San Martín 3D

Visualización estática en 3D del Partido de General San Martín usando MapLibre GL JS.

## ¿Qué es esta prueba?
Es una maqueta funcional de un mapa 3D centrado en el Partido de General San Martín, Buenos Aires. Está diseñado con tecnologías web estándar (HTML, CSS, JS) sin dependencias de Node.js ni build steps, lo que permite un renderizado estable y rápido directamente en GitHub Pages.

## ¿Cómo verla localmente?
1. Cloná o descargá el repositorio.
2. Abrí una terminal en la carpeta raíz del proyecto.
3. Iniciá un servidor local estático. Por ejemplo, si tenés Python:
   ```bash
   python -m http.server 8000
   ```
4. Navegá a `http://localhost:8000/san-martin-3d/index.html`.

*Nota: No se recomienda abrir el archivo index.html directamente con doble clic (protocolo `file://`) debido a las restricciones de seguridad CORS del navegador al cargar los archivos GeoJSON locales.*

## ¿Cómo verla publicada en GitHub Pages?
Si este proyecto está subido a la rama principal de GitHub y Pages está activado desde los ajustes del repositorio, se podrá acceder en:
`https://eaguirre25.github.io/lista-multicolor-escrutinio/san-martin-3d/`

## Archivos que utiliza
- `index.html`: Estructura base de la página.
- `styles.css`: Estilos visuales del mapa y el panel de control.
- `app.js`: Lógica de inicialización de MapLibre, configuración de capas 3D y eventos de botones.
- `data/san_martin_boundary.geojson`: Límite administrativo.
- `data/buildings.geojson`: Volúmenes urbanos 3D.

## Datos Provisorios
Para garantizar la estabilidad y el correcto funcionamiento en GitHub Pages sin depender de APIs externas inestables, los datos en la carpeta `data/` son actualmente **geometrías provisorias (mock data)** generadas proceduralmente dentro de un bounding box aproximado de General San Martín. 

## ¿Cómo reemplazar por datos reales en el futuro?

### 1. Reemplazar el límite aproximado por uno oficial
- Descargá el límite oficial de General San Martín en formato GeoJSON (desde IGN, OpenStreetMap, o Datos Abiertos).
- Reemplazá el archivo existente en `data/san_martin_boundary.geojson` con el nuevo archivo.

### 2. Reemplazar edificios simulados por reales (OSM)
- Usá una herramienta como [Overpass Turbo](https://overpass-turbo.eu/) para extraer los edificios de la zona de San Martín usando esta consulta:
  ```overpass
  [out:json][timeout:50];
  area["name"="General San Martín"]["admin_level"="8"]->.a;
  (
    way["building"](area.a);
    relation["building"](area.a);
  );
  out body;
  >;
  out skel qt;
  ```
- Exportá el resultado como GeoJSON.
- Renombrá el archivo a `buildings.geojson` y reemplazá el archivo actual en la carpeta `data/`.
- Asegurate de que los features tengan la propiedad `height` o `building:levels`. Si el script `app.js` necesita ajustes para leer la altura, podés modificar la expresión `['get', 'height']` en la capa `urban-volume`.
