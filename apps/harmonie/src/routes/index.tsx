import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '../layouts/AppLayout'
import { RequireAuth } from '../features/auth/RequireAuth'
import { GuestRoute } from '../features/auth/GuestRoute'
import { ConnectPage } from '../features/auth/ConnectPage'
import { RegisterPage } from '../features/auth/RegisterPage'

export const router = createBrowserRouter([
  {
    path: '/auth',
    element: <GuestRoute />,
    children: [
      {
        index: true,
        element: <Navigate to="/auth/connect" replace />,
      },
      {
        path: 'connect',
        element: <ConnectPage />,
      },
      {
        path: 'register',
        element: <RegisterPage />,
      },
    ],
  },
  {
    element: <RequireAuth />,
    children: [
      {
        path: '/',
        element: <AppLayout />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
])
