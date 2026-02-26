<template>
  <div class="profile-page">
    <!-- Back button -->
    <div class="profile-topbar">
      <button class="profile-topbar__back" @click="$router.back()">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path
            d="M19 12H5M5 12L12 19M5 12L12 5"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        Back
      </button>
      <span class="profile-topbar__title">
        {{ isOwnProfile ? "My Profile" : "Profile" }}
      </span>
      <div style="width: 80px"></div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="profile-loading">
      <div class="profile-loading__spinner"></div>
      <p>Loading profile...</p>
    </div>

    <!-- Private profile (not own) -->
    <div v-else-if="profile?.isPrivate" class="profile-private">
      <div class="profile-private__icon">🔒</div>
      <h2>Private Profile</h2>
      <p>This user has set their profile to private.</p>
    </div>

    <!-- Profile content -->
    <div v-else-if="profile" class="profile-body">
      <!-- Cover + Avatar section -->
      <div class="profile-hero">
        <div class="profile-hero__cover"></div>

        <div class="profile-hero__bottom">
          <!-- Avatar -->
          <div class="profile-avatar-wrap">
            <div class="profile-avatar">
              <img
                v-if="avatarPreview || profile.profile_picture"
                :src="avatarPreview || getAvatarUrl(profile.profile_picture)"
                class="profile-avatar__img"
                alt="avatar"
              />
              <span v-else class="profile-avatar__letter">
                {{ profile.username?.charAt(0).toUpperCase() }}
              </span>
            </div>

            <!-- Camera button (own profile only) -->
            <label
              v-if="isOwnProfile"
              class="profile-avatar__upload-btn"
              title="Change photo"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path
                  d="M23 19C23 19.5304 22.7893 20.0391 22.4142 20.4142C22.0391 20.7893 21.5304 21 21 21H3C2.46957 21 1.96086 20.7893 1.58579 20.4142C1.21071 20.0391 1 19.5304 1 19V8C1 7.46957 1.21071 6.96086 1.58579 6.58579C1.96086 6.21071 2.46957 6 3 6H7L9 3H15L17 6H21C21.5304 6 22.0391 6.21071 22.4142 6.58579C22.7893 6.96086 23 7.46957 23 8V19Z"
                  stroke="white"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <circle cx="12" cy="13" r="4" stroke="white" stroke-width="2" />
              </svg>
              <input
                type="file"
                accept="image/*"
                style="display: none"
                @change="onAvatarSelected"
              />
            </label>
          </div>

          <!-- Name + role -->
          <div class="profile-hero__info">
            <h1 class="profile-hero__name">{{ profile.username }}</h1>
            <p class="profile-hero__role">
              {{ profile.role || (isOwnProfile ? "Add your role..." : "") }}
            </p>
            <span class="profile-hero__id">#{{ profile.profile_id }}</span>
          </div>

          <!-- Status badge -->
          <div class="profile-hero__status-wrap">
            <span
              class="profile-status-badge"
              :class="
                profile.status === 'private'
                  ? 'profile-status-badge--private'
                  : 'profile-status-badge--public'
              "
            >
              {{ profile.status === "private" ? "🔒 Private" : "🌐 Public" }}
            </span>
          </div>
        </div>
      </div>

      <!-- Avatar upload actions -->
      <div v-if="avatarPreview && isOwnProfile" class="profile-avatar-actions">
        <p class="profile-avatar-actions__label">New photo selected</p>
        <button
          class="btn btn--primary btn--sm"
          @click="submitAvatar"
          :disabled="avatarUploading"
        >
          {{ avatarUploading ? "Uploading..." : "Save Photo" }}
        </button>
        <button class="btn btn--ghost btn--sm" @click="cancelAvatar">
          Cancel
        </button>
      </div>

      <!-- Info cards -->
      <div class="profile-cards">
        <!-- About card -->
        <div class="profile-card">
          <div class="profile-card__header">
            <h3 class="profile-card__title">About</h3>
            <button
              v-if="isOwnProfile && !editing"
              class="profile-card__edit-btn"
              @click="startEdit"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path
                  d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              Edit
            </button>
          </div>

          <!-- View mode -->
          <div v-if="!editing" class="profile-card__body">
            <div class="profile-info-row">
              <span class="profile-info-row__icon">📧</span>
              <div>
                <p class="profile-info-row__label">Email</p>
                <p class="profile-info-row__value">{{ profile.email }}</p>
              </div>
            </div>
            <div class="profile-info-row">
              <span class="profile-info-row__icon">💼</span>
              <div>
                <p class="profile-info-row__label">Role / Position</p>
                <p class="profile-info-row__value">{{ profile.role || "—" }}</p>
              </div>
            </div>
            <div class="profile-info-row">
              <span class="profile-info-row__icon">🎂</span>
              <div>
                <p class="profile-info-row__label">Date of Birth</p>
                <p class="profile-info-row__value">
                  {{ formatDate(profile.date_of_birth) }}
                </p>
              </div>
            </div>
            <div class="profile-info-row">
              <span class="profile-info-row__icon">📅</span>
              <div>
                <p class="profile-info-row__label">Member Since</p>
                <p class="profile-info-row__value">
                  {{ formatDate(profile.created_at) }}
                </p>
              </div>
            </div>
            <div class="profile-info-row">
              <span class="profile-info-row__icon">🔍</span>
              <div>
                <p class="profile-info-row__label">Profile Visibility</p>
                <p class="profile-info-row__value">
                  {{
                    profile.status === "private"
                      ? "Private — only you can see details"
                      : "Public — everyone can view"
                  }}
                </p>
              </div>
            </div>
          </div>

          <!-- Edit mode -->
          <div v-else class="profile-card__body profile-card__body--edit">
            <div class="form-group">
              <label class="form-label">Role / Job Position</label>
              <input
                v-model="editForm.role"
                type="text"
                class="form-input"
                placeholder="e.g. Senior Developer, Designer, Manager..."
                maxlength="150"
              />
            </div>

            <div class="form-group">
              <label class="form-label">Date of Birth</label>
              <input
                v-model="editForm.date_of_birth"
                type="date"
                class="form-input"
                :max="today"
              />
            </div>

            <div class="form-group">
              <label class="form-label">Profile Visibility</label>
              <div class="toggle-group">
                <button
                  class="toggle-option"
                  :class="{
                    'toggle-option--active': editForm.status === 'public',
                  }"
                  @click="editForm.status = 'public'"
                >
                  🌐 Public
                </button>
                <button
                  class="toggle-option"
                  :class="{
                    'toggle-option--active': editForm.status === 'private',
                  }"
                  @click="editForm.status = 'private'"
                >
                  🔒 Private
                </button>
              </div>
              <p class="form-hint">
                <span v-if="editForm.status === 'private'"
                  >Only you will see your profile details.</span
                >
                <span v-else>Anyone can view your profile details.</span>
              </p>
            </div>

            <div class="form-actions">
              <button
                class="btn btn--primary"
                @click="saveProfile"
                :disabled="saving"
              >
                {{ saving ? "Saving..." : "Save Changes" }}
              </button>
              <button class="btn btn--ghost" @click="cancelEdit">Cancel</button>
            </div>

            <p v-if="saveError" class="form-error">{{ saveError }}</p>
            <p v-if="saveSuccess" class="form-success">✅ Profile updated!</p>
          </div>
        </div>

        <!-- Message button (other users only) -->
        <div v-if="!isOwnProfile" class="profile-card profile-card--action">
          <button class="btn btn--primary btn--full" @click="startChat">
            💬 Send Message
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import {
  getUserProfile,
  updateProfile,
  uploadAvatar,
  getAvatarUrl,
} from "../services/api";

