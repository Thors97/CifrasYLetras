# Cifras y Letras

Juego de Cifras y Letras en castellano, con las normas del concurso. Se juega solo, por equipos con un dispositivo o con varios móviles en una sala.

## Cómo abrirlo

Abre `index.html` en el navegador (con doble clic vale) o publica la carpeta en cualquier web estática, como GitHub Pages. No hay que instalar ni compilar nada.

El modo "Varios móviles" necesita conexión a internet y que el juego esté publicado en una web.

## Jugar con una pantalla grande

Una tele, un portátil o un proyector puede enseñar el tablero mientras cada jugador responde con su móvil:

1. En el dispositivo grande, elige «Varios móviles» → «Crear una sala en una pantalla grande». También puedes abrir directamente `…/#pantalla`.
2. Los jugadores escanean el código QR (o escriben el código de 4 letras) desde su móvil.
3. La pantalla y el primer jugador que entró manejan «Empezar» y «Siguiente».

## Estructura

| Ruta | Contenido |
|---|---|
| `index.html` | Estructura de la página y orden de carga de los scripts. |
| `css/estilos.css` | Estilos, con tema claro y oscuro. |
| `js/` | Código del juego, un archivo por parte. Son scripts clásicos (no módulos), que comparten el ámbito global y se cargan en el orden de `index.html`. |
| `js/vendor/qrcode.js` | Generador de códigos QR ([qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator), licencia MIT). |
| `diccionario/palabras.txt` | Lista base de palabras: una por línea, en minúsculas y con tildes. |
| `diccionario/añadidas.txt` | Palabras que añadimos a la lista base. |
| `diccionario/excluidas.txt` | Palabras que quitamos de la lista base. |
| `diccionario/datos.js` | Diccionario comprimido que carga el juego. **Se genera; no se edita a mano.** |
| `scripts/generar-diccionario.js` | Genera `datos.js` a partir de los `.txt`. |

## Cambiar el diccionario

1. Añade palabras en `diccionario/añadidas.txt` o quítalas con `diccionario/excluidas.txt`, una por línea. Las líneas que empiezan por `#` son comentarios.
2. Regenera el diccionario (hace falta Node.js):

   ```
   node scripts/generar-diccionario.js
   ```

3. Sube los `.txt` y el `datos.js` generado en el mismo commit.

Solo se admiten palabras de 5 a 10 letras.

## Planificación

- [PROXIMOS_PASOS.md](PROXIMOS_PASOS.md): plan de trabajo por fases.
- [ANALISIS.md](ANALISIS.md): análisis técnico y mejoras pendientes.
