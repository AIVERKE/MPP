import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import * as labsComponents from 'vuetify/labs/components'
import '@mdi/font/css/materialdesignicons.css'
// Idioma español (completo)
import { es } from 'vuetify/locale'

// Temas y defaults institucionales TIC-FCPN (MOF)
import { themes } from './themes'
import { vuetifyDefaults } from '@/config/designSystem'

const vuetify = createVuetify({
  components: {
    ...components,
    ...labsComponents,
  },
  directives,
  defaults: vuetifyDefaults,
  locale: {
    locale: 'es',
    fallback: 'es', // fuerza todo a español
    messages: { es },
  },
  theme: {
    defaultTheme: 'light',
    themes,
  },
})

export default vuetify
