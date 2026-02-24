import { createRouter, createWebHistory } from "vue-router";
import Login from "../pages/Login.vue";
import Register from "../pages/Register.vue";
import Chat from "../pages/Chat.vue";

const routes = [
  { path: "/", component: Login },
  { path: "/register", component: Register },
  { path: "/chat", component: Chat },
];

export default createRouter({
  history: createWebHistory(),
  routes,
});
