<template>
  <div
    class="fixed inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center"
  >
    <div class="flex gap-4">
      <video
        ref="myVideo"
        playsinline
        autoplay
        muted
        class="w-64 rounded-lg"
      ></video>
      <video
        ref="userVideo"
        playsinline
        autoplay
        class="w-64 rounded-lg"
      ></video>
    </div>

    <div class="mt-6">
      <button
        v-if="receivingCall && !callAccepted"
        @click="answerCall"
        class="bg-green-500 text-white px-6 py-2 rounded mr-3"
      >
        Accept
      </button>

      <button
        @click="$emit('close')"
        class="bg-red-500 text-white px-6 py-2 rounded"
      >
        End
      </button>
    </div>
  </div>
</template>

<script>
import Peer from "simple-peer";
import socket from "../services/socket";

export default {
  props: ["currentUser", "targetUser"],
  data() {
    return {
      stream: null,
      receivingCall: false,
      caller: null,
      callerSignal: null,
      callAccepted: false,
      peer: null,
    };
  },
  async mounted() {
    this.stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    this.$refs.myVideo.srcObject = this.stream;

    socket.on("incomingCall", (data) => {
      this.receivingCall = true;
      this.caller = data.from;
      this.callerSignal = data.signal;
    });

    socket.on("callAccepted", (signal) => {
      this.callAccepted = true;
      this.peer.signal(signal);
    });
  },
  methods: {
    callUser() {
      this.peer = new Peer({
        initiator: true,
        trickle: false,
        stream: this.stream,
      });

      this.peer.on("signal", (data) => {
        socket.emit("callUser", {
          userToCall: this.targetUser.id,
          signalData: data,
          from: this.currentUser.id,
        });
      });

      this.peer.on("stream", (stream) => {
        this.$refs.userVideo.srcObject = stream;
      });
    },

    answerCall() {
      this.callAccepted = true;

      this.peer = new Peer({
        initiator: false,
        trickle: false,
        stream: this.stream,
      });

      this.peer.on("signal", (data) => {
        socket.emit("answerCall", {
          signal: data,
          to: this.caller,
        });
      });

      this.peer.on("stream", (stream) => {
        this.$refs.userVideo.srcObject = stream;
      });

      this.peer.signal(this.callerSignal);
    },
  },
};
</script>
