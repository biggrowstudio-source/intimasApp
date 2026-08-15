import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router'
import { pinia } from './plugins/pinia'
import { installQuery } from './plugins/query'
import { installComponents } from './plugins/components'
import './styles/global.css'

const app = createApp(App)

app.use(pinia)
app.use(router)
installComponents(app)
installQuery(app)

app.mount('#app')
