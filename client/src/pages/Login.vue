<template>
  <div class="flex items-center justify-center h-screen bg-gray-100">
    <div class="bg-white p-8 rounded-lg shadow-lg w-96">
      <h2 class="text-2xl font-bold text-center mb-6">ChattingHub</h2>

      <input
        v-model="email"
        type="email"
        placeholder="Email"
        class="w-full p-3 mb-4 border rounded"
        :disabled="loading"
      />

      <input
        v-model="password"
        type="password"
        placeholder="Password"
        class="w-full p-3 mb-4 border rounded"
        :disabled="loading"
      />

      <p v-if="errorMsg" class="text-red-500 text-sm mb-3 text-center">
        {{ errorMsg }}
      </p>

      <button
        @click="login"
        :disabled="loading"
        class="w-full bg-green-500 text-white p-3 rounded hover:bg-green-600 disabled:opacity-50"
      >
        {{ loading ? "Logging in..." : "Login" }}
      </button>

      <p class="text-center mt-4 text-sm">
        Don't have account?
        <router-link to="/register" class="text-green-500"
          >Register</router-link
        >
      </p>
    </div>
  </div>
</template>

<script>
import { loginUser } from "../api/api.js"; // ← adjust path if needed

export default {
  data() {
    return {
      email: "",
      password: "",
      loading: false,
      errorMsg: "",
    };
  },
  methods: {
    async login() {
      this.errorMsg = "";

      // Basic validation
      if (!this.email || !this.password) {
        this.errorMsg = "Please fill in all fields.";
        return;
      }

      this.loading = true;
      try {
        const res = await loginUser(this.email, this.password); // ← from api.js

        localStorage.setItem("user", JSON.stringify(res.data.user));
        localStorage.setItem("token", res.data.token);

        this.$router.push("/chat");
      } catch (err) {
        this.errorMsg =
          err.response?.data?.message || "Login failed. Please try again.";
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>
