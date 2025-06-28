import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import initGame, { updateGame } from './components/Game.tsx'
import initKaplay from "./components/KaplayWindow";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

const k = initKaplay();
await initGame(k);
updateGame(k);

