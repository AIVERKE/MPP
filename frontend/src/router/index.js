import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
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
        path:"/mpp/gestion-mpp",
        name:"cabecera_mpp",
        component: () => import('../views/MPP/CabeceraMpp.vue'),
        meta: { requiresAuth: true }
    },
    {
        path:"/mpp/historial-mpp",
        name:"historial_mpp",
        component: () => import('../views/MPP/HistorialMpp.vue'),
        meta: { requiresAuth: true }
    },
    // Rutas MOF del repositorio anterior
    {
      path: '/reportes/ejecutivo',
      name: 'dashboard_ejecutivo',
      component: () => import('../views/MOF/DashboardEjecutivo.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/reportes/facultativo',
      name: 'dashboard_facultativo',
      component: () => import('../views/MOF/DashboardFacultativo.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: "/mof/listar-unidades",
      name: 'mof_listar_unidades',
      component: () => import('../views/MOF/ListarUnidades.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: "/mof/registrar-unidad",
      name: "mof_registro_unidad",
      component: () => import('../views/MOF/RegistrarUnidad.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: "/mof/arbol-unidades",
      name: "mof_tree_unidades",
      component: () => import('../views/MOF/TreeUnidades.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: "/mof/organigrama-unidades",
      name: "organigrama_unidades",
      component: () => import('../views/MOF/OrganigramaVueFlow.vue'),
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