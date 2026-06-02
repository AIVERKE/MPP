import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import ListarUnidades from '../views/MPP/ListarUnidades.vue'
import RegistrarUnidad from '../views/MPP/RegistrarUnidad.vue'
import TreeUnidades from '../views/MPP/TreeUnidades.vue'
import Login from '../views/Login.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: Login,
      meta: { requiresAuth: false }
    },
    {
      path: '/',
      name: 'home',
      component: () => import('../views/Home.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/usuarios',
      name: 'usuarios',
      component: () => import('../views/Usuarios.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/configuracion',
      name: 'configuracion',
      component: () => import('../views/Configuracion.vue'),
      meta: { requiresAuth: true }
    },
    {
      path:"/mpp/listar-unidades",
      name:'listar_unidades',
      component: ListarUnidades,
      meta: { requiresAuth: true }
    },
    {
        path:"/mpp/registrar-unidad",
        name:"registro_unidad",
        component: RegistrarUnidad,
        meta: { requiresAuth: true }
    },
    {
        path:"/mpp/arbol-unidades",
        name:"tree_unidades",
        component:TreeUnidades,
        meta: { requiresAuth: true }
    },
    {
        path:"/mpp/gestion-mpp",
        name:"gestion_mpp",
        component: () => import('../views/MPP/GestionEstructura.vue')
    },
    {
      path: "/mpp/diagrama-flujos",
      name: "diagrama_flujos",
      component: () => import('../views/MPP/DisenadorFlujos.vue'),
      meta: { requiresAuth: true }
    }
  ]
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } else if (to.name === 'login' && authStore.isAuthenticated) {
    next('/')
  } else {
    next()
  }
})

export default router