/**
 * Vue Router Configuration
 *
 * This file defines the application's routing configuration:
 * - Route definitions
 * - Navigation guards
 * - Authentication protection
 */

import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores"; // Assumes stores/index.js exports this
import { useCandidateAuthStore } from "@/stores"; // Assumes stores/index.js exports this

// Define application routes
const routes = [
  {
    path: "/",
    redirect: "/dashboard", // TO-DO REDIRECT TO LANDING PAGE
  },
  {
    path: "/:orgId/jobs",
    name: "JobDashboard",
    component: () => import("@/components/features/JobDashboard2.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/dashboard",
    name: "UserDashboard",
    component: () => import("@/components/features/UserDashboard.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/login",
    name: "UserLogin",
    component: () => import("@/components/features/SignupOrLoginUser.vue"),
  },
  {
    path: "/applications/:orgId/:jobId",
    name: "ApplicationDetails",
    component: () => import("@/components/features/ApplicationDetails.vue"),
    meta: { requiresCandidateAuth: true },
  },
  {
    path: "/candidate-login",
    name: "CandidateLogin",
    component: () => import("@/components/features/CandidateLogin.vue"),
  },
  {
    path: "/candidate-dashboard",
    name: "CandidateDashboard",
    component: () => import("@/components/features/CandidateDashboard.vue"),
    meta: { requiresCandidateAuthNoParams: true }, // Or simply requiresCandidateAuth if no params needed
  },
  // to-do !!! adding a 404 Not Found route
  // { path: '/:pathMatch(.*)*', name: 'NotFound', component: () => import('@/views/NotFound.vue') },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL), // process.env.BASE_URL is common for Vue CLI projects
  routes,
});
// nav guard
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();
  const candidateAuthStore = useCandidateAuthStore();

  // 1. Wait for user auth state (Firebase Auth) to be initialized
  if (authStore.loading) {
    // This assumes authStore.loading becomes false after onAuthStateChanged resolves
    await new Promise((resolve) => {
      const unsubscribe = authStore.$onAction(({ name, after, onError }) => {
        // Watch for the 'initialize' action to complete or error
        if (name === "initialize") {
          after(() => {
            unsubscribe();
            resolve();
          });
          onError(() => {
            unsubscribe();
            resolve(); // Resolve even on error to proceed with guard logic
          });
        }
      });
      // If initialize might have already run and loading is still true due to other reasons,
      // you might need a more direct way to await its completion or a timeout.
      // A simpler subscribe that just waits for loading to be false:
      if (authStore.loading) {
        // Re-check in case it resolved quickly
        const unsubLoading = authStore.$subscribe((mutation, state) => {
          if (!state.loading) {
            unsubLoading();
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }

  // 2. Wait for candidate auth state (localStorage) to be initialized
  if (candidateAuthStore.initLoading) {
    // candidateAuthStore.initLoading becomes false after initialize() in store completes
    await new Promise((resolve) => {
      const unsubscribe = candidateAuthStore.$subscribe((mutation, state) => {
        if (!state.initLoading) {
          unsubscribe();
          resolve();
        }
      });
      // If initLoading might have already run and is false
      if (!candidateAuthStore.initLoading) {
        resolve();
      }
    });
  }

  // 3. Route Guard Logic
  // Check for regular user (employer/recruiter) authentication
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    console.log("Router Guard: User not authenticated, redirecting to /login");
    next({ name: "UserLogin", query: { redirect: to.fullPath } }); // so you can do query.redirect and get to.fullPath in string form
  }
  // Check for candidate authentication (for routes like ApplicationDetails)
  else if (to.meta.requiresCandidateAuth && !candidateAuthStore.isAuthenticated) {
    console.log(
      "Router Guard: Candidate not authenticated for ApplicationDetails, redirecting to CandidateLogin"
    );
    next({
      name: "CandidateLogin",
      query: {
        orgId: to.params.orgId,
        jobId: to.params.jobId,
        redirect: to.fullPath, // Keep the full path for potential redirection after login
      },
    });
  }
  // Check for candidate authentication for routes without specific job/org params
  else if (
    to.meta.requiresCandidateAuthNoParams &&
    !candidateAuthStore.isAuthenticated
  ) {
    console.log(
      "Router Guard: Candidate not authenticated, redirecting to CandidateLogin"
    );
    next({ name: "CandidateLogin", query: { redirect: to.fullPath } });
  }
  // If no special authentication is required, or user/candidate is authenticated
  else {
    next();
  }
});

export default router;
