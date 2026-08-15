# Intimas App

Aplicación oficial para la comunidad de embajadoras de **Intimas By Lorena**. Construida con Vue 3, Vite, TypeScript y Supabase.

---

## Stack

- **Vue 3** + Composition API + `<script setup>`
- **Vite 8** + TypeScript estricto
- **Vue Router 4** con rutas autenticadas y panel admin
- **Pinia** para estado global (auth, UI, settings)
- **TanStack Query (Vue)** para datos del servidor con cache automático
- **Supabase** como BaaS (Postgres, Auth, Storage, Realtime)
- **TailwindCSS 3** con Design System completo (tokens del blueprint)
- **Motion One** para animaciones
- **Heroicons** para iconografía
- **Zod** para validación
- **Day.js** para fechas

## Arquitectura

- **Feature Driven**: cada módulo (`home`, `library`, `planner`, etc.) contiene `components`, `views`, `services`, `composables`, `types`, `validators` y `store`.
- **Sin acceso directo a Supabase** desde componentes ni vistas. Toda interacción pasa por `services/`.
- **Datos del servidor** exclusivamente vía TanStack Query.
- **Estado global** únicamente vía Pinia.
- **Pinia nunca almacena datos del servidor**.
- **Mobile first**, breakpoints: 320 / 375 / 430 / 768 / 1024 / 1440.

## Estructura

```
src/
├── assets/
├── components/
│   ├── base/          # Design System (Button, Input, Card, Modal, etc.)
│   └── layout/        # BottomNav, etc.
├── composables/
├── layouts/           # AppLayout, AuthLayout, FullScreenLayout
├── modules/           # home, library, planner, community, workshops,
│                      # resources, womens-circle, recognitions, profile,
│                      # notifications, help, admin
├── plugins/           # pinia, query
├── router/
├── services/
│   └── supabase/      # auth.service.ts (única capa que habla con Supabase desde cada módulo)
├── stores/            # auth, ui, settings
├── styles/
├── supabase/
│   ├── client.ts
│   ├── database.types.ts
│   └── migrations/    # 0001_init.sql, 0002_storage.sql
├── types/
├── utils/
└── views/             # Auth views + vistas globales
```

## Módulos

| Fase | Módulo | Vista principal |
|------|--------|-----------------|
| 1 | Home | `HomeView` |
| 1 | Biblioteca | `LibraryView` |
| 1 | Planeador | `PlannerView` + `CalendarFullView` |
| 1 | Comunidad | `CommunityView` |
| 2 | Workshops | `WorkshopsView` + `WorkshopDetailView` |
| 2 | Recursos | `ResourcesView` |
| 2 | Women's Circle | `WomensCircleView` |
| 2 | Perfil | `ProfileView`, edit, achievements, settings, security |
| 3 | Reconocimientos | `RecognitionsView` |
| 4 | Notificaciones | `NotificationsView` |
| 4 | Centro de Ayuda | `HelpView` |
| – | Admin | `AdminDashboardView` + 7 secciones |
| – | Auth | Login, Register, Recover |

## Configuración

1. Copia `.env.example` a `.env`:

```bash
cp .env.example .env
```

2. Configura las credenciales de Supabase:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
```

3. Aplica las migraciones SQL en el editor SQL de Supabase:

- `src/supabase/migrations/0001_init.sql` — Tablas, enums, triggers, funciones y políticas RLS completas.
- `src/supabase/migrations/0002_storage.sql` — Políticas de storage para los buckets `avatars`, `documents`, `posts`, `videos`, `resources`, `catalogs`, `certificates`.

4. Crea los buckets manualmente desde la UI de Supabase Storage con los nombres listados arriba.

## Scripts

```bash
pnpm install      # Instalar dependencias
pnpm dev          # Servidor de desarrollo
pnpm build        # Build de producción
pnpm preview      # Preview del build
pnpm type-check   # Verificación de tipos TypeScript
```

## Convenciones

- **Código en inglés**, contenido en español.
- Variables y funciones en `camelCase`, componentes en `PascalCase`.
- Composables con prefijo `use`.
- Servicios con sufijo `.service.ts`, tipos con `.types.ts`, validadores con `.schema.ts`.
- Carpetas en `kebab-case`.
- Sin emojis en código.
- Cada acceso a Supabase pasa por un Service.
- Cada consulta a la base de datos pasa por TanStack Query.
- Cada componente interactivo tiene label accesible y contraste WCAG AA.

## Roles

- **Ambassador**: lectura biblioteca, crear publicaciones, gestionar planeador y perfil.
- **Moderator**: moderar comunidad, revisar reportes.
- **Admin**: gestión completa de contenido, workshops, recursos, biblioteca.
- **Super Admin**: acceso total.

## Próximos pasos

- Fase 5: integraciones de IA, mentor virtual, analíticas.
- Notificaciones push vía Edge Functions.
- Integración OAuth (Google, Apple).
- Marketplace y pagos (Stripe).
