<template>
  <div class="video-call-overlay">
    <div class="video-call">
      <!-- Header -->
      <div class="video-call__header">
        <div class="video-call__status">
          <span class="video-call__status-dot"></span>
          <span v-if="callAccepted"
            >In Call with {{ targetUser?.username }}</span
          >
          <span v-else-if="receivingCall"
            >Incoming Call from {{ callerName }}...</span
          >
          <span v-else-if="callInitiated"
            >Calling {{ targetUser?.username }}...</span
          >
          <span v-else>Ready to Call</span>
        </div>
        <h3 class="video-call__title">Video Call</h3>
      </div>

      <!-- Camera error message -->
      <div v-if="cameraError" class="video-call__error">
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          style="flex-shrink: 0; margin-top: 2px"
        >
          <circle cx="12" cy="12" r="10" stroke="#e74c3c" stroke-width="2" />
          <path
            d="M12 8v4M12 16h.01"
            stroke="#e74c3c"
            stroke-width="2"
            stroke-linecap="round"
          />
        </svg>
        <div>
          <p class="video-call__error-title">Camera / Microphone Blocked</p>
          <p class="video-call__error-text">{{ cameraError }}</p>
          <p class="video-call__error-hint">
            💡 <strong>Mobile fix:</strong> Your browser requires
            <strong>HTTPS</strong> for camera access. Run
            <code>npx ngrok http 5000</code> and update your IP in socket.js and
            api.js to the ngrok URL.
          </p>
        </div>
      </div>

      <!-- Videos -->
      <div class="video-call__grid" v-show="!cameraError">
        <!-- Remote video (large) -->
        <div class="video-call__remote">
          <video
            ref="userVideo"
            playsinline
            autoplay
            class="video-call__video video-call__video--remote"
          ></video>
          <div class="video-call__label video-call__label--remote">
            {{ targetUser?.username }}
          </div>

          <!-- Waiting indicator shown before call connects -->
          <div v-if="!callAccepted" class="video-call__waiting">
            <div class="video-call__avatar-big">
              {{ targetUser?.username?.charAt(0).toUpperCase() }}
            </div>
            <p v-if="callInitiated">Ringing {{ targetUser?.username }}...</p>
            <p v-else-if="receivingCall">{{ callerName }} is calling you</p>
            <p v-else>Start a call or wait for one</p>
          </div>
        </div>

        <!-- Local video (PiP) -->
        <div class="video-call__pip" v-show="streamReady">
          <video
            ref="myVideo"
            playsinline
            autoplay
            muted
            class="video-call__video video-call__video--local"
          ></video>
          <div class="video-call__label video-call__label--local">You</div>
        </div>
      </div>

      <!-- Controls -->
      <div class="video-call__controls">
        <!-- Accept incoming call -->
        <button
          v-if="receivingCall && !callAccepted"
          @click="answerCall"
          class="video-call__btn video-call__btn--accept"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z"
            />
          </svg>
          <span>Accept</span>
        </button>

        <!-- Start call button (shown when neither party is calling yet) -->
        <button
          v-if="
            !callInitiated && !callAccepted && !receivingCall && streamReady
          "
          @click="callUser"
          class="video-call__btn video-call__btn--start"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M15 10L19.553 7.724C19.705 7.648 19.875 7.612 20.045 7.62C20.215 7.627 20.381 7.678 20.526 7.768C20.671 7.857 20.791 7.982 20.874 8.13C20.958 8.278 21.003 8.444 21 8.613V15.387C21.003 15.556 20.958 15.722 20.874 15.87C20.791 16.018 20.671 16.143 20.526 16.232C20.381 16.322 20.215 16.373 20.045 16.38C19.875 16.388 19.705 16.352 19.553 16.276L15 14M5 18H13C13.53 18 14.039 17.789 14.414 17.414C14.789 17.039 15 16.53 15 16V8C15 7.47 14.789 6.961 14.414 6.586C14.039 6.211 13.53 6 13 6H5C4.47 6 3.961 6.211 3.586 6.586C3.211 6.961 3 7.47 3 8V16C3 16.53 3.211 17.039 3.586 17.414C3.961 17.789 4.47 18 5 18Z"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <span>Start Call</span>
        </button>

        <!-- End / Decline call -->
        <button @click="endCall" class="video-call__btn video-call__btn--end">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z"
              transform="rotate(135 12 12)"
            />
          </svg>
          <span>{{
            receivingCall && !callAccepted ? "Decline" : "End Call"
          }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import Peer from "simple-peer";
import socket from "../services/socket";

export default {
  props: ["currentUser", "targetUser"],
  emits: ["close"],
  data() {
    return {
      stream: null,
      streamReady: false,
      cameraError: null,
      receivingCall: false,
      callerName: "",
      caller: null,
      callerSignal: null,
      callAccepted: false,
      callInitiated: false,
      peer: null,
    };
  },

  async mounted() {
    await this.initCamera();
    this.registerSocketEvents();
  },

  beforeUnmount() {
    this.cleanupCall();
    socket.off("incomingCall");
    socket.off("callAccepted");
    socket.off("callEnded");
  },

  methods: {
    // ── FIX 3: Mobile camera ────────────────────────────────────────────────
    // Mobile browsers REQUIRE HTTPS for getUserMedia — http:// silently fails.
    // We use facingMode: "user" for front camera and catch errors with clear messages.
    async initCamera() {
      try {
        this.stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: {
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });
        this.$nextTick(() => {
          if (this.$refs.myVideo) this.$refs.myVideo.srcObject = this.stream;
        });
        this.streamReady = true;
      } catch (err) {
        console.error("Camera error:", err.name, err.message);
        if (
          err.name === "NotAllowedError" ||
          err.name === "PermissionDeniedError"
        ) {
          this.cameraError =
            "Permission denied. Allow camera & microphone access in browser settings.";
        } else if (err.name === "NotFoundError") {
          this.cameraError = "No camera or microphone found on this device.";
        } else if (location.protocol === "http:") {
          this.cameraError =
            "Camera blocked on HTTP. You must use HTTPS on mobile browsers.";
        } else {
          this.cameraError = `Camera error: ${err.message}`;
        }
      }
    },

    // ── FIX 2: All socket events were missing on the server ─────────────────
    registerSocketEvents() {
      socket.on("incomingCall", (data) => {
        this.receivingCall = true;
        this.caller = data.from;
        this.callerName = data.callerName || "Someone";
        this.callerSignal = data.signal;
      });

      socket.on("callAccepted", (signal) => {
        this.callAccepted = true;
        if (this.peer) this.peer.signal(signal);
      });

      socket.on("callEnded", () => {
        this.cleanupCall();
        this.$emit("close");
      });
    },

    callUser() {
      if (!this.stream) return alert("Camera not ready.");
      this.callInitiated = true;

      this.peer = new Peer({
        initiator: true,
        trickle: false,
        stream: this.stream,
        config: { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] },
      });

      this.peer.on("signal", (data) => {
        socket.emit("callUser", {
          userToCall: this.targetUser.id,
          signalData: data,
          from: this.currentUser.id,
          callerName: this.currentUser.username,
        });
      });

      this.peer.on("stream", (remoteStream) => {
        this.$nextTick(() => {
          if (this.$refs.userVideo) {
            this.$refs.userVideo.srcObject = remoteStream;
            this.callAccepted = true;
          }
        });
      });

      this.peer.on("error", (err) => console.error("Peer error:", err));
    },

    answerCall() {
      if (!this.stream) return alert("Camera not ready.");
      this.callAccepted = true;

      this.peer = new Peer({
        initiator: false,
        trickle: false,
        stream: this.stream,
        config: { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] },
      });

      this.peer.on("signal", (data) => {
        socket.emit("answerCall", { signal: data, to: this.caller });
      });

      this.peer.on("stream", (remoteStream) => {
        this.$nextTick(() => {
          if (this.$refs.userVideo)
            this.$refs.userVideo.srcObject = remoteStream;
        });
      });

      this.peer.on("error", (err) => console.error("Peer error:", err));
      this.peer.signal(this.callerSignal);
    },

    endCall() {
      const targetId = this.caller || this.targetUser?.id;
      if (targetId) socket.emit("endCall", { to: targetId });
      this.cleanupCall();
      this.$emit("close");
    },

    cleanupCall() {
      if (this.peer) {
        this.peer.destroy();
        this.peer = null;
      }
      if (this.stream) {
        this.stream.getTracks().forEach((t) => t.stop());
        this.stream = null;
      }
      this.callAccepted = false;
      this.callInitiated = false;
      this.receivingCall = false;
      this.streamReady = false;
    },
  },
};
</script>

