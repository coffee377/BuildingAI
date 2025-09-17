<script setup lang="ts">
import type { ChunkResponse } from "r2r-js";

import ExpandableList from "./ExpandableList.vue";
import type { ExpandableListProps } from "./types";

interface ExpandableChunksProps extends ExpandableListProps<ChunkResponse> {
    type?: "chunks";
}

const props = withDefaults(defineProps<ExpandableChunksProps>(), {
    type: "chunks",
});
</script>
<template>
    <ExpandableList v-if="type == 'chunks'" v-bind="props">
        <template #item-title="{ item, index }: { item: ChunkResponse; index: number }">
            Chunk {{ item.metadata?.chunk_order ?? index + 1 }}
        </template>
        <template #item-content="{ item }: { item: ChunkResponse; index: number }">
            <div class="space-y-2 rounded-lg bg-zinc-200/60 text-xs">
                <p class="py-2 pr-2 pl-4 leading-relaxed text-zinc-700">{{ item.text }}</p>
            </div>
        </template>
    </ExpandableList>
</template>

<style scoped lang="scss"></style>
