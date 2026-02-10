# Gestión de Proyectos de Aplicaciones TI

Aplicación para gestionar solicitudes de entrada (Incidencias, Mejoras, Proyectos) con priorización objetiva y tablero de transparencia. Angular 18+ (Standalone, Signals) + TailwindCSS; preparada para Supabase (Auth, PostgreSQL, tiempo real).

## Estructura

- **Portal del Solicitante** (`/submissions`): formulario de solicitudes y "Mis Solicitudes".
- **Matriz de Priorización** (`/prioritization`, solo developer/admin): matriz de Eisenhower con drag-and-drop.
- **Dashboard** (`/dashboard`): enfoque del equipo, cola de prioridades y métricas.

## Credenciales y Supabase

1. Copia `src/environments/environment.example.ts` a `src/environments/environment.ts` (y `environment.prod.ts` para producción).
2. Sustituye `YOUR_SUPABASE_URL`, `YOUR_SUPABASE_ANON_KEY` y `allowedEmailDomain` por los valores de tu proyecto Supabase.
3. En el **SQL Editor** de Supabase, ejecuta el script `supabase/schema.sql` para crear tablas, enums, RLS, triggers y funciones.

Sin configurar Supabase, la app funciona con **datos mock** (login simulado y solicitudes de ejemplo).

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
