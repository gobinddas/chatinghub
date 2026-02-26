<template>
  <div class="flex items-center justify-center h-screen bg-gray-100">
    <div class="bg-white p-8 rounded-lg shadow-lg w-96">
      <h2 class="text-2xl font-bold text-center mb-6">Create Account</h2>

      <input
        v-model="username"
        type="text"
        placeholder="Username"
        class="w-full p-3 mb-4 border rounded"
        :disabled="loading"
      />

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
        @click="register"
        :disabled="loading"
        class="w-full bg-green-500 text-white p-3 rounded hover:bg-green-600 disabled:opacity-50"
      >
        {{ loading ? "Registering..." : "Register" }}
      </button>

      <p class="text-center mt-4 text-sm">
        Already have account?
        <router-link to="/" class="text-green-500">Login</router-link>
      </p>
    </div>
  </div>
</template>

<script>
import { registerUser } from "../api/api.js"; // ← adjust path if needed

export default {
  data() {
    return {
      username: "",
      email: "",
      password: "",
      loading: false,
      errorMsg: "",
    };
  },
  methods: {
    async register() {
      this.errorMsg = "";

      // Basic validation
      if (!this.username || !this.email || !this.password) {
        this.errorMsg = "Please fill in all fields.";
        return;
      }

      if (this.password.length < 6) {
        this.errorMsg = "Password must be at least 6 characters.";
        return;
      }

      this.loading = true;
      try {
        await registerUser(this.username, this.email, this.password); // ← from api.js

        alert("Registration successful!");
        this.$router.push("/");
      } catch (err) {
        this.errorMsg =
          err.response?.data?.message ||
          "Registration failed. Please try again.";
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>
