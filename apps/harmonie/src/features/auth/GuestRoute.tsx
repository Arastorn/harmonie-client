import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './useAuth'

export const GuestRoute = () => {
  const { isAuthenticated } = useAuth()
  if (isAuthenticated) return <Navigate to="/" replace />
  return <Outlet />
}
