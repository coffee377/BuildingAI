<script lang="ts" setup>
import { useMessage } from "@fastbuildai/ui";
import { ref } from "vue";

import type { FileItem } from "@/models/global";

const emit = defineEmits<{
    (e: "change", files: File[]): void;
}>();

const { t } = useI18n();
const toast = useMessage();
const files = ref<FileItem[]>([]);

const handleFileChange = (file: File | File[]) => {
    const files = Array.isArray(file) ? file : [file];
    if (files.length) emit("change", files);
};
</script>

<template>
    <UFileUpload
        color="neutral"
        highlight
        reset
        layout="list"
        multiple
        :label="t('knowledge.documents.create.dragOrSelectFiles')"
        :ui="{
            base: 'min-h-48',
        }"
        @update:model-value="handleFileChange"
    >
    </UFileUpload>
</template>
