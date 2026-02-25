<template>
  <div class="chat-window">
    <!-- ── Incoming Call Notification Banner ─────────────────────────────── -->
    <!-- Shown when someone calls you but you haven't opened the video call yet -->
    <div v-if="incomingCall && !showCall" class="incoming-call-banner">
      <div class="incoming-call-banner__avatar">
        {{ incomingCall.callerName?.charAt(0).toUpperCase() }}
      </div>
      <div class="incoming-call-banner__info">
        <p class="incoming-call-banner__name">{{ incomingCall.callerName }}</p>
        <p class="incoming-call-banner__sub">Incoming video call...</p>
      </div>
      <div class="incoming-call-banner__actions">
        <button
          class="incoming-call-banner__btn incoming-call-banner__btn--accept"
          @click="acceptIncomingCall"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M15 10L19.553 7.724C19.705 7.648 19.875 7.612 20.045 7.62C20.215 7.627 20.381 7.678 20.526 7.768C20.671 7.857 20.791 7.982 20.874 8.13C20.958 8.278 21.003 8.444 21 8.613V15.387C21.003 15.556 20.958 15.722 20.874 15.87C20.791 16.018 20.671 16.143 20.526 16.232C20.381 16.322 20.215 16.373 20.045 16.38C19.875 16.388 19.705 16.352 19.553 16.276L15 14M5 18H13C14.1 18 15 17.1 15 16V8C15 6.9 14.1 6 13 6H5C3.9 6 3 6.9 3 8V16C3 17.1 3.9 18 5 18Z"
              stroke="currentColor"
              stroke-width="2"
            />
          </svg>
          Answer
        </button>
        <button
          class="incoming-call-banner__btn incoming-call-banner__btn--decline"
          @click="declineIncomingCall"
        >
          Decline
        </button>
      </div>
    </div>

    <!-- Header -->
    <div class="chat-header">
      <div class="chat-header__left">
        <!-- Back button (mobile) -->
        <button
          class="chat-header__back"
          @click="$emit('back')"
          aria-label="Back"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M19 12H5M5 12L12 19M5 12L12 5"
              stroke="white"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
        <div class="chat-header__avatar">
          {{ targetUser.username.charAt(0).toUpperCase() }}
        </div>
        <div class="chat-header__info">
          <p class="chat-header__name">{{ targetUser.username }}</p>
          <p class="chat-header__id">#{{ targetUser.profile_id }}</p>
        </div>
      </div>
      <button class="chat-header__call-btn" @click="startCall">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path
            d="M15 10L19.553 7.724C19.705 7.648 19.875 7.612 20.045 7.62C20.215 7.627 20.381 7.678 20.526 7.768C20.671 7.857 20.791 7.982 20.874 8.13C20.958 8.278 21.003 8.444 21 8.613V15.387C21.003 15.556 20.958 15.722 20.874 15.87C20.791 16.018 20.671 16.143 20.526 16.232C20.381 16.322 20.215 16.373 20.045 16.38C19.875 16.388 19.705 16.352 19.553 16.276L15 14M5 18H13C13.5304 18 14.0391 17.7893 14.4142 17.4142C14.7893 17.0391 15 16.5304 15 16V8C15 7.46957 14.7893 6.96086 14.4142 6.58579C14.0391 6.21071 13.5304 6 13 6H5C4.46957 6 3.96086 6.21071 3.58579 6.58579C3.21071 6.96086 3 7.46957 3 8V16C3 16.5304 3.21071 17.0391 3.58579 17.4142C3.96086 17.7893 4.46957 18 5 18Z"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        <span>Video Call</span>
      </button>
    </div>

    <!-- Messages area -->
    <div ref="messagesContainer" class="chat-messages">
      <div v-if="loading" class="chat-messages__loading">
        <div class="chat-messages__loading-dots">
          <span></span><span></span><span></span>
        </div>
        <p>Loading messages...</p>
      </div>

      <MessageBubble
        v-for="msg in messages"
        :key="msg.id"
        :message="msg"
        :isMine="msg.sender_id === currentUser.id"
      />

      <div
        v-if="!loading && messages.length === 0"
        class="chat-messages__empty"
      >
        <div class="chat-messages__empty-icon">👋</div>
        <p>No messages yet. Say hello!</p>
      </div>
    </div>

    <!-- Input bar -->
    <div class="chat-input">
      <div class="chat-input__box">
        <input
          v-model="newMessage"
          class="chat-input__field"
          placeholder="Type a message..."
          @keyup.enter="sendMessage"
        />
        <button
          @click="sendMessage"
          :disabled="!newMessage.trim()"
          class="chat-input__send"
          :class="{ 'chat-input__send--active': newMessage.trim() }"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M22 2L11 13M22 2L15 22L11 13L2 9L22 2Z"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>

    <!-- Video Call overlay -->
    <VideoCall
      v-if="showCall"
      :currentUser="currentUser"
      :targetUser="targetUser"
      :pendingIncomingCall="incomingCall"
      @close="onCallClose"
    />
  </div>
