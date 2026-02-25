<template>
  <div class="flex items-center justify-center h-screen bg-gray-100">
    <div class="bg-white p-8 rounded-lg shadow-lg w-96">
      <h2 class="text-2xl font-bold text-center mb-6">Create Account</h2>

      <input
        v-model="username"
        type="text"
        placeholder="Username"
        class="w-full p-3 mb-4 border rounded"
      />

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
        @click="register"
        class="w-full bg-green-500 text-white p-3 rounded hover:bg-green-600"
      >
        Register
      </button>

      <p class="text-center mt-4 text-sm">
        Already have account?
        <router-link to="/" class="text-green-500"> Login </router-link>
      </p>
    </div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  data() {
    return {
      username: "",
      email: "",
      password: "",
    };
  },
  methods: {
    async register() {
      try {
        await axios.post("http://192.168.100.184:5000/api/auth/register", {
          username: this.username,
          email: this.email,
          password: this.password,
        });

        alert("Registration successful!");
        this.$router.push("/");
      } catch (err) {
        alert("Registration failed");
      }
    },
  },
};
</script>
