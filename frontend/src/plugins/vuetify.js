import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import * as labsComponents from 'vuetify/labs/components'
import '@mdi/font/css/materialdesignicons.css'
// Idioma español (completo)
import { es } from 'vuetify/locale'

const vuetify = createVuetify({
    components: {
        ...components,
        ...labsComponents
    },
    directives,
    locale: {
        locale: "es",
        fallback: 'es',   // fuerza todo a español
        messages: { es },       //
    },
    theme: {
        defaultTheme: 'light',
        themes: {
            light: {
                colors: {
                    primary: '#6366F1', // Índigo suave
                    secondary: '#8B5CF6', // Púrpura suave
                    accent: '#60A5FA', // Azul pastel
                    success: '#34D399', // Verde pastel
                    warning: '#FBBF24', // Amarillo suave
                    error: '#F87171', // Rojo pastel
                    info: '#3B82F6', // Azul info
                    background: '#F8FAFC', // Fondo muy claro
                    surface: '#FFFFFF',
                }
            }
        }
    }
})

export default vuetify