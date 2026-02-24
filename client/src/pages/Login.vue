<template>
  <div class="flex items-center justify-center h-screen bg-gray-100">
    <div class="bg-white p-8 rounded-lg shadow-lg w-96">
      <h2 class="text-2xl font-bold text-center mb-6">ChattingHub</h2>

      <input
        v-model="email"
        type="email"
        placeholder="Email"
        class="w-full p-3 mb-4 border rounded"
      />

      <input
        v-model="password"
        type="password"
        placeholder="Password"
        class="w-full p-3 mb-4 border rounded"
      />

      <button
        @click="login"
        class="w-full bg-green-500 text-white p-3 rounded hover:bg-green-600"
      >
        Login
      </button>

      <p class="text-center mt-4 text-sm">
        Don't have account?
        <router-link to="/register" class="text-green-500">
          Register
        </router-link>
      </p>
    </div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  data() {
    return {
      email: "",
      password: "",
    };
  },
  methods: {
    async login() {
      try {
        const res = await axios.post("http://localhost:5000/api/auth/login", {
          email: this.email,
          password: this.password,
        });

        localStorage.setItem("user", JSON.stringify(res.data.user));
        localStorage.setItem("token", res.data.token);

        this.$router.push("/chat");
      } catch (err) {
        alert("Login failed");
      }
    },
  },
};
</script>
