<script setup lang="ts">
import type { RelationshipResponse } from "r2r-js";

import ExpandableList from "./ExpandableList.vue";
import type { ExpandableListProps } from "./types";

interface ExpandableRelationshipsProps extends ExpandableListProps {
    type?: "relationships";
}

const props = withDefaults(defineProps<ExpandableRelationshipsProps>(), {
    type: "relationships",
});
</script>
<template>
    <ExpandableList v-if="type == 'relationships'" v-bind="props">
        <template #item-title="{ item }">
            <div class="space-x-2.5">
                <span>{{ (item as RelationshipResponse).subject }}</span>
                <span>{{ (item as RelationshipResponse).predicate }}</span>
                <span>{{ (item as RelationshipResponse).object }}</span>
            </div>
        </template>
        <template #item-content="{ item }">
            <div class="space-y-2 rounded-lg bg-zinc-200/60 text-xs">
                <p class="py-2 pr-2 pl-4 leading-relaxed text-zinc-700">
                    {{ (item as RelationshipResponse).description }}
                </p>
            </div>
        </template>
    </ExpandableList>
</template>

<style scoped lang="scss"></style>
