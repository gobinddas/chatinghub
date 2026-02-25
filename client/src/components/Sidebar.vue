<template>
  <div class="sidebar">
    <!-- Header -->
    <div class="sidebar__header">
      <div class="sidebar__brand">
        <div class="sidebar__logo">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z"
              stroke="white"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>
        <div>
          <h2 class="sidebar__app-name">ChattingHub</h2>
          <p class="sidebar__username">{{ currentUser?.username }}</p>
        </div>
      </div>
      <div class="sidebar__avatar">
        {{ currentUser?.username?.charAt(0).toUpperCase() }}
      </div>
    </div>

    <!-- Search -->
    <div class="sidebar__search">
      <div class="search-box">
        <svg
          class="search-box__icon"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle cx="11" cy="11" r="8" stroke="#6ba3d6" stroke-width="2" />
          <path
            d="M21 21L16.65 16.65"
            stroke="#6ba3d6"
            stroke-width="2"
            stroke-linecap="round"
          />
        </svg>
        <input
          v-model="searchId"
          type="text"
          placeholder="Search by Profile ID..."
          class="search-box__input"
          @keyup.enter="searchUser"
        />
        <button class="search-box__btn" @click="searchUser">Find</button>
      </div>
      <p v-if="searchError" class="search-error">{{ searchError }}</p>
    </div>

    <!-- Section label -->
    <div class="sidebar__section-label">
      <span>Conversations</span>
      <span class="sidebar__count">{{ users.length }}</span>
    </div>

    <!-- User List -->
    <div class="sidebar__list">
      <div v-if="loading" class="sidebar__loading">
        <div class="loading-dot"></div>
        <div class="loading-dot"></div>
        <div class="loading-dot"></div>
      </div>

      <div
        v-for="user in users"
        :key="user.id"
        @click="selectUser(user)"
        class="user-item"
        :class="{ 'user-item--active': selectedUser?.id === user.id }"
      >
        <!-- Avatar -->
        <div class="user-item__avatar">
          {{ user.username.charAt(0).toUpperCase() }}
          <span
            v-if="onlineUsers.includes(String(user.id))"
            class="user-item__online-dot"
          ></span>
        </div>

        <!-- Info -->
        <div class="user-item__info">
          <p class="user-item__name">{{ user.username }}</p>
          <p class="user-item__id">#{{ user.profile_id }}</p>
        </div>

        <!-- Online badge -->
        <span
          v-if="onlineUsers.includes(String(user.id))"
          class="user-item__badge"
        >
          ● Online
        </span>
      </div>

      <p v-if="!loading && users.length === 0" class="sidebar__empty">
        No users found. Search by Profile ID to connect!
      </p>
    </div>
  </div>
</template>

<script>
import { getAllUsers, searchByProfileId } from "../services/api";
import socket from "../services/socket";

export default {
  props: {
    currentUser: Object,
  },
  emits: ["selectUser"],
  data() {
    return {
      users: [],
      onlineUsers: [],
      selectedUser: null,
      searchId: "",
      searchError: "",
      loading: true,
    };
  },
  async mounted() {
    await this.fetchUsers();
    socket.on("onlineUsers", (users) => {
      this.onlineUsers = users;
    });
  },
  beforeUnmount() {
    socket.off("onlineUsers");
  },
  methods: {
    async fetchUsers() {
      try {
        this.loading = true;
        const res = await getAllUsers(this.currentUser.id);
        this.users = res.data;
      } catch (err) {
        console.error("Failed to load users:", err);
      } finally {
        this.loading = false;
      }
    },
    async searchUser() {
      this.searchError = "";
      if (!this.searchId.trim()) return;
      try {
        const res = await searchByProfileId(this.searchId.trim());
        const found = res.data;
        if (!this.users.find((u) => u.id === found.id)) {
          this.users.unshift(found);
        }
        this.selectUser(found);
        this.searchId = "";
      } catch (err) {
        this.searchError = "User not found with that Profile ID.";
      }
    },
    selectUser(user) {
      this.selectedUser = user;
      this.$emit("selectUser", user);
    },
  },
};
</script>

<style scoped>
.sidebar {
  width: 100%;
  max-width: 360px;
  min-width: 280px;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border-right: 1px solid #d6eaff;
  height: 100%;
  overflow: hidden;
}

