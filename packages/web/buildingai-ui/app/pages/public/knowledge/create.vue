<script setup lang="ts">
const CreateDataset = defineAsyncComponent(() => import("./components/create/index.vue"));
definePageMeta({
    title: "knowledge.title",
    auth: false,
});
</script>

<template>
    <CreateDataset />
</template>