export default {
  name: "ProfilePage",
  data() {
    return {
      profile: null,
      loading: true,
      editing: false,
      saving: false,
      saveError: "",
      saveSuccess: false,
      editForm: { role: "", date_of_birth: "", status: "public" },
      avatarFile: null,
      avatarPreview: null,
      avatarUploading: false,
      today: new Date().toISOString().split("T")[0],
    };
  },
  computed: {
    currentUser() {
      return JSON.parse(localStorage.getItem("user"));
    },
    targetUserId() {
      return this.$route.params.userId || this.currentUser?.id;
    },
    isOwnProfile() {
      return String(this.targetUserId) === String(this.currentUser?.id);
    },
  },
  async mounted() {
    await this.loadProfile();
  },
  watch: {
    "$route.params.userId": async function () {
      await this.loadProfile();
    },
  },
  methods: {
    getAvatarUrl,

    async loadProfile() {
      this.loading = true;
      this.editing = false;
      this.avatarPreview = null;
      try {
        const res = await getUserProfile(this.targetUserId);
        this.profile = res.data;
      } catch (err) {
        console.error("Failed to load profile", err);
      } finally {
        this.loading = false;
      }
    },

    formatDate(val) {
      if (!val) return "—";
      return new Date(val).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    },

    startEdit() {
      this.editForm = {
        role: this.profile.role || "",
        date_of_birth: this.profile.date_of_birth
          ? this.profile.date_of_birth.split("T")[0]
          : "",
        status: this.profile.status || "public",
      };
      this.saveError = "";
      this.saveSuccess = false;
      this.editing = true;
    },

    cancelEdit() {
      this.editing = false;
      this.saveError = "";
      this.saveSuccess = false;
    },

    async saveProfile() {
      this.saving = true;
      this.saveError = "";
      this.saveSuccess = false;
      try {
        const res = await updateProfile(this.editForm);
        this.profile = { ...this.profile, ...res.data.user };
        // Update localStorage so sidebar reflects new data
        const stored = JSON.parse(localStorage.getItem("user")) || {};
        localStorage.setItem(
          "user",
          JSON.stringify({ ...stored, ...res.data.user }),
        );
        this.saveSuccess = true;
        setTimeout(() => {
          this.editing = false;
          this.saveSuccess = false;
        }, 1500);
      } catch (err) {
        this.saveError = err.response?.data?.message || "Failed to save.";
      } finally {
        this.saving = false;
      }
    },

    onAvatarSelected(e) {
      const file = e.target.files[0];
      if (!file) return;
      this.avatarFile = file;
      this.avatarPreview = URL.createObjectURL(file);
    },

    cancelAvatar() {
      this.avatarFile = null;
      if (this.avatarPreview) URL.revokeObjectURL(this.avatarPreview);
      this.avatarPreview = null;
    },

    async submitAvatar() {
      if (!this.avatarFile) return;
      this.avatarUploading = true;
      try {
        const form = new FormData();
        form.append("avatar", this.avatarFile);
        const res = await uploadAvatar(form);
        this.profile.profile_picture = res.data.profile_picture;
        // Update localStorage
        const stored = JSON.parse(localStorage.getItem("user")) || {};
        localStorage.setItem(
          "user",
          JSON.stringify({
            ...stored,
            profile_picture: res.data.profile_picture,
          }),
        );
        this.cancelAvatar();
      } catch (err) {
        alert(err.response?.data?.message || "Upload failed.");
      } finally {
        this.avatarUploading = false;
      }
    },

    startChat() {
      // Navigate to chat and pre-select this user
      this.$router.push({ path: "/chat", query: { userId: this.profile.id } });
    },
  },
};
</script>

