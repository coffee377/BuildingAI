<script setup lang="ts">
import type { FileItem } from "@buildingai/service/models/globals";
import { ref } from "vue";

interface KnowledgeFormProps {
    name: string;
    description?: string;
}

const emits = defineEmits<{
    (e: "update:name", v: string): void;
    (e: "update:description", v: string): void;
    (e: "update:fileIds", v: string[]): void;
    (e: "create", data: KnowledgeFormProps): void;
}>();

const props = withDefaults(defineProps<KnowledgeFormProps>(), {});

const { t } = useI18n();
const toast = useMessage();

const name = useVModel(props, "name", emits);
const description = useVModel(props, "description", emits);

const fileList = ref<FileItem[]>([]);

// const canProceed = computed(
//     () => fileList.value.length > 0 && fileList.value.every((f) => f.status === "success"),
// );
//
// const handleFileListUpdate = (files: FileItem[]) => {
//     fileList.value = files;
//     emits("update:fileIds", files.map((f) => f.id) as string[]);
// };

const handleCreate = () => {
    const data: KnowledgeFormProps = { name: unref(name), description: unref(description) };
    if (!data.name || !data.name.trim()) {
        toast.error(t("ai-datasets.backend.settings.nameInput"));
        return;
    }
    if (!data.description || !data.description.trim()) {
        toast.error(t("console-ai-datasets.settings.descriptionInput"));
        return;
    }
    emits("create", data);
};
</script>

<template>
    <div class="mx-auto inline-block rounded-lg px-4 pt-6">
        <div class="mb-8">
            <h5 class="text-foreground mb-1 text-lg font-medium">
                {{ $t("knowledge.create.form.basicInfo") }}
            </h5>
            <p class="text-muted text-sm">
                {{ $t("knowledge.create.form.basicInfoDesc") }}
            </p>
        </div>

        <div class="space-y-8">
            <!--  知识库名称及描述   -->
            <div class="flex flex-col space-y-8">
                <UFormField
                    :label="$t('ai-datasets.backend.create.name')"
                    class="flex w-full justify-between"
                    :ui="{
                        wrapper: 'flex',
                        label: 'text-accent-foreground font-medium width140',
                        container: 'flex-1',
                    }"
                    required
                >
                    <UInput
                        v-model="name"
                        :placeholder="$t('ai-datasets.backend.settings.nameInput')"
                        :ui="{ root: 'w-full' }"
                    />
                </UFormField>

                <UFormField
                    class="flex w-full justify-between"
                    :ui="{
                        wrapper: 'flex  ',
                        labelWrapper: 'items-stretch ',
                        label: 'text-accent-foreground width140 pt-2',
                        container: 'flex-1',
                    }"
                    :label="$t('ai-datasets.backend.create.description')"
                    required
                >
                    <UTextarea
                        v-model="description"
                        :placeholder="$t('ai-datasets.backend.settings.descriptionInput')"
                        :ui="{ root: 'w-full' }"
                    />
                </UFormField>
            </div>

            <!-- 文件上传预留组件 -->
            <div v-if="false">
                <UFormField
                    :label="$t('ai-datasets.backend.create.uploadTextFile')"
                    class="flex w-full justify-between"
                    :ui="{
                        wrapper: 'flex  ',
                        labelWrapper: 'items-stretch ',
                        label: 'text-accent-foreground width140 pt-2',
                        container: 'flex-1',
                    }"
                    required
                >
                    <!--                <FileUploader :file-list="fileList" @update:fileList="handleFileListUpdate" />-->
                </UFormField>
                <UFormField
                    v-if="fileList.length"
                    :label="$t('ai-datasets.backend.create.fileList')"
                    class="flex w-full justify-between"
                    :ui="{
                        wrapper: 'flex  ',
                        labelWrapper: 'items-stretch ',
                        label: 'text-accent-foreground width140 pt-2',
                        container: 'flex-1',
                    }"
                    required
                >
                    <!--                <FilePreview :file-list="fileList" @update:fileList="handleFileListUpdate" />-->
                </UFormField>
            </div>

            <UFormField
                label=" "
                class="flex w-full justify-between"
                :ui="{
                    wrapper: 'flex  ',
                    labelWrapper: 'items-stretch ',
                    label: 'text-accent-foreground width140 pt-2',
                    container: 'flex-1 flex gap-4 items-center',
                }"
            >
                <UButton
                    leading-icon="i-lucide-folder"
                    color="primary"
                    size="lg"
                    @click="handleCreate"
                >
                    {{ $t("knowledge.create.form.submit") }}
                </UButton>
            </UFormField>

            <template>
                <USeparator />
            </template>
        </div>
    </div>
</template>
