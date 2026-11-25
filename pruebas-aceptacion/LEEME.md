# Pruebas de aceptación de la Tienda de Juegos

Los diez escenarios de criterios.feature se corresponden por número con los diez casos ejecutables de tienda.spec.ts. Los casos 03 y 10 comprueban errores esperados. Playwright automatiza el navegador y utiliza la API de la tienda para preparar datos independientes antes de las interacciones. El frontend y el backend son los del proyecto. El perfil de pruebas arranca Spring Boot con H2 temporal en modo MySQL, en lugar de usar el inventario compartido. Esta ejecución no certifica el esquema ni la conectividad de la base MySQL del grupo.

## Ejecutar desde Codespaces

Se necesita el frontend en /workspaces/TiendaJuegos-frontend (rama base main), el backend en /workspaces/TiendaJuegos-backend (JHOJAN), Java 21 y las dependencias del frontend instaladas con npm ci. Si el backend está en otra carpeta, configura TIENDA_BACKEND con su ruta absoluta. Extrae este ZIP en la raíz del frontend, junto a package.json. Desde allí ejecuta:

    npm pkg set 'scripts.tests:e2e=playwright test -c playwright.aceptacion.config.ts'
    npx playwright install --with-deps chromium
    npm run tests:e2e

El paquete agrega una configuración independiente. Mantiene disponible la prueba anterior con npm run test:e2e. La tienda habitual puede seguir en sus puertos 5173 y 8080. La suite inicia servicios propios en 15173 y 18080, cerrados al terminar. Durante la primera ejecución se descargan las dependencias de Maven y el controlador H2. Las cuentas, claves y juegos son ficticios. Se recrean con cada ejecución.

## Repetir un caso y ver la evidencia

    npm run tests:e2e -- -g '03 HU-02'
    npx playwright show-report --host 0.0.0.0 --port 9323

En Codespaces abre el puerto 9323 para ver el reporte HTML de la última ejecución. Ejecuta la suite completa antes de guardar la evidencia final. Los casos fallidos incluyen captura y traza para diagnóstico. El informe indica el resultado de cada caso. Para compartir los cambios con el equipo, incluye package.json, playwright.aceptacion.config.ts y pruebas-aceptacion en tu rama.
