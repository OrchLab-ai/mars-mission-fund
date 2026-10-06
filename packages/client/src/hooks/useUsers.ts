import { useQuery } from '@tanstack/react-query'
import { fetchUsers } from '../api/auth'

export function useUsers() {
  return useQuery({ queryKey: ['users'], queryFn: fetchUsers })
}
