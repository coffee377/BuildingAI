<script setup lang="ts">
import { defineAsyncComponent, reactive } from "vue";

interface Props {
    /**
     * 是否创建成功后跳转到详情页
     */
    createSuccessToDetails?: boolean;
}

const props = withDefaults(defineProps<Props>(), { createSuccessToDetails: false });

import { useMessage } from "@fastbuildai/ui/composables/useMessage";

import { apiCreateKnowledge, type CreateKnowledgeParams } from "@/services/web/knowledge";

const router = useRouter();
const { t } = useI18n();
const toast = useMessage();

const KnowledgeForm = defineAsyncComponent(() => import("./knowledge-form.vue"));

const datasets = reactive<CreateKnowledgeParams>({ name: "", description: "" });

const backKnowledgeList = async () => {
    await router.replace("/public/knowledge");
};

const handleCreate = async (data: CreateKnowledgeParams) => {
    try {
        const res = await apiCreateKnowledge(data);
        // 跳转到新知识库详情页
        if (props.createSuccessToDetails && res.results) {
            await router.replace(`${res.results.id}`);
        } else {
            await backKnowledgeList();
        }
        toast.success(t("knowledge.create.success"));
    } catch (error) {
        console.error("知识库创建失败", error);
    }
};
</script>
<template>
    <div class="knowledge-container flex h-full flex-col rounded-lg p-4">
        <UButton
            variant="link"
            color="neutral"
            :label="$t('knowledge.title')"
            leading-icon="i-lucide-chevron-left"
            @click="backKnowledgeList"
            class="sticky top-0 pb-4"
        />
        <KnowledgeForm
            class="container border border-dashed border-indigo-200 px-24"
            v-model:name="datasets.name"
            v-model:description="datasets.description"
            @create="handleCreate"
        />
    </div>
</template>
