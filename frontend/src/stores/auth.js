import { defineStore } from 'pinia'
import { ref } from 'vue'
import router from '../router'

export const useAuthStore = defineStore('auth', () => {
  const isAuthenticated = ref(localStorage.getItem('auth') === 'true')
  const user = ref(JSON.parse(localStorage.getItem('user')) || null)

  const login = (credentials) => {
    // Aceptamos cualquier credencial por ahora, como solicitaste
    isAuthenticated.value = true
    user.value = { name: credentials.username || 'Usuario' }
    
    localStorage.setItem('auth', 'true')
    localStorage.setItem('user', JSON.stringify(user.value))
    
    router.push('/')
  }

  const logout = () => {
    isAuthenticated.value = false
    user.value = null
    localStorage.removeItem('auth')
    localStorage.removeItem('user')
    router.push('/login')
  }

  return {
    isAuthenticated,
    user,
    login,
    logout
  }
})
