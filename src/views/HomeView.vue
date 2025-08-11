<template>
  <main>
    <div class="header">
      <h1>Vue.js + Keycloak Test Frontend</h1>
      <p>Тестирование интеграции с Keycloak на внешнем сервере</p>
    </div>
    
    <AuthComponent />
  </main>
</template>

<script setup lang="ts">
import AuthComponent from '@/components/AuthComponent.vue'
</script>

<style scoped>
.header {
  text-align: center;
  padding: 40px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  margin-bottom: 40px;
}

.header h1 {
  font-size: 2.5rem;
  margin-bottom: 10px;
}

.header p {
  font-size: 1.2rem;
  opacity: 0.9;
}
</style>