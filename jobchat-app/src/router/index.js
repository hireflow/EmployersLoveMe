/**
 * Vue Router Configuration
 *
 * This file defines the application's routing configuration:
 * - Route definitions
 * - Navigation guards
 * - Authentication protection
 */

import { createRouter, createWebHistory } from "vue-router";
// import { auth } from '../firebase' TO-DO: later
import { useAuthStore } from "@/stores";

// Define application routes
const routes = [
  {
    path: "/",
    redirect: "/dashboard",
  },
  {
    path: "/dashboard",
    component: () => import("@/components/features/UserDashboard.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/login",
    component: () => import("@/components/features/SignupOrLoginUser.vue"),
  },
];

// Create router instance
const router = createRouter({
  history: createWebHistory(),
  routes,
});

/**
 * Global navigation guard
 *
 * Handles:
 * - Authentication state initialization
 * - Protected route access
 * - Redirects to login for unauthenticated users
 */
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();

  // Wait for auth state to be initialized
  if (authStore.loading) {
    // Wait for the auth state to be initialized
    await new Promise((resolve) => {
      const unwatch = authStore.$subscribe((mutation, state) => {
        if (!state.loading) {
          unwatch();
          resolve();
        }
      });
    });
  }

  // Check if route requires authentication
  if (to.meta.requiresAuth && !authStore.user) {
    next("/login");
  } else {
    next();
  }
});

export default router;
