import { useAuthStatus } from '@/contexts/AuthContext';
import { isEigenaarAccount } from '@/lib/eigenaar';

/** Ingelogd account waarvan het e-mailadres bij de eigenaar hoort. */
export function useIsEigenaar(): boolean {
  const { status, session } = useAuthStatus();
  if (status !== 'ingelogd') return false;
  return isEigenaarAccount(session?.user?.email);
}
