import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import './style.css'

// GitHub Pages SPA fallback: 404.html redirects back with ?redirect=/workspace
const params = new URLSearchParams(window.location.search)
const redirect = params.get('redirect')
if (redirect) {
  const target = new URL(redirect, window.location.origin)
  const cleanSearch = target.search
  const cleanHash = target.hash
  window.history.replaceState({}, '', target.pathname + cleanSearch + cleanHash)
}

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
