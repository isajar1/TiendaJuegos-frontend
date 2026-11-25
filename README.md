# TiendaJuegos-frontend

Cliente web (React 19 + TypeScript + Vite) para la tienda de juegos. Consume la API documentada en [`../TiendaJuegos-backend/API_ENDPOINTS.md`](../TiendaJuegos-backend/API_ENDPOINTS.md).

## Funcionalidad

- Catálogo público con búsqueda y filtros, detalle de juego y reseñas.
- Registro/inicio de sesión con sesión JWT persistida y expiración controlada.
- Carrito con cupón, pago simulado (aprobado/rechazado) y entrega de claves.
- Lista de deseos, historial de compras y panel de administración (juegos, claves, cupones, órdenes y reportes).
- Estilo visual basado en la pantalla de acceso original: degradados crema/verde azulado, tipografías DM Sans y Space Grotesk, tarjetas translúcidas y respeto a `prefers-reduced-motion`.

## Configuración

```powershell
npm ci
npm run dev
```

La variable opcional `VITE_API_URL` apunta al backend (por defecto se usa el mismo origen). En desarrollo Vite redirige `/api` al puerto 8080.

## Comandos de verificación

```powershell
npm run build
npm test
npm run test:coverage
```

### Estado verificado

- `npm run build`: **compilación correcta** (`tsc --noEmit` + Vite).
- `npm run lint`: **sin errores ni advertencias**.
- `npm test`: **36 tests** en 8 archivos, 0 fallos.
- Cobertura (Vitest + v8): **87,42 % de sentencias**, **84,12 % de ramas**, **84,93 % de funciones** y **87,74 % de líneas**. El reporte LCOV se genera en `coverage/lcov.info` para SonarQube.

Las pruebas E2E con Playwright requieren backend y MySQL en ejecución; no se ejecutaron en el entorno donde se generó este estado.
