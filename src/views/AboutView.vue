<template>
  <div class="about">
    <h1>Защищенная страница</h1>
    
    <div v-if="!isUserAuthenticated" class="auth-required">
      <p>Для просмотра этой страницы требуется авторизация</p>
      <button @click="goToLogin" class="login-btn">
        Перейти к авторизации
      </button>
    </div>
    
    <div v-else class="protected-content">
      <h2>Добро пожаловать на защищенную страницу!</h2>
      
      <div class="user-details">
        <h3>Информация о пользователе:</h3>
        <ul>
          <li><strong>ID:</strong> {{ userInfo?.sub }}</li>
          <li><strong>Имя пользователя:</strong> {{ userInfo?.preferred_username }}</li>
          <li><strong>Email:</strong> {{ userInfo?.email }}</li>
          <li><strong>Имя:</strong> {{ userInfo?.name }}</li>
          <li><strong>Роли:</strong> {{ userRoles }}</li>
        </ul>
      </div>
      
      <div class="api-section">
        <h3>Тестирование API:</h3>
        <button @click="testProtectedApi" class="api-btn" :disabled="loading">
          {{ loading ? 'Загрузка...' : 'Вызвать /api/user' }}
        </button>
        
        <div v-if="apiData" class="api-result">
          <h4>Результат:</h4>
          <pre>{{ JSON.stringify(apiData, null, 2) }}</pre>
        </div>
        
        <div v-if="error" class="error">
          <h4>Ошибка:</h4>
          <p>{{ error }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { isAuthenticated, getUserInfo } from '@/services/keycloak'
import { apiClient } from '@/services/api'

const router = useRouter()
const isUserAuthenticated = ref(false)
const userInfo = ref<any>(null)
const apiData = ref<any>(null)
const error = ref<string>('')
const loading = ref(false)

const userRoles = computed(() => {
  if (userInfo.value?.realm_access?.roles) {
    return userInfo.value.realm_access.roles.join(', ')
  }
  return 'Нет ролей'
})

const goToLogin = () => {
  router.push('/')
}

const testProtectedApi = async () => {
  loading.value = true
  error.value = ''
  apiData.value = null
  
  try {
    const response = await apiClient.get('/user')
    apiData.value = response
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Произошла ошибка'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  isUserAuthenticated.value = isAuthenticated()
  userInfo.value = getUserInfo()
})
</script>

<style scoped>
.about {
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 20px;
}

.auth-required {
  text-align: center;
  padding: 60px 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.login-btn, .api-btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  margin-top: 20px;
}

.login-btn:hover, .api-btn:hover:not(:disabled) {
  background: #0056b3;
}

.api-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.protected-content {
  background: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.user-details {
  background: #e7f3ff;
  padding: 20px;
  border-radius: 6px;
  margin: 20px 0;
}

.user-details ul {
  list-style: none;
  padding: 0;
}

.user-details li {
  margin: 8px 0;
  padding: 5px 0;
  border-bottom: 1px solid #ddd;
}

.api-section {
  margin-top: 30px;
  padding-top: 30px;
  border-top: 1px solid #eee;
}

.api-result {
  background: #d4edda;
  border: 1px solid #c3e6cb;
  border-radius: 4px;
  padding: 15px;
  margin-top: 15px;
}

.api-result pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.error {
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
  padding: 15px;
  margin-top: 15px;
  color: #721c24;
}
</style>