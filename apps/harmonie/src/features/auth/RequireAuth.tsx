import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './useAuth'

export const RequireAuth = () => {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/auth" replace />
  return <Outlet />
}
