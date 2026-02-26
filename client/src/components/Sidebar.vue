<template>
  <div class="sidebar">
    <!-- Header with user info -->
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

      <!-- Header actions: Profile + Logout -->
      <div class="sidebar__header-actions">
        <!-- Profile button -->
        <button
          class="sidebar__icon-btn"
          @click="goToMyProfile"
          title="My Profile"
        >
          <!-- Avatar image or letter -->
          <div class="sidebar__my-avatar">
            <img
              v-if="currentUser?.profile_picture"
              :src="getAvatarUrl(currentUser.profile_picture)"
              class="sidebar__my-avatar-img"
              alt="avatar"
            />
            <span v-else class="sidebar__my-avatar-letter">
              {{ currentUser?.username?.charAt(0).toUpperCase() }}
            </span>
          </div>
        </button>

        <!-- Logout button -->
        <button
          class="sidebar__icon-btn sidebar__icon-btn--logout"
          @click="logout"
          title="Logout"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9"
              stroke="white"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <polyline
              points="16 17 21 12 16 7"
              stroke="white"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <line
              x1="21"
              y1="12"
              x2="9"
              y2="12"
              stroke="white"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
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
        class="user-item"
        :class="{ 'user-item--active': selectedUser?.id === user.id }"
      >
        <!-- Click avatar/name area to view profile -->
        <div
          class="user-item__avatar"
          @click="goToProfile(user)"
          title="View profile"
        >
          <img
            v-if="user.profile_picture"
            :src="getAvatarUrl(user.profile_picture)"
            class="user-item__avatar-img"
            alt=""
          />
          <span v-else>{{ user.username.charAt(0).toUpperCase() }}</span>
          <span
            v-if="onlineUsers.includes(String(user.id))"
            class="user-item__online-dot"
          ></span>
        </div>

        <!-- Info — clicking starts chat -->
        <div class="user-item__info" @click="selectUser(user)">
          <p class="user-item__name">{{ user.username }}</p>
          <p class="user-item__sub">{{ user.role || "#" + user.profile_id }}</p>
        </div>

        <!-- Online badge -->
        <span
          v-if="onlineUsers.includes(String(user.id))"
          class="user-item__badge"
          >● Online</span
        >
      </div>

      <p v-if="!loading && users.length === 0" class="sidebar__empty">
        No users found. Search by Profile ID to connect!
      </p>
    </div>

    <!-- Logout confirm modal -->
    <div
      v-if="showLogoutConfirm"
      class="logout-modal-overlay"
      @click.self="showLogoutConfirm = false"
    >
      <div class="logout-modal">
        <div class="logout-modal__icon">👋</div>
        <h3 class="logout-modal__title">Log out?</h3>
        <p class="logout-modal__text">
          You'll need to sign in again to access your chats.
        </p>
        <div class="logout-modal__actions">
          <button class="btn btn--danger" @click="confirmLogout">
            Yes, Log Out
          </button>
          <button class="btn btn--ghost" @click="showLogoutConfirm = false">
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { getAllUsers, searchByProfileId, getAvatarUrl } from "../services/api";
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
      showLogoutConfirm: false,
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
    getAvatarUrl,

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
      } catch {
        this.searchError = "User not found with that Profile ID.";
      }
    },

    selectUser(user) {
      this.selectedUser = user;
      this.$emit("selectUser", user);
    },

    goToMyProfile() {
      this.$router.push(`/profile/${this.currentUser.id}`);
    },

    goToProfile(user) {
      this.$router.push(`/profile/${user.id}`);
    },

    logout() {
      this.showLogoutConfirm = true;
    },

    confirmLogout() {
      socket.disconnect();
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      this.$router.push("/login");
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
  position: relative;
}

/* Header */
.sidebar__header {
  background: linear-gradient(135deg, #1a6fc4 0%, #38b6ff 100%);
  padding: 0.875rem 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  gap: 0.5rem;
}

.sidebar__brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  min-width: 0;
}

.sidebar__logo {
  width: 36px;
  height: 36px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.sidebar__app-name {
  font-size: 1rem;
  font-weight: 800;
  color: white;
  line-height: 1.2;
  white-space: nowrap;
}

.sidebar__username {
  font-size: 0.72rem;
  color: rgba(255, 255, 255, 0.8);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar__header-actions {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-shrink: 0;
}

.sidebar__icon-btn {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  border: 1.5px solid rgba(255, 255, 255, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s;
  padding: 0;
  overflow: hidden;
}

.sidebar__icon-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.sidebar__icon-btn--logout {
  background: rgba(231, 76, 60, 0.3);
  border-color: rgba(255, 255, 255, 0.25);
}

.sidebar__icon-btn--logout:hover {
  background: rgba(231, 76, 60, 0.5);
}

/* My avatar in header */
.sidebar__my-avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.3);
}

.sidebar__my-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.sidebar__my-avatar-letter {
  color: white;
  font-weight: 800;
  font-size: 0.9rem;
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
  transition: opacity 0.2s;
  white-space: nowrap;
}

.search-box__btn:hover {
  opacity: 0.9;
}
.search-error {
  margin-top: 0.4rem;
  font-size: 0.75rem;
  color: #e05252;
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
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(56, 182, 255, 0.3);
  cursor: pointer;
}

.user-item__avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
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
  cursor: pointer;
}

.user-item__name {
  font-weight: 700;
  font-size: 0.9rem;
  color: #1a3a5c;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-item__sub {
  font-size: 0.75rem;
  color: #7fb1d4;
  margin-top: 1px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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

/* Logout modal */
.logout-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  backdrop-filter: blur(4px);
}

.logout-modal {
  background: white;
  border-radius: 20px;
  padding: 2rem;
  max-width: 300px;
  width: 90%;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  animation: pop-in 0.2s ease-out;
}

@keyframes pop-in {
  from {
    transform: scale(0.85);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.logout-modal__icon {
  font-size: 2.5rem;
  margin-bottom: 0.75rem;
}

.logout-modal__title {
  font-size: 1.1rem;
  font-weight: 800;
  color: #1a3a5c;
  margin-bottom: 0.4rem;
}

.logout-modal__text {
  font-size: 0.85rem;
  color: #7fb1d4;
  margin-bottom: 1.25rem;
  line-height: 1.4;
}

.logout-modal__actions {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.65rem 1.25rem;
  border-radius: 10px;
  border: none;
  font-size: 0.88rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.btn--danger {
  background: linear-gradient(135deg, #c0392b, #e74c3c);
  color: white;
  box-shadow: 0 2px 10px rgba(231, 76, 60, 0.3);
}

.btn--danger:hover {
  transform: scale(1.02);
}

.btn--ghost {
  background: #f0f7ff;
  color: #6ba3d6;
  border: 1.5px solid #d6eaff;
}

/* Mobile */
@media (max-width: 767px) {
  .sidebar {
    max-width: 100%;
    min-width: unset;
  }
}
</style>
