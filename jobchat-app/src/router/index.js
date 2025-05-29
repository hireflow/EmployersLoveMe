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
    meta: { requiresAuth: true, role: "manager" },
  },
  {
    path: "/login",
    name: "UserLogin",
    component: () => import("@/components/features/SignupOrLoginUser.vue"),
    meta: { role: "manager" },
  },
  {
    path: "/applications/:orgId/:jobId",
    name: "ApplicationDetails",
    component: () => import("@/components/features/ApplicationDetails.vue"),
    meta: { requiresCandidateAuth: true, role: "candidate" },
  },
  {
    path: "/candidate-login",
    name: "CandidateLogin",
    component: () => import("@/components/features/CandidateLogin.vue"),
    meta: { role: "candidate" },
  },
  {
    path: "/candidate-dashboard",
    name: "CandidateDashboard",
    component: () => import("@/components/features/CandidateDashboard.vue"),
    meta: { requiresCandidateAuthNoParams: true, role: "candidate" },
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
  const role = to.meta.role;

  // Candidate auth store
  if (role === "candidate") {
    if (candidateAuthStore.loading) {
      await new Promise((resolve) => {
        const unsubscribe = candidateAuthStore.$subscribe((mutation, state) => {
          if (!state.loading) {
            unsubscribe();
            resolve();
          }
        });
        if (!candidateAuthStore.loading) resolve();
      });
    }
    if (candidateAuthStore.isAuthenticated && to.name === "CandidateLogin") {
      return next({ name: "CandidateDashboard" });
    }
  }

  // Manager auth store
  if (role === "manager") {
    if (authStore.loading) {
      await new Promise((resolve) => {
        const unsub = authStore.$subscribe((mutation, state) => {
          if (!state.loading) {
            unsub();
            resolve();
          }
        });
        if (!authStore.loading) resolve();
      });
    }
    if (authStore.isAuthenticated && to.name === "UserLogin") {
      return next({ name: "UserDashboard" });
    }
  }

  // 3. Route Guard Logic
  // Check for regular user (employer/recruiter) authentication
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    console.log("Router Guard: User not authenticated, redirecting to /login");
    next({ name: "UserLogin", query: { redirect: to.fullPath } }); // so you can do query.redirect and get to.fullPath in string form
  }
  // Check for candidate authentication (for routes like ApplicationDetails)
  else if (
    to.meta.requiresCandidateAuth &&
    !candidateAuthStore.isAuthenticated
  ) {
    if (to.name !== "CandidateLogin") {
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
  }
  // Check for candidate authentication for routes without specific job/org params
  else if (
    to.meta.requiresCandidateAuthNoParams &&
    !candidateAuthStore.isAuthenticated
  ) {
    if (to.name !== "CandidateLogin") {
      console.log(
        "Router Guard: Candidate not authenticated, redirecting to CandidateLogin"
      );
      next({ name: "CandidateLogin", query: { redirect: to.fullPath } });
    }
  }
  // If no special authentication is required, or user/candidate is authenticated
  else {
    next();
  }
});

export default router;