<style scoped>
* {
  box-sizing: border-box;
}

.profile-page {
  min-height: 100vh;
  background: #f0f7ff;
  font-family: "Nunito", "Segoe UI", sans-serif;
}

/* Topbar */
.profile-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.875rem 1.25rem;
  background: white;
  border-bottom: 1px solid #d6eaff;
  position: sticky;
  top: 0;
  z-index: 10;
}

.profile-topbar__back {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: none;
  border: none;
  cursor: pointer;
  color: #1a6fc4;
  font-size: 0.88rem;
  font-weight: 700;
  padding: 0.4rem 0.75rem;
  border-radius: 8px;
  transition: background 0.2s;
}

.profile-topbar__back:hover {
  background: #e8f3ff;
}

.profile-topbar__title {
  font-weight: 800;
  font-size: 1rem;
  color: #1a3a5c;
}

/* Loading */
.profile-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  min-height: 50vh;
  color: #7fb1d4;
}

.profile-loading__spinner {
  width: 36px;
  height: 36px;
  border: 3px solid #d6eaff;
  border-top-color: #38b6ff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Private */
.profile-private {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  min-height: 50vh;
  color: #7fb1d4;
  text-align: center;
  padding: 2rem;
}

.profile-private__icon {
  font-size: 3rem;
}
.profile-private h2 {
  color: #1a3a5c;
  font-size: 1.25rem;
  font-weight: 800;
}
.profile-private p {
  font-size: 0.9rem;
}

/* Hero */
.profile-hero {
  background: white;
  margin: 1.25rem;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 16px rgba(26, 111, 196, 0.08);
}

.profile-hero__cover {
  height: 120px;
  background: linear-gradient(135deg, #1a6fc4 0%, #38b6ff 50%, #87ceeb 100%);
  position: relative;
}

.profile-hero__bottom {
  padding: 0 1.5rem 1.25rem;
  display: flex;
  align-items: flex-end;
  gap: 1rem;
  flex-wrap: wrap;
}

/* Avatar */
.profile-avatar-wrap {
  position: relative;
  margin-top: -40px;
  flex-shrink: 0;
}

.profile-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #38b6ff, #1a6fc4);
  border: 4px solid white;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(26, 111, 196, 0.25);
}

.profile-avatar__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-avatar__letter {
  color: white;
  font-size: 2rem;
  font-weight: 800;
}

.profile-avatar__upload-btn {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 26px;
  height: 26px;
  background: linear-gradient(135deg, #1a6fc4, #38b6ff);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: 2px solid white;
  transition: transform 0.2s;
}

.profile-avatar__upload-btn:hover {
  transform: scale(1.1);
}

.profile-hero__info {
  flex: 1;
  padding-bottom: 0.25rem;
  min-width: 0;
}

.profile-hero__name {
  font-size: 1.25rem;
  font-weight: 800;
  color: #1a3a5c;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.profile-hero__role {
  font-size: 0.85rem;
  color: #6ba3d6;
  margin: 2px 0;
}

.profile-hero__id {
  font-size: 0.72rem;
  color: #a0bdd4;
  background: #f0f7ff;
  padding: 0.15rem 0.5rem;
  border-radius: 10px;
  font-weight: 700;
}

.profile-hero__status-wrap {
  margin-left: auto;
  align-self: flex-end;
  padding-bottom: 0.25rem;
}

.profile-status-badge {
  padding: 0.3rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
}

.profile-status-badge--public {
  background: #e0f5ec;
  color: #27ae60;
}

.profile-status-badge--private {
  background: #fff0e0;
  color: #e67e22;
}

/* Avatar upload actions */
.profile-avatar-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: -0.5rem 1.25rem 0.5rem;
  padding: 0.75rem 1rem;
  background: #fff8e0;
  border: 1px solid #ffe0a0;
  border-radius: 10px;
  flex-wrap: wrap;
}

.profile-avatar-actions__label {
  font-size: 0.82rem;
  color: #e67e22;
  font-weight: 600;
  flex: 1;
}

/* Cards */
.profile-cards {
  padding: 0 1.25rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.profile-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(26, 111, 196, 0.06);
}

.profile-card--action {
  padding: 1rem;
}

.profile-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem 0;
}

