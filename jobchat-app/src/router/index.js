import { createRouter, createWebHistory } from "vue-router";
// import { auth } from '../firebase' TO-DO: later

const routes = [
  {
    path: "/",
    name: "UserDashboard",
    component: () => import("../components/features/UserDashboard"),
    meta: { requiresAuth: true },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  // const currentUser = auth.currentUser;
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);

  if (!requiresAuth) {
    next();
  } else {
    next("/login") ;
  }
});
