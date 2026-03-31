import { useAuthStore } from '~/stores/auth';

export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuthStore();

  if (auth.isLoggedIn && !auth.user) {
    await auth.fetchUser();
  }

  const publicRoutes = ['/login', '/phonebook/public'];

  if (!auth.isLoggedIn && !publicRoutes.includes(to.path) && !to.path.startsWith('/auth/')) {
    return navigateTo('/login');
  }
  
  if (auth.isLoggedIn && to.path === '/login') {
    return navigateTo('/');
  }
})
