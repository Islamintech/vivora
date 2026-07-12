import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '@/store/auth.store';

export function useRequireAuth(allowedRoles?: string[]) {
  const { user, isHydrated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isHydrated) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      router.replace('/dashboard');
    }
  }, [user, isHydrated, router, allowedRoles]);

  return { user, isHydrated };
}

export function useRedirectIfAuthed() {
  const { user, isHydrated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isHydrated) return;
    if (user) {
      if (user.role === 'SUPER_ADMIN') router.replace('/admin');
      else router.replace('/dashboard');
    }
  }, [user, isHydrated, router]);
}
