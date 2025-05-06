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
import { useCandidateAuthStore } from "@/stores";


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
  {
    path: "/applications/:orgId/:jobId",
    name: "ApplicationDetails",
    component: () => import("@/components/features/ApplicationDetails.vue"),
    props: true,
    meta: { requiresCandidateAuth: true },
  },
  {
    path: "/candidate-login",
    name: "CandidateLogin",
    component: () => import("@/components/features/CandidateLogin.vue"),
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
  const candidateAuthStore = useCandidateAuthStore();

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

  // Check for regular user authentication
  if (to.meta.requiresAuth && !authStore.user) {
    next("/login");
  }
  // Check for candidate authentication
  else if (to.meta.requiresCandidateAuth && !candidateAuthStore.candidate) {
    next({
      name: "CandidateLogin",
      query: { orgId: to.params.orgId, jobId: to.params.jobId },
    });
  }
  // If no special authentication is required, proceed
  else {
    next();
  }
});

export default router;
