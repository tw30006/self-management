import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import { useAuthStore } from "../stores/auth";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: HomeView,
      meta: { requiresAuth: true },
    },
    {
      path: "/trainings/new",
      name: "training-create",
      component: () => import("../views/TrainingCreateView.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/trainings/edit/:id",
      name: "training-edit",
      component: () => import("../views/TrainingCreateView.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/login",
      name: "login",
      component: () => import("../views/Login.vue"),
    },
  ],
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();

  if (!auth.isHydrated) {
    await auth.hydrateSession();
  }

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: "login" };
  }

  if (to.name === "login" && auth.isAuthenticated) {
    return { name: "home" };
  }
});

export default router;