.profile-card__title {
  font-size: 0.85rem;
  font-weight: 800;
  color: #1a3a5c;
  text-transform: uppercase;
  letter-spacing: 0.6px;
}

.profile-card__edit-btn {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  background: #f0f7ff;
  border: 1.5px solid #c2deff;
  color: #1a6fc4;
  border-radius: 8px;
  padding: 0.3rem 0.7rem;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s;
}

.profile-card__edit-btn:hover {
  background: #d6eaff;
}

.profile-card__body {
  padding: 0.75rem 1.25rem 1.25rem;
}

.profile-card__body--edit {
  padding: 1rem 1.25rem 1.25rem;
}

/* Info rows */
.profile-info-row {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.6rem 0;
  border-bottom: 1px solid #f0f7ff;
}

.profile-info-row:last-child {
  border-bottom: none;
}

.profile-info-row__icon {
  font-size: 1rem;
  margin-top: 2px;
  flex-shrink: 0;
}

.profile-info-row__label {
  font-size: 0.7rem;
  color: #7fb1d4;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 2px;
}

.profile-info-row__value {
  font-size: 0.9rem;
  color: #1a3a5c;
  font-weight: 600;
}

/* Form */
.form-group {
  margin-bottom: 1rem;
}

.form-label {
  display: block;
  font-size: 0.78rem;
  font-weight: 700;
  color: #6ba3d6;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.4rem;
}

