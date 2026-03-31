import { useAuthStore } from '~/stores/auth';

export default defineNuxtPlugin(() => {
  const authStore = useAuthStore();
  const config = useRuntimeConfig();
  
  const api = $fetch.create({
    baseURL: config.public.apiBase,
    onRequest({ options }) {
      if (authStore.token) {
        options.headers = new Headers(options.headers);
        options.headers.set('Authorization', `Bearer ${authStore.token}`);
      }
    },
    onResponseError({ response }) {
      if (response.status === 401) {
        authStore.logout();
      }
    }
  });

  return { provide: { api } };
})
