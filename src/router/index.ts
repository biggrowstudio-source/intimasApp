import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@stores/auth.store'

const routes: RouteRecordRaw[] = [
  {
    path: '/auth',
    component: () => import('@layouts/AuthLayout.vue'),
    meta: { public: true, layout: 'auth' },
    children: [
      { path: 'login', name: 'login', component: () => import('@views/auth/LoginView.vue') },
      { path: 'registro', name: 'register', component: () => import('@views/auth/RegisterView.vue') },
      { path: 'recuperar', name: 'recover', component: () => import('@views/auth/RecoverView.vue') },
      { path: '', redirect: { name: 'login' } },
    ],
  },
  {
    path: '/',
    component: () => import('@layouts/AppLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', name: 'home', component: () => import('@views/HomeView.vue') },
      { path: 'biblioteca', name: 'library', component: () => import('@views/LibraryView.vue') },
      { path: 'planeador', name: 'planner', component: () => import('@views/PlannerView.vue') },
      { path: 'comunidad', name: 'community', component: () => import('@views/CommunityView.vue') },
      { path: 'workshops', name: 'workshops', component: () => import('@views/WorkshopsView.vue') },
      { path: 'recursos', name: 'resources', component: () => import('@views/ResourcesView.vue') },
      { path: 'ordenes', name: 'orders', component: () => import('@views/OrdersView.vue') },
      { path: 'ventas', redirect: '/admin/ventas' },
      { path: 'womens-circle', name: 'womens-circle', component: () => import('@views/WomensCircleView.vue') },

      { path: 'reconocimientos', name: 'recognitions', component: () => import('@views/RecognitionsView.vue') },
      { path: 'perfil', name: 'profile', component: () => import('@views/ProfileView.vue') },
      { path: 'perfil/logros', name: 'profile-achievements', component: () => import('@views/ProfileAchievementsView.vue') },
      { path: 'perfil/editar', name: 'profile-edit', component: () => import('@views/ProfileEditView.vue') },
      { path: 'perfil/configuracion', name: 'profile-settings', component: () => import('@views/ProfileSettingsView.vue') },
      { path: 'perfil/seguridad', name: 'profile-security', component: () => import('@views/ProfileSecurityView.vue') },
      { path: 'perfil/:userId', name: 'profile-view', component: () => import('@views/ProfileView.vue') },
      { path: 'notificaciones', name: 'notifications', component: () => import('@views/NotificationsView.vue') },
      { path: 'ayuda', name: 'help', component: () => import('@views/HelpView.vue') },
    ],
  },
  {
    path: '/admin',
    component: () => import('@layouts/AppLayout.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      { path: '', name: 'admin', component: () => import('@modules/admin/views/AdminDashboardView.vue') },
      { path: 'usuarios', name: 'admin-users', component: () => import('@modules/admin/views/AdminUsersView.vue') },
      { path: 'usuarios/:id', name: 'admin-user-detail', component: () => import('@modules/admin/views/AdminUserDetailView.vue') },
      { path: 'ordenes', name: 'admin-orders', component: () => import('@modules/admin/views/AdminOrdersView.vue') },
      { path: 'biblioteca', name: 'admin-library', redirect: '/biblioteca' },
      { path: 'workshops', name: 'admin-workshops', component: () => import('@modules/admin/views/AdminWorkshopsView.vue') },
      { path: 'comunidad', name: 'admin-community', redirect: '/comunidad' },
      { path: 'recursos', name: 'admin-resources', redirect: '/biblioteca' },
      { path: 'reconocimientos', name: 'admin-recognitions', component: () => import('@modules/admin/views/AdminRecognitionsView.vue') },
      { path: 'contenido', name: 'admin-content', component: () => import('@modules/admin/views/AdminContentView.vue') },
      { path: 'eventos', name: 'admin-events', component: () => import('@modules/admin/views/AdminEventsView.vue') },
      { path: 'comisiones', name: 'admin-commissions', component: () => import('@modules/admin/views/AdminCommissionsView.vue') },
      { path: 'ventas', name: 'admin-sales', component: () => import('@modules/admin/views/AdminSalesView.vue') },
      { path: 'configuracion', name: 'admin-settings', component: () => import('@modules/admin/views/AdminSettingsView.vue') },
    ],
  },

  {
    path: '/full',
    component: () => import('@layouts/FullScreenLayout.vue'),
    meta: { public: true, layout: 'full' },
    children: [
      { path: 'pdf/:documentId', name: 'pdf-viewer', component: () => import('@views/PdfViewerView.vue') },
      { path: 'video/:resourceId', name: 'video-viewer', component: () => import('@views/VideoViewerView.vue') },
      { path: 'workshop/:workshopId', name: 'workshop-detail', redirect: (to) => ({ path: '/workshops', query: { detail: to.params.workshopId } }) },
      { path: 'calendario', name: 'calendar-full', component: () => import('@views/CalendarFullView.vue') },
    ],
  },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@views/NotFoundView.vue'), meta: { public: true } },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  if (!auth.initialized) {
    await auth.initialize()
  }

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (to.meta.requiresAdmin) {
    const role = auth.role
    if (role !== 'admin' && role !== 'super_admin') {
      return { name: 'home' }
    }
  }

  if (auth.isAuthenticated && to.name === 'login') {
    return { name: 'home' }
  }

  return true
})
