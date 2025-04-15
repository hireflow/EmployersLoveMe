import { createRouter, createWebHistory } from "vue-router";
// import { auth } from '../firebase' TO-DO: later
import { useAuthStore } from "@/stores";

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

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Navigation guard
router.beforeEach(async (to) => {
  const authStore = useAuthStore();

  if (to.meta.requiresAuth && !authStore.user) {
    return "/login";
  }
});

export default router;
