import { createRouter, createWebHistory } from "vue-router";
import Login from "../pages/Login.vue";
import Register from "../pages/Register.vue";
import Chat from "../pages/Chat.vue";
import Profile from "../pages/Profile.vue";

const routes = [
  { path: "/", redirect: "/login" },
  { path: "/login", component: Login },
  { path: "/register", component: Register },
  {
    path: "/chat",
    component: Chat,
    meta: { requiresAuth: true },
  },
  {
    // :userId is optional — if missing, shows your own profile
    path: "/profile/:userId?",
    component: Profile,
    meta: { requiresAuth: true },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// ─── Auth guard ───────────────────────────────────────────────────────────────
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem("token");
  if (to.meta.requiresAuth && !token) {
    next("/login");
  } else if ((to.path === "/login" || to.path === "/register") && token) {
    next("/chat");
  } else {
    next();
  }
});

export default router;