/* Header */
.sidebar__header {
  background: linear-gradient(135deg, #1a6fc4 0%, #38b6ff 100%);
  padding: 1.1rem 1.25rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.sidebar__brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.sidebar__logo {
  width: 38px;
  height: 38px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
}

.sidebar__app-name {
  font-size: 1.1rem;
  font-weight: 800;
  color: white;
  letter-spacing: -0.3px;
  line-height: 1.2;
}

.sidebar__username {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 1px;
}

.sidebar__avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.25);
  color: white;
  font-weight: 700;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid rgba(255, 255, 255, 0.5);
}

/* Search */
.sidebar__search {
  padding: 0.875rem 1rem;
  border-bottom: 1px solid #e8f3ff;
  flex-shrink: 0;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #f0f7ff;
  border: 1.5px solid #c2deff;
  border-radius: 12px;
  padding: 0.4rem 0.5rem 0.4rem 0.75rem;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}

.search-box:focus-within {
  border-color: #38b6ff;
  box-shadow: 0 0 0 3px rgba(56, 182, 255, 0.15);
}

.search-box__icon {
  flex-shrink: 0;
}

.search-box__input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-size: 0.85rem;
  color: #1a3a5c;
  min-width: 0;
}

.search-box__input::placeholder {
  color: #a0bdd4;
}

.search-box__btn {
  background: linear-gradient(135deg, #1a6fc4, #38b6ff);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.35rem 0.75rem;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  transition:
    opacity 0.2s,
    transform 0.1s;
  white-space: nowrap;
}

.search-box__btn:hover {
  opacity: 0.9;
  transform: scale(1.03);
}

.search-error {
  margin-top: 0.4rem;
  font-size: 0.75rem;
  color: #e05252;
  padding-left: 0.25rem;
}

/* Section label */
.sidebar__section-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.6rem 1.1rem 0.4rem;
  font-size: 0.7rem;
  font-weight: 700;
  color: #6ba3d6;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  flex-shrink: 0;
}

.sidebar__count {
  background: #e0f0ff;
  color: #1a6fc4;
  padding: 0.1rem 0.45rem;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: 700;
}

/* List */
.sidebar__list {
  flex: 1;
  overflow-y: auto;
  padding: 0.25rem 0;
}

.sidebar__list::-webkit-scrollbar {
  width: 4px;
}

.sidebar__list::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar__list::-webkit-scrollbar-thumb {
  background: #c2deff;
  border-radius: 2px;
}

/* Loading */
.sidebar__loading {
  display: flex;
  gap: 6px;
  justify-content: center;
  padding: 2rem;
}

.loading-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #38b6ff;
  animation: pulse-dot 1.2s ease-in-out infinite;
}

.loading-dot:nth-child(2) {
  animation-delay: 0.2s;
}
.loading-dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes pulse-dot {
  0%,
  100% {
    transform: scale(0.7);
    opacity: 0.4;
  }
  50% {
    transform: scale(1);
    opacity: 1;
  }
}

/* User item */
.user-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.1rem;
  cursor: pointer;
  transition: background 0.15s;
  border-radius: 12px;
  margin: 0 0.5rem 2px;
}

.user-item:hover {
  background: #f0f7ff;
}

.user-item--active {
  background: linear-gradient(135deg, #e0f0ff, #d0e8ff);
  box-shadow: inset 3px 0 0 #1a6fc4;
}

.user-item__avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, #38b6ff, #1a6fc4);
  color: white;
  font-weight: 700;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(56, 182, 255, 0.3);
}

.user-item__online-dot {
  position: absolute;
  bottom: 1px;
  right: 1px;
  width: 11px;
  height: 11px;
  background: #2ecc71;
  border: 2px solid white;
  border-radius: 50%;
}

.user-item__info {
  flex: 1;
  min-width: 0;
}

.user-item__name {
  font-weight: 700;
  font-size: 0.9rem;
  color: #1a3a5c;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-item__id {
  font-size: 0.75rem;
  color: #7fb1d4;
  margin-top: 1px;
}

.user-item__badge {
  font-size: 0.68rem;
  color: #2ecc71;
  font-weight: 700;
  white-space: nowrap;
}

.sidebar__empty {
  text-align: center;
  color: #a0bdd4;
  font-size: 0.85rem;
  padding: 2rem 1.5rem;
  line-height: 1.5;
}

/* Mobile full-width */
@media (max-width: 767px) {
  .sidebar {
    max-width: 100%;
    width: 100%;
    min-width: unset;
  }
}
</style>
