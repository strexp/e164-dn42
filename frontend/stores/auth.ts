import { defineStore } from 'pinia'
import type { User } from '~/types'

export const useAuthStore = defineStore('auth', () => {
  const token = useCookie<string | null>('jwt_token', { 
    default: () => null,
    watch: true 
  });
  const user = ref<User | null>(null);

  const isLoggedIn = computed(() => !!token.value);
  const canWrite = computed(() => user.value?.asn?.startsWith('424242') ?? false);

  const setToken = (newToken: string) => {
    token.value = newToken;
  };

  const fetchUser = async () => {
    if (!token.value) return;
    try {
      const { $api } = useNuxtApp();
      user.value = await $api('/user/me') as User;
    } catch (e) {
      token.value = null;
      user.value = null;
    }
  };

  const logout = () => {
    token.value = null;
    user.value = null;
    navigateTo('/login');
  };

  return { token, user, isLoggedIn, canWrite, setToken, fetchUser, logout };
});
