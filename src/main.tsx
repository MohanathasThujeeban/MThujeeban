import { createRoot } from 'react-dom/client'
import '@fontsource/anton'
import '@fontsource-variable/inter-tight'
import '@fontsource/jetbrains-mono'
import './styles.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(<App />)
