import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { supabase } from '@/lib/supabase'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/HomeView.vue'),
  },
  {
    path: '/privacy',
    name: 'Privacy',
    component: () => import('@/views/PrivacyView.vue'),
    meta: { title: 'Privacy Policy' },
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/AuthView.vue'),
    meta: { title: 'Sign In' },
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/DashboardView.vue'),
    meta: { title: 'Dashboard', requiresAuth: true },
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/ProfileView.vue'),
    meta: { title: 'Profile' },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach(async (to) => {
  document.title = (to.meta.title as string) || 'Portal'
  if (to.meta.requiresAuth) {
    const { data } = await supabase.auth.getSession()
    if (!data.session) return '/login'
  }
})

export default router
