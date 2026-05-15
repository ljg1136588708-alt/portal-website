import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'
import router from './router'
import App from './App.vue'
import './assets/styles/global.css'

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

createApp(App).use(pinia).use(router).use(Antd).mount('#app')