<style scoped>
.video-call-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 15, 35, 0.92);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 1rem;
  backdrop-filter: blur(8px);
}

.video-call {
  width: 100%;
  max-width: 720px;
  background: #0d1f3a;
  border-radius: 20px;
  overflow: hidden;
  border: 1px solid rgba(56, 182, 255, 0.2);
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.6);
}

.video-call__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.875rem 1.25rem;
  background: rgba(56, 182, 255, 0.08);
  border-bottom: 1px solid rgba(56, 182, 255, 0.1);
}

.video-call__status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.75);
}

.video-call__status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #38b6ff;
  animation: pulse-status 1.5s ease-in-out infinite;
}

@keyframes pulse-status {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.4;
    transform: scale(0.8);
  }
}

.video-call__title {
  font-size: 0.95rem;
  font-weight: 700;
  color: white;
}

.video-call__error {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
  background: rgba(231, 76, 60, 0.12);
  border: 1px solid rgba(231, 76, 60, 0.3);
  border-radius: 10px;
  margin: 1rem;
  padding: 1rem;
}

.video-call__error-title {
  color: #e74c3c;
  font-weight: 700;
  font-size: 0.88rem;
  margin-bottom: 0.25rem;
}
.video-call__error-text {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.82rem;
  margin-bottom: 0.4rem;
}
.video-call__error-hint {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.78rem;
  line-height: 1.5;
}
.video-call__error-hint code {
  background: rgba(255, 255, 255, 0.1);
  padding: 0.1rem 0.3rem;
  border-radius: 4px;
  font-family: monospace;
}

