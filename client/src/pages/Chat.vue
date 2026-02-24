<template>
  <div class="flex h-screen">
    <Sidebar />
    <ChatWindow />
  </div>
</template>

<script>
import Sidebar from "../components/Sidebar.vue";
import ChatWindow from "../components/ChatWindow.vue";

export default {
  components: { Sidebar, ChatWindow },
};
</script>
