<script setup lang="ts">
export interface ExpandableProps {
    title?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    content?: any;
    index: number;
    expanded: boolean;
    onDelete?: () => void;
}

const props = withDefaults(defineProps<ExpandableProps>(), { expanded: false });

const localExpanded = ref(props.expanded);

watch(
    () => props.expanded,
    (value: boolean) => {
        localExpanded.value = value;
    },
    { immediate: true },
);

const toggleExpanded = () => {
    localExpanded.value = !localExpanded.value;
};
</script>

<template>
    <div class="mb-4 rounded-lg border border-slate-700/50 transition-colors">
        <div
            class="flex cursor-pointer items-center justify-between px-4 py-2"
            @click="toggleExpanded"
        >
            <div class="flex items-center space-x-2 text-sm font-medium text-zinc-700">
                <span class="mr-3 w-5 text-right">{{ index + 1 }}.</span>
                <span>
                    <slot name="title">{{ title ?? "Expandable" }}</slot>
                </span>
            </div>
            <div class="flex items-center space-x-2">
                <button class="text-slate-400 transition-colors hover:text-slate-600">
                    <UIcon v-if="localExpanded" name="i-lucide-chevron-up" />
                    <UIcon v-else name="i-lucide-chevron-down" />
                </button>
            </div>
        </div>
        <div v-if="localExpanded" class="space-y-6 px-6 pb-4 text-gray-600">
            <slot>{{ content ?? "暂无内容" }}</slot>
        </div>
    </div>
</template>

<style scoped lang="scss"></style>
