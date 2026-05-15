import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

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
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach((to) => {
  document.title = (to.meta.title as string) || 'Portal'
})

export default router
