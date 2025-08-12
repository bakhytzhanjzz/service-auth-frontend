<template>
  <div class="auth-container">
    <div class="auth-card">
      <h2>Авторизация</h2>

      <div v-if="!isUserAuthenticated" class="login-section">
        <p>Для доступа к приложению необходимо войти в систему</p>
        <button @click="handleLogin" class="login-btn">
          Войти через SSO
        </button>
      </div>

      <div v-else class="user-info">
        <h3>Добро пожаловать!</h3>
        <p><strong>Пользователь:</strong> {{ userInfo?.preferred_username || 'N/A' }}</p>
        <p><strong>Email:</strong> {{ userInfo?.email || 'N/A' }}</p>
        <p><strong>Роли:</strong> {{ userRoles }}</p>

        <div class="token-section">
          <h4>Access Token:</h4>
          <textarea
            :value="token"
            readonly
            rows="4"
            class="token-display"
            placeholder="Токен не получен"
          ></textarea>
        </div>

        <div class="actions">
          <button @click="handleLogout" class="logout-btn">
            Выйти
          </button>
          <button @click="testApi" class="test-btn" :disabled="apiLoading">
            {{ apiLoading ? 'Загрузка...' : 'Тест API /api/user' }}
          </button>
        </div>

        <div v-if="apiResponse" class="api-response">
          <h4>Ответ API:</h4>
          <pre>{{ JSON.stringify(apiResponse, null, 2) }}</pre>
        </div>

        <div v-if="apiError" class="api-error">
          <h4>Ошибка API:</h4>
          <p>{{ apiError }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  loginKeycloak,
  logoutKeycloak,
  isAuthenticated,
  getToken,
  getUserInfo
} from '@/services/keycloak'
import { apiClient } from '@/services/api'

const isUserAuthenticated = ref(false)
const token = ref<string | undefined>('')
const userInfo = ref<any>(null)
const apiResponse = ref<any>(null)
const apiError = ref<string>('')
const apiLoading = ref(false)

const userRoles = computed(() => {
  if (userInfo.value?.realm_access?.roles) {
    return userInfo.value.realm_access.roles.join(', ')
  }
  return 'Нет ролей'
})

const handleLogin = () => {
  loginKeycloak()
}

const handleLogout = () => {
  logoutKeycloak()
}

const testApi = async () => {
  apiLoading.value = true
  apiError.value = ''
  apiResponse.value = null

  try {
    const response = await apiClient.get('/user')
    apiResponse.value = response
  } catch (error) {
    apiError.value = error instanceof Error ? error.message : 'Произошла ошибка'
  } finally {
    apiLoading.value = false
  }
}

const updateAuthState = () => {
  const wasAuthenticated = isUserAuthenticated.value
  isUserAuthenticated.value = isAuthenticated()
  token.value = getToken()
  userInfo.value = getUserInfo()

  // Логируем изменения состояния
  if (wasAuthenticated !== isUserAuthenticated.value) {
    console.log('Auth state changed:', isUserAuthenticated.value)
  }
}

// Слушаем изменения в sessionStorage (на случай обновления токенов)
const handleStorageChange = (e: StorageEvent) => {
  if (e.key?.startsWith('keycloak-')) {
    console.log('Storage changed:', e.key)
    updateAuthState()
  }
}

let intervalId: number

onMounted(() => {
  updateAuthState()

  // Проверяем состояние каждые 2 секунды
  intervalId = setInterval(updateAuthState, 2000)

  // Слушаем изменения в sessionStorage
  window.addEventListener('storage', handleStorageChange)

  // Также проверяем при получении фокуса окна
  window.addEventListener('focus', updateAuthState)
})

onUnmounted(() => {
  if (intervalId) {
    clearInterval(intervalId)
  }
  window.removeEventListener('storage', handleStorageChange)
  window.removeEventListener('focus', updateAuthState)
})
</script>

<style scoped>
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
  padding: 20px;
}

.auth-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 30px;
  max-width: 600px;
  width: 100%;
}

.login-section {
  text-align: center;
}

.login-btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  margin-top: 20px;
}

.login-btn:hover {
  background: #0056b3;
}

.user-info h3 {
  color: #28a745;
  margin-bottom: 20px;
}

.token-section {
  margin: 20px 0;
}

.token-display {
  width: 100%;
  font-family: monospace;
  font-size: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 10px;
  resize: vertical;
}

.actions {
  display: flex;
  gap: 10px;
  margin: 20px 0;
}

.logout-btn {
  background: #dc3545;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
}

.logout-btn:hover {
  background: #c82333;
}

.test-btn {
  background: #28a745;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
}

.test-btn:hover:not(:disabled) {
  background: #218838;
}

.test-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.api-response {
  background: #d4edda;
  border: 1px solid #c3e6cb;
  border-radius: 4px;
  padding: 15px;
  margin-top: 20px;
}

.api-response pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.api-error {
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
  padding: 15px;
  margin-top: 20px;
  color: #721c24;
}
</style>
