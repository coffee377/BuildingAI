<script setup lang="ts">
const CreateDataset = defineAsyncComponent(() => import("./components/create/index.vue"));
definePageMeta({
    layout: "full-screen",
    title: "knowledge.title",
    auth: false,
    inSystem: true,
    inLinkSelector: true,
});
</script>

<template>
    <CreateDataset />
</template>
