import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchCurrentUser, loginUser, logoutUser, updateProfile } from '../api/auth'
import { useAuthContext } from '../context/AuthContext'

export function useCurrentUser() {
  const { token } = useAuthContext()
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: fetchCurrentUser,
    enabled: !!token,
  })
}

export function useLogin() {
  const queryClient = useQueryClient()
  const { login } = useAuthContext()
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      loginUser(email, password),
    onSuccess: ({ token, user }) => {
      localStorage.setItem('token', token)
      login(token, user)
      void queryClient.invalidateQueries({ queryKey: ['currentUser'] })
    },
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  const { logout } = useAuthContext()
  return useMutation({
    mutationFn: logoutUser,
    onSuccess: () => {
      localStorage.removeItem('token')
      logout()
      queryClient.resetQueries()
    },
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['currentUser'] })
    },
  })
}
