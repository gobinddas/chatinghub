<template>
  <div class="chat-app h-screen flex overflow-hidden">
    <!-- Mobile overlay when chat is open -->
    <div
      v-if="selectedUser && isMobileView"
      class="sidebar-overlay"
      @click="selectedUser = null"
    ></div>

    <!-- Sidebar: always visible on desktop, toggled on mobile -->
    <Sidebar
      :currentUser="currentUser"
      :class="[
        'sidebar-panel',
        { 'sidebar-hidden': selectedUser && isMobileView },
      ]"
      @selectUser="onSelectUser"
    />

    <!-- Chat Window -->
    <ChatWindow
      v-if="selectedUser"
      :currentUser="currentUser"
      :targetUser="selectedUser"
      class="chat-panel"
      @back="selectedUser = null"
    />

    <!-- Empty state (desktop only) -->
    <div
      v-else
      class="empty-state"
      :class="{ 'empty-state--mobile-hidden': isMobileView }"
    >
      <div class="empty-state__inner">
        <div class="empty-state__icon">💬</div>
        <h3 class="empty-state__title">ChattingHub</h3>
        <p class="empty-state__text">
          Select a conversation to start messaging
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import Sidebar from "../components/Sidebar.vue";
import ChatWindow from "../components/ChatWindow.vue";
import socket from "../services/socket";

export default {
  components: { Sidebar, ChatWindow },
  data() {
    return {
      currentUser: JSON.parse(localStorage.getItem("user")),
      selectedUser: null,
      isMobileView: false,
    };
  },
  mounted() {
    if (this.currentUser) {
      socket.emit("addUser", this.currentUser.id);
    }
    this.checkMobile();
    window.addEventListener("resize", this.checkMobile);
  },
  beforeUnmount() {
    window.removeEventListener("resize", this.checkMobile);
  },
  methods: {
    checkMobile() {
      this.isMobileView = window.innerWidth < 768;
    },
    onSelectUser(user) {
      this.selectedUser = user;
    },
  },
};
</script>

<style scoped>
.chat-app {
  background: #f0f7ff;
  font-family: "Nunito", "Segoe UI", sans-serif;
}

.sidebar-panel {
  transition: transform 0.3s ease;
}

.sidebar-hidden {
  display: none;
}

.chat-panel {
  flex: 1;
  min-width: 0;
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f0f7ff 0%, #e0f0ff 100%);
}

.empty-state--mobile-hidden {
  display: none;
}

.empty-state__inner {
  text-align: center;
  padding: 2rem;
}

.empty-state__icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  animation: float 3s ease-in-out infinite;
}

.empty-state__title {
  font-size: 1.5rem;
  font-weight: 800;
  color: #1a6fc4;
  margin-bottom: 0.5rem;
}

.empty-state__text {
  color: #6ba3d6;
  font-size: 0.95rem;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

@media (min-width: 768px) {
  .sidebar-hidden {
    display: flex !important;
  }
  .empty-state--mobile-hidden {
    display: flex !important;
  }
}
</style>
