import {
  createRouter,
  createWebHistory,
  type NavigationGuardWithThis,
  type RouteRecordRaw,
} from "vue-router";
import HomeView from "../views/HomeView.vue";
import { useAuthStore } from "../stores/auth";

export const routes: RouteRecordRaw[] = [
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
];

export const authGuard: NavigationGuardWithThis<undefined> = async (to) => {
  const auth = useAuthStore();

  if (!auth.isSessionChecked) {
    await auth.checkSession();
  }

  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    return { name: "login" };
  }

  if (to.name === "login" && auth.isLoggedIn) {
    return { name: "home" };
  }
};

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach(authGuard);

export default router;
