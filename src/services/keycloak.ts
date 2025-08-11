import Keycloak from 'keycloak-js'

const keycloakConfig = {
  url: 'http://192.168.0.114:8080',
  realm: 'service360',
  clientId: 'vue-app'
}

const keycloak = new Keycloak(keycloakConfig)

export const initKeycloak = async (): Promise<boolean> => {
  // Сначала проверяем, есть ли callback от Keycloak в URL
  const urlParams = new URLSearchParams(window.location.search)
  const hasAuthCallback = urlParams.has('code') && urlParams.has('state')
  
  if (hasAuthCallback) {
    console.log('Processing auth callback...')
    const success = await handleAuthCallback()
    if (success) {
      console.log('Successfully processed auth callback')
      return true
    }
  }
  
  try {
    // Простая инициализация без onLoad
    const authenticated = await keycloak.init({
      checkLoginIframe: false,
      enableLogging: true
    })
    
    console.log('Keycloak initialized, authenticated:', authenticated)
    
    // Дополнительно проверяем сохраненный токен
    const storedToken = sessionStorage.getItem('keycloak-token')
    if (storedToken && !authenticated) {
      console.log('Found stored token, user should be authenticated')
      return true
    }
    
    return authenticated
  } catch (error) {
    console.error('Failed to initialize Keycloak:', error)
    // Проверяем сохраненный токен как fallback
    const storedToken = sessionStorage.getItem('keycloak-token')
    return !!storedToken
  }
}

export const loginKeycloak = () => {
  console.log('Initiating login manually')
  
  // Создаем URL вручную без использования keycloak.login()
  const baseUrl = keycloakConfig.url
  const realm = keycloakConfig.realm
  const clientId = keycloakConfig.clientId
  const redirectUri = encodeURIComponent(window.location.origin + '/')
  const state = Math.random().toString(36).substring(2, 15)
  
  // Сохраняем state в sessionStorage для проверки
  sessionStorage.setItem('keycloak-state', state)
  
  const loginUrl = `${baseUrl}/realms/${realm}/protocol/openid-connect/auth?` +
    `client_id=${clientId}&` +
    `redirect_uri=${redirectUri}&` +
    `response_type=code&` +
    `scope=openid profile email&` +
    `state=${state}`
  
  console.log('Redirecting to:', loginUrl)
  window.location.href = loginUrl
}

export const logoutKeycloak = () => {
  const baseUrl = keycloakConfig.url
  const realm = keycloakConfig.realm
  const redirectUri = encodeURIComponent(window.location.origin + '/')
  
  const logoutUrl = `${baseUrl}/realms/${realm}/protocol/openid-connect/logout?redirect_uri=${redirectUri}`
  
  // Очищаем токены
  sessionStorage.removeItem('keycloak-token')
  sessionStorage.removeItem('keycloak-refresh-token')
  sessionStorage.removeItem('keycloak-user-info')
  
  window.location.href = logoutUrl
}

export const getToken = (): string | undefined => {
  return sessionStorage.getItem('keycloak-token') || keycloak.token
}

export const isAuthenticated = (): boolean => {
  return !!(sessionStorage.getItem('keycloak-token') || keycloak.authenticated)
}

export const getUserInfo = () => {
  const stored = sessionStorage.getItem('keycloak-user-info')
  if (stored) {
    return JSON.parse(stored)
  }
  return keycloak.tokenParsed
}

// Функция для обработки callback после логина
export const handleAuthCallback = async (): Promise<boolean> => {
  const urlParams = new URLSearchParams(window.location.search)
  const code = urlParams.get('code')
  const state = urlParams.get('state')
  const storedState = sessionStorage.getItem('keycloak-state')
  
  console.log('Processing callback - Code:', !!code, 'State match:', state === storedState)
  
  if (code && state === storedState) {
    try {
      // Обмениваем code на токен
      const tokenData = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: keycloakConfig.clientId,
        code: code,
        redirect_uri: window.location.origin + '/'
      })
      
      console.log('Exchanging code for token...')
      
      const tokenResponse = await fetch(`${keycloakConfig.url}/realms/${keycloakConfig.realm}/protocol/openid-connect/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: tokenData
      })
      
      console.log('Token response status:', tokenResponse.status)
      
      if (tokenResponse.ok) {
        const tokens = await tokenResponse.json()
        console.log('Received tokens:', !!tokens.access_token)
        
        // Сохраняем токены
        sessionStorage.setItem('keycloak-token', tokens.access_token)
        if (tokens.refresh_token) {
          sessionStorage.setItem('keycloak-refresh-token', tokens.refresh_token)
        }
        
        // Декодируем и сохраняем информацию о пользователе
        try {
          const userInfo = JSON.parse(atob(tokens.access_token.split('.')[1]))
          sessionStorage.setItem('keycloak-user-info', JSON.stringify(userInfo))
          console.log('User info saved:', userInfo.preferred_username)
        } catch (e) {
          console.error('Failed to decode user info:', e)
        }
        
        // Очищаем state и URL параметры
        sessionStorage.removeItem('keycloak-state')
        window.history.replaceState({}, document.title, window.location.pathname)
        
        return true
      } else {
        const errorText = await tokenResponse.text()
        console.error('Token exchange failed:', tokenResponse.status, errorText)
      }
    } catch (error) {
      console.error('Token exchange error:', error)
    }
  } else {
    console.log('Invalid callback - missing code or state mismatch')
  }
  
  return false
}

export default keycloak