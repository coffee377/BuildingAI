<script setup lang="ts">
import { apiGetKnowledgeDetail } from "@/services/web/knowledge";

definePageMeta({ layout: "knowledge" });
const route = useRoute();
const router = useRouter();
const { t } = useI18n();
</script>

<template>
    <div>知识库详情</div>
</template>

<style scoped lang="scss"></style>
