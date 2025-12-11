<script setup lang="ts">
import type { TabsItem } from "@nuxt/ui";

import ExpandableChunks from "./components/ExpandableChunks.vue";
import ExpandableEntities from "./components/ExpandableEntities.vue";
import ExpandableRelationships from "./components/ExpandableRelationships.vue";
import { useExpandable } from "./components/useExpandable";

interface ViewProps {
    docId: string;
}

const props = defineProps<ViewProps>();
const { t } = useI18n();

const items = ref<TabsItem[]>([
    {
        label: "切片",
        icon: "i-tabler-slice",
        value: "chunks",
    },
    {
        label: "实体",
        icon: "i-lucide-layers",
        value: "entities",
    },
    {
        label: "关系",
        icon: "i-tabler-circles-relation",
        value: "relationships",
    },
]);
const active = ref("chunks");
const expandable = useExpandable(props.docId);

onMounted(() => {
    expandable.firstLoad();
});
</script>

<template>
    <UDrawer
        title="文档详情"
        description="文档详情"
        direction="right"
        :handle="false"
        :ui="{ content: 'flex-col' }"
    >
        <UTooltip :delayDuration="100" :text="t('knowledge.documents.view')">
            <UButton
                icon="i-tabler-file-search"
                color="primary"
                variant="ghost"
                class="cursor-pointer"
            />
        </UTooltip>
        <template #content>
            <UTabs
                v-model="active"
                :unmount-on-hide="false"
                :items="items"
                :ui="{
                    trigger: 'cursor-pointer',
                    root: 'gap-0 border-b border-indigo-100',
                }"
            />
            <div class="flex-1 overflow-y-auto p-4 pt-0.5">
                <div class="min-h-full w-4xl rounded border-0 border-dashed border-slate-300/60">
                    <ExpandableChunks :type="active as 'chunks'" :pagination="expandable?.chunks" />
                    <ExpandableEntities
                        :type="active as 'entities'"
                        :pagination="expandable?.entities"
                    />
                    <ExpandableRelationships
                        :type="active as 'relationships'"
                        :pagination="expandable?.relationships"
                    />
                </div>
            </div>
        </template>
    </UDrawer>
</template>

<style scoped lang="scss"></style>
