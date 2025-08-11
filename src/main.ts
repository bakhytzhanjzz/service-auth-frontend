import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { initKeycloak } from './services/keycloak'

const app = createApp(App)

app.use(createPinia())
app.use(router)

// Инициализируем Keycloak перед монтированием приложения
initKeycloak().then(() => {
  app.mount('#app')
}).catch(error => {
  console.error('Failed to initialize the app:', error)
})