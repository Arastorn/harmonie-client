import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import './styles/index.css';
import './i18n';
import { router } from './routes';
import { AuthProvider } from './features/auth/AuthContext';
import { UserProvider } from './features/user/UserContext';
import { RealtimeProvider } from './features/realtime/RealtimeContext';

// Disable the native browser context menu across the entire app
document.addEventListener('contextmenu', (e) => e.preventDefault());

createRoot(document.getElementById('root')!).render(
  <AuthProvider>
    <UserProvider>
      <RealtimeProvider>
        <RouterProvider router={router} />
      </RealtimeProvider>
    </UserProvider>
  </AuthProvider>
);
