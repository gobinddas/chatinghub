<template>
  <div class="w-2/3 flex flex-col bg-gray-50">
    <button
      @click="startCall"
      class="bg-green-600 text-white px-4 py-1 rounded"
    >
      📹 Call
    </button>
    <div class="p-4 bg-green-500 text-white">Chat Window</div>

    <div class="flex-1 p-4 overflow-y-auto">Messages will appear here</div>

    <div class="p-4 flex">
      <input
        v-model="message"
        class="flex-1 border rounded p-2"
        placeholder="Type message..."
      />
      <button
        @click="sendMessage"
        class="ml-2 bg-green-500 text-white px-4 rounded"
      >
        Send
      </button>
    </div>
    <VideoCall
      v-if="showCall"
      :currentUser="currentUser"
      :targetUser="{ id: 2 }"
      @close="showCall = false"
    />
  </div>
</template>

<script>
import socket from "../services/socket";
import VideoCall from "./VideoCall.vue";

export default {
  components: {
    VideoCall,
  },
  data() {
    return {
      message: "",
      showCall: false,
      currentUser: JSON.parse(localStorage.getItem("user")),
    };
  },
  methods: {
    sendMessage() {
      socket.emit("sendMessage", {
        senderId: 1,
        receiverId: 2,
        message: this.message,
      });
      this.message = "";
    },
    startCall() {
      this.showCall = true;
    },
  },
};
</script>
