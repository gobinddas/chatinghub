<template>
  <div
    class="message-row"
    :class="isMine ? 'message-row--mine' : 'message-row--theirs'"
  >
    <!-- Avatar for other user -->
    <div v-if="!isMine" class="message-avatar">
      <slot name="avatar">
        <div class="message-avatar__placeholder"></div>
      </slot>
    </div>

    <div
      class="message-bubble"
      :class="isMine ? 'message-bubble--mine' : 'message-bubble--theirs'"
    >
      <p class="message-bubble__text">{{ message.message }}</p>
      <p class="message-bubble__time">{{ formatTime(message.created_at) }}</p>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    message: Object,
    isMine: Boolean,
  },
  methods: {
    formatTime(timestamp) {
      if (!timestamp) return "";
      const d = new Date(timestamp);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    },
  },
};
</script>

<style scoped>
.message-row {
  display: flex;
  align-items: flex-end;
  gap: 0.5rem;
  animation: message-in 0.2s ease-out;
}

@keyframes message-in {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-row--mine {
  justify-content: flex-end;
}

.message-row--theirs {
  justify-content: flex-start;
}

.message-avatar {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
}

.message-avatar__placeholder {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, #38b6ff, #1a6fc4);
  opacity: 0.5;
}

.message-bubble {
  max-width: min(72%, 380px);
  padding: 0.65rem 0.9rem;
  border-radius: 18px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  word-break: break-word;
}

.message-bubble--mine {
  background: linear-gradient(135deg, #1a6fc4, #2d96e8);
  color: white;
  border-bottom-right-radius: 5px;
  box-shadow: 0 2px 8px rgba(26, 111, 196, 0.25);
}

.message-bubble--theirs {
  background: white;
  color: #1a3a5c;
  border-bottom-left-radius: 5px;
  border: 1px solid #d6eaff;
}

.message-bubble__text {
  font-size: 0.9rem;
  line-height: 1.45;
}

.message-bubble__time {
  font-size: 0.68rem;
  margin-top: 0.3rem;
  text-align: right;
  opacity: 0.65;
}

.message-bubble--mine .message-bubble__time {
  color: rgba(255, 255, 255, 0.8);
}

.message-bubble--theirs .message-bubble__time {
  color: #7fb1d4;
}

@media (max-width: 767px) {
  .message-bubble {
    max-width: 82%;
  }
}
</style>
