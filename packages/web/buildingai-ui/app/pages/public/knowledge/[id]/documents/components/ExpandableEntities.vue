<script setup lang="ts">
import type { EntityResponse } from "r2r-js";

import ExpandableList from "./ExpandableList.vue";
import type { ExpandableListProps } from "./types";

interface ExpandableEntitiesProps extends ExpandableListProps {
    type?: "entities";
}

const props = withDefaults(defineProps<ExpandableEntitiesProps>(), {
    type: "entities",
});
</script>
<template>
    <ExpandableList v-if="type == 'entities'" v-bind="props">
        <template #item-title="{ item }">
            {{ (item as EntityResponse).name }}
        </template>
        <template #item-content="{ item }">
            <div class="space-y-2 rounded-lg bg-zinc-200/60 text-xs">
                <p class="py-2 pr-2 pl-4 leading-relaxed text-zinc-700">
                    {{ (item as EntityResponse).description }}
                </p>
            </div>
        </template>
    </ExpandableList>
</template>

<style scoped lang="scss"></style>