.video-call__grid {
  position: relative;
  background: #080f1e;
  aspect-ratio: 16 / 9;
  overflow: hidden;
}

.video-call__remote {
  width: 100%;
  height: 100%;
  position: relative;
}
.video-call__video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  background: #0d1f3a;
}

.video-call__waiting {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  background: #0a1628;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
}

.video-call__avatar-big {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1a6fc4, #38b6ff);
  color: white;
  font-size: 2rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: ring-pulse 1.5s ease-in-out infinite;
}

@keyframes ring-pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(56, 182, 255, 0.5);
  }
  70% {
    box-shadow: 0 0 0 20px rgba(56, 182, 255, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(56, 182, 255, 0);
  }
}

.video-call__pip {
  position: absolute;
  bottom: 12px;
  right: 12px;
  width: clamp(90px, 22%, 160px);
  border-radius: 10px;
  overflow: hidden;
  border: 2px solid rgba(56, 182, 255, 0.4);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
}

.video-call__video--local {
  aspect-ratio: 4/3;
  height: auto;
}

.video-call__label {
  position: absolute;
  font-size: 0.72rem;
  font-weight: 600;
  color: white;
  background: rgba(0, 0, 0, 0.45);
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  backdrop-filter: blur(4px);
}

.video-call__label--remote {
  bottom: 8px;
  left: 10px;
}
.video-call__label--local {
  bottom: 4px;
  left: 6px;
  font-size: 0.65rem;
}

.video-call__controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: rgba(13, 31, 58, 0.8);
  flex-wrap: wrap;
}

.video-call__btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.7rem 1.5rem;
  border-radius: 50px;
  border: none;
  font-size: 0.88rem;
  font-weight: 700;
  cursor: pointer;
  transition:
    transform 0.15s,
    box-shadow 0.2s;
}

.video-call__btn:hover {
  transform: scale(1.05);
}
.video-call__btn--accept {
  background: linear-gradient(135deg, #27ae60, #2ecc71);
  color: white;
  box-shadow: 0 4px 16px rgba(46, 204, 113, 0.35);
}
.video-call__btn--start {
  background: linear-gradient(135deg, #1a6fc4, #38b6ff);
  color: white;
  box-shadow: 0 4px 16px rgba(56, 182, 255, 0.35);
}
.video-call__btn--end {
  background: linear-gradient(135deg, #c0392b, #e74c3c);
  color: white;
  box-shadow: 0 4px 16px rgba(231, 76, 60, 0.35);
}

@media (max-width: 480px) {
  .video-call__grid {
    aspect-ratio: 4/3;
  }
  .video-call__btn span {
    display: none;
  }
  .video-call__btn {
    padding: 0.7rem;
    border-radius: 50%;
    width: 52px;
    height: 52px;
    justify-content: center;
  }
}
</style>
