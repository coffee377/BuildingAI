<script setup lang="ts">
import Empty from "@/app/public/knowledge/_components/Empty.vue";

import Expandable from "./Expandable.vue";
import type { ExpandableListProps } from "./types";

const props = withDefaults(defineProps<ExpandableListProps>(), {
    type: "chunks",
    pagination: () => ({
        page: 1,
        pageSize: 10,
        loading: false,
        total: 0,
        items: [],
    }),
});

const allExpanded = ref(false);

const toggleAllExpanded = () => {
    allExpanded.value = !allExpanded.value;
};

const expandIcon = computed(() =>
    allExpanded.value ? "i-lucide-list-chevrons-down-up" : "i-lucide-list-chevrons-up-down",
);

const items = computed(() => props.pagination?.items ?? []);
const offset = computed(() => (props.pagination?.page - 1) * props.pagination?.pageSize);
</script>
<template>
    <div class="h-full">
        <div
            v-if="pagination.loading"
            class="flex flex-col items-center justify-between px-4 py-24 text-blue-100"
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                class="mr-3 size-12 animate-spin"
                viewBox="0 0 24 24"
            >
                <g
                    fill="none"
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="1.2"
                >
                    <path d="M22 12a1 1 0 0 1-10 0a1 1 0 0 0-10 0" />
                    <path d="M7 20.7a1 1 0 1 1 5-8.7a1 1 0 1 0 5-8.6" />
                    <path d="M7 3.3a1 1 0 1 1 5 8.6a1 1 0 1 0 5 8.6" />
                    <circle cx="12" cy="12" r="10" />
                </g>
            </svg>
            <span class="text-xs text-zinc-500">数据加载中……</span>
        </div>
        <template v-else-if="items && items.length">
            <div class="relative mt-4">
                <div class="mb-2 flex items-center justify-end">
                    <UTooltip :delay-duration="100" :text="allExpanded ? '折叠所有' : '展开所有'">
                        <div
                            @click="toggleAllExpanded"
                            class="flex cursor-pointer items-center pr-3"
                        >
                            <UIcon :name="expandIcon" class="text-primary size-6" />
                        </div>
                    </UTooltip>
                </div>
                <div class="space-y-4 pb-0">
                    <slot :items="items" :offset="offset" :allExpanded="allExpanded">
                        <Expandable
                            v-for="(item, index) in items"
                            :content="item"
                            :index="offset + index"
                            :expanded="allExpanded"
                        >
                            <template #title>
                                <slot name="item-title" :item="item" :index="offset + index"></slot>
                            </template>
                            <slot name="item-content" :item="item" :index="offset + index"></slot>
                        </Expandable>
                        <UPagination
                            class="flex justify-center"
                            v-model:page="pagination.page"
                            active-color="primary"
                            active-variant="subtle"
                            :total="pagination.total"
                        />
                    </slot>
                </div>
            </div>
        </template>
        <Empty v-else class="mt-16" />
    </div>
</template>

<style scoped lang="scss"></style>