</template>

<script>
import socket from "../services/socket";
import { getMessages } from "../services/api";
import MessageBubble from "./MessageBubble.vue";
import VideoCall from "./VideoCall.vue";

export default {
  components: { MessageBubble, VideoCall },
  props: {
    currentUser: Object,
    targetUser: Object,
  },
  emits: ["back"],
  data() {
    return {
      messages: [],
      newMessage: "",
      showCall: false,
      loading: true,
      // Incoming call notification
      incomingCall: null,
    };
  },
  watch: {
    targetUser: {
      immediate: true,
      handler() {
        this.loadMessages();
      },
    },
  },
  mounted() {
    socket.on("receiveMessage", (msg) => {
      if (
        msg.sender_id === this.targetUser.id ||
        msg.receiver_id === this.targetUser.id
      ) {
        this.messages.push(msg);
        this.scrollToBottom();
      }
    });

    socket.on("messageSent", (msg) => {
      this.messages.push(msg);
      this.scrollToBottom();
    });

    // Listen for incoming calls globally so we show the banner
    socket.on("incomingCall", (data) => {
      this.incomingCall = data;
    });
  },
  beforeUnmount() {
    socket.off("receiveMessage");
    socket.off("messageSent");
    socket.off("incomingCall");
  },
  methods: {
    async loadMessages() {
      this.loading = true;
      this.messages = [];
      try {
        const res = await getMessages(this.currentUser.id, this.targetUser.id);
        this.messages = res.data;
        this.$nextTick(this.scrollToBottom);
      } catch (err) {
        console.error("Failed to load messages:", err);
      } finally {
        this.loading = false;
      }
    },

    sendMessage() {
      if (!this.newMessage.trim()) return;
      socket.emit("sendMessage", {
        senderId: this.currentUser.id,
        receiverId: this.targetUser.id,
        message: this.newMessage.trim(),
      });
      this.newMessage = "";
    },

    startCall() {
      this.showCall = true;
    },

    // User accepts incoming call from the banner
    acceptIncomingCall() {
      this.showCall = true;
      // incomingCall data is passed to VideoCall via prop
    },

    // User declines incoming call from the banner
    declineIncomingCall() {
      if (this.incomingCall?.from) {
        socket.emit("endCall", { to: this.incomingCall.from });
      }
      this.incomingCall = null;
    },

    onCallClose() {
      this.showCall = false;
      this.incomingCall = null;
    },

    scrollToBottom() {
      const el = this.$refs.messagesContainer;
      if (el) el.scrollTop = el.scrollHeight;
    },
  },
};
</script>

<style scoped>
.chat-window {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #f5f9ff;
  min-width: 0;
  height: 100%;
  position: relative;
}

/* ── Incoming call banner ─────────────────────────────────────────────────── */
.incoming-call-banner {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.25rem;
  background: linear-gradient(135deg, #0d2a4a, #0d3a6a);
  border-bottom: 2px solid #38b6ff;
  animation: slide-down 0.3s ease-out;
  flex-shrink: 0;
  flex-wrap: wrap;
}

@keyframes slide-down {
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.incoming-call-banner__avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: linear-gradient(135deg, #38b6ff, #1a6fc4);
  color: white;
  font-weight: 800;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  animation: ring-pulse 1.5s ease-in-out infinite;
  box-shadow: 0 0 0 0 rgba(56, 182, 255, 0.4);
}

@keyframes ring-pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(56, 182, 255, 0.5);
  }
  70% {
    box-shadow: 0 0 0 12px rgba(56, 182, 255, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(56, 182, 255, 0);
  }
}

.incoming-call-banner__info {
  flex: 1;
  min-width: 0;
}
.incoming-call-banner__name {
  font-weight: 700;
  font-size: 0.9rem;
  color: white;
}
.incoming-call-banner__sub {
  font-size: 0.75rem;
  color: #38b6ff;
}

.incoming-call-banner__actions {
  display: flex;
  gap: 0.5rem;
}

.incoming-call-banner__btn {
  padding: 0.4rem 0.9rem;
  border-radius: 20px;
  border: none;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  transition:
    opacity 0.2s,
    transform 0.1s;
}

.incoming-call-banner__btn:hover {
  opacity: 0.9;
  transform: scale(1.04);
}
.incoming-call-banner__btn--accept {
  background: #2ecc71;
  color: white;
}
.incoming-call-banner__btn--decline {
  background: rgba(255, 255, 255, 0.15);
  color: #ff6b6b;
  border: 1px solid rgba(255, 107, 107, 0.4);
}

/* Header */
.chat-header {
  background: linear-gradient(135deg, #1a6fc4 0%, #38b6ff 100%);
  padding: 0.875rem 1.25rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  box-shadow: 0 2px 12px rgba(26, 111, 196, 0.2);
}

.chat-header__left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.chat-header__back {
  display: none;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 8px;
  padding: 0.35rem;
  cursor: pointer;
  color: white;
  line-height: 0;
  transition: background 0.2s;
}

.chat-header__back:hover {
  background: rgba(255, 255, 255, 0.3);
}

.chat-header__avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.25);
  color: white;
  font-weight: 800;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid rgba(255, 255, 255, 0.5);
  flex-shrink: 0;
}

