<template>
  <div id="app">
    <header>
      <nav class="navbar">
        <div class="nav-brand">
          <RouterLink to="/">Vue Keycloak Test</RouterLink>
        </div>
        <div class="nav-links">
          <RouterLink to="/">Главная</RouterLink>
          <RouterLink to="/about">Защищенная страница</RouterLink>
        </div>
        <div v-if="isUserAuthenticated" class="user-info">
          Привет, {{ userName }}!
        </div>
      </nav>
    </header>

    <main>
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { ref, computed, onMounted } from 'vue'
import { isAuthenticated, getUserInfo } from '@/services/keycloak'

const isUserAuthenticated = ref(false)
const userInfo = ref<any>(null)

const userName = computed(() => {
  return userInfo.value?.preferred_username || 'Пользователь'
})

const updateAuthState = () => {
  isUserAuthenticated.value = isAuthenticated()
  userInfo.value = getUserInfo()
}

onMounted(() => {
  updateAuthState()
  setInterval(updateAuthState, 5000)
})
</script>

<style scoped>
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: #2c3e50;
  color: white;
}

.nav-brand a {
  font-size: 1.5rem;
  font-weight: bold;
  color: white;
  text-decoration: none;
}

.nav-links {
  display: flex;
  gap: 2rem;
}

.nav-links a {
  color: white;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.nav-links a:hover,
.nav-links a.router-link-active {
  background-color: #34495e;
}

.user-info {
  font-size: 0.9rem;
  opacity: 0.9;
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}

main {
  min-height: calc(100vh - 80px);
}
</style>