.form-input {
  width: 100%;
  padding: 0.6rem 0.875rem;
  border: 1.5px solid #c2deff;
  border-radius: 10px;
  background: #f8fbff;
  color: #1a3a5c;
  font-size: 0.9rem;
  outline: none;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}

.form-input:focus {
  border-color: #38b6ff;
  box-shadow: 0 0 0 3px rgba(56, 182, 255, 0.15);
  background: white;
}

/* Toggle */
.toggle-group {
  display: flex;
  gap: 0.5rem;
}

.toggle-option {
  flex: 1;
  padding: 0.55rem;
  border: 2px solid #d6eaff;
  border-radius: 10px;
  background: #f8fbff;
  color: #7fb1d4;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.toggle-option--active {
  background: linear-gradient(135deg, #e8f4ff, #d6eaff);
  border-color: #38b6ff;
  color: #1a6fc4;
}

.form-hint {
  margin-top: 0.4rem;
  font-size: 0.76rem;
  color: #a0bdd4;
}

.form-error {
  margin-top: 0.5rem;
  font-size: 0.8rem;
  color: #e74c3c;
  font-weight: 600;
}

.form-success {
  margin-top: 0.5rem;
  font-size: 0.8rem;
  color: #27ae60;
  font-weight: 600;
}

.form-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.65rem 1.25rem;
  border-radius: 10px;
  border: none;
  font-size: 0.88rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.btn--primary {
  background: linear-gradient(135deg, #1a6fc4, #38b6ff);
  color: white;
  box-shadow: 0 2px 10px rgba(56, 182, 255, 0.3);
}

.btn--primary:hover:not(:disabled) {
  transform: scale(1.03);
  box-shadow: 0 4px 16px rgba(56, 182, 255, 0.4);
}

.btn--ghost {
  background: #f0f7ff;
  color: #6ba3d6;
  border: 1.5px solid #d6eaff;
}

.btn--ghost:hover {
  background: #e0efff;
}

.btn--sm {
  padding: 0.4rem 0.875rem;
  font-size: 0.8rem;
}
.btn--full {
  width: 100%;
}

/* Mobile */
@media (max-width: 480px) {
  .profile-hero {
    margin: 0.75rem;
  }
  .profile-cards {
    padding: 0 0.75rem 2rem;
  }
  .profile-hero__bottom {
    gap: 0.75rem;
  }
  .profile-hero__status-wrap {
    margin-left: 0;
    width: 100%;
  }
}
</style>