.chat-header__name {
  font-weight: 700;
  font-size: 0.95rem;
  color: white;
}
.chat-header__id {
  font-size: 0.72rem;
  color: rgba(255, 255, 255, 0.75);
  margin-top: 1px;
}

.chat-header__call-btn {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1.5px solid rgba(255, 255, 255, 0.35);
  border-radius: 10px;
  padding: 0.45rem 0.85rem;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  transition:
    background 0.2s,
    transform 0.1s;
  white-space: nowrap;
}

.chat-header__call-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.03);
}

/* Messages */
.chat-messages {
  flex: 1;
  padding: 1.25rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  background: #f5f9ff;
  background-image:
    radial-gradient(
      circle at 20% 50%,
      rgba(56, 182, 255, 0.04) 0%,
      transparent 50%
    ),
    radial-gradient(
      circle at 80% 20%,
      rgba(26, 111, 196, 0.04) 0%,
      transparent 50%
    );
}

.chat-messages::-webkit-scrollbar {
  width: 4px;
}
.chat-messages::-webkit-scrollbar-thumb {
  background: #c2deff;
  border-radius: 2px;
}

.chat-messages__loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 3rem;
  color: #7fb1d4;
  font-size: 0.85rem;
}

.chat-messages__loading-dots {
  display: flex;
  gap: 5px;
}
.chat-messages__loading-dots span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #38b6ff;
  animation: bounce 1.2s ease-in-out infinite;
}
.chat-messages__loading-dots span:nth-child(2) {
  animation-delay: 0.2s;
}
.chat-messages__loading-dots span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes bounce {
  0%,
  100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  50% {
    transform: translateY(-6px);
    opacity: 1;
  }
}

.chat-messages__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 3rem;
  color: #7fb1d4;
  font-size: 0.9rem;
}

.chat-messages__empty-icon {
  font-size: 2.5rem;
  animation: wave 1.5s ease-in-out infinite;
}

@keyframes wave {
  0%,
  100% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(20deg);
  }
  75% {
    transform: rotate(-10deg);
  }
}

/* Input */
.chat-input {
  padding: 0.875rem 1.25rem;
  background: white;
  border-top: 1px solid #d6eaff;
  flex-shrink: 0;
}

.chat-input__box {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  background: #f0f7ff;
  border: 1.5px solid #c2deff;
  border-radius: 16px;
  padding: 0.5rem 0.5rem 0.5rem 1rem;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}

.chat-input__box:focus-within {
  border-color: #38b6ff;
  box-shadow: 0 0 0 3px rgba(56, 182, 255, 0.15);
  background: white;
}

.chat-input__field {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-size: 0.9rem;
  color: #1a3a5c;
  min-width: 0;
}

.chat-input__field::placeholder {
  color: #a0bdd4;
}

.chat-input__send {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  border: none;
  background: #d0e8ff;
  color: #a0bdd4;
  cursor: not-allowed;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    background 0.2s,
    color 0.2s,
    transform 0.1s;
  flex-shrink: 0;
}

.chat-input__send--active {
  background: linear-gradient(135deg, #1a6fc4, #38b6ff);
  color: white;
  cursor: pointer;
}

.chat-input__send--active:hover {
  transform: scale(1.08);
  box-shadow: 0 4px 12px rgba(56, 182, 255, 0.4);
}

/* Mobile */
@media (max-width: 767px) {
  .chat-header__back {
    display: flex;
  }
  .chat-header__call-btn span {
    display: none;
  }
  .chat-header__call-btn {
    padding: 0.45rem 0.55rem;
  }
  .chat-messages {
    padding: 0.875rem;
  }
  .chat-input {
    padding: 0.75rem;
  }
}
</style>
