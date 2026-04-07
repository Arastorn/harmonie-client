import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import './styles/index.css';
import './i18n';
import { router } from './routes';
import { AuthProvider } from './features/auth/AuthContext';
import { UserProvider } from './features/user/UserContext';
import { ThemeProvider } from './features/user/ThemeContext';
import { RealtimeProvider } from './features/realtime/RealtimeContext';
import { AudioInputProvider } from './features/user/audio/AudioInputContext';
import { AudioOutputProvider } from './features/user/audio/AudioOutputContext';

document.addEventListener('contextmenu', (e) => e.preventDefault());

createRoot(document.getElementById('root')!).render(
  <ThemeProvider>
    <AuthProvider>
      <UserProvider>
        <AudioInputProvider>
          <AudioOutputProvider>
            <RealtimeProvider>
              <RouterProvider router={router} />
            </RealtimeProvider>
          </AudioOutputProvider>
        </AudioInputProvider>
      </UserProvider>
    </AuthProvider>
  </ThemeProvider>
);
