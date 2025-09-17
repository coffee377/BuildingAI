<script setup lang="ts">
import type { EntityResponse, RelationshipResponse } from "r2r-js";

import ExpandableList from "./ExpandableList.vue";
import type { ExpandableListProps } from "./types";

interface ExpandableRelationshipsProps extends ExpandableListProps<RelationshipResponse> {
    type?: "relationships";
}

const props = withDefaults(defineProps<ExpandableRelationshipsProps>(), {
    type: "relationships",
});
</script>
<template>
    <ExpandableList v-if="type == 'relationships'" v-bind="props">
        <template #item-title="{ item, index }: { item: RelationshipResponse; index: number }">
            <div class="space-x-2.5">
                <span>{{ item.subject }}</span>
                <span>{{ item.predicate }}</span>
                <span>{{ item.object }}</span>
            </div>
        </template>
        <template #item-content="{ item }: { item: RelationshipResponse; index: number }">
            <div class="space-y-2 rounded-lg bg-zinc-200/60 text-xs">
                <p class="py-2 pr-2 pl-4 leading-relaxed text-zinc-700">{{ item.description }}</p>
            </div>
        </template>
    </ExpandableList>
</template>

<style scoped lang="scss"></style>
