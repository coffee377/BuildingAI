<script lang="ts" setup>
const emit = defineEmits<{
    (e: "change", files: File[]): void;
}>();

const { t } = useI18n();

const handleFileChange = (file: unknown) => {
    const files: File[] = Array.isArray(file) ? file : [file];
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
