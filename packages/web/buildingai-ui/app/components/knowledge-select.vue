<script setup lang="ts">
import { usePaging } from "@buildingai/hooks/use-paging";
import { apiGetKnowledgeList } from "@buildingai/service/webapi/knowledge";
import BdScrollArea from "@buildingai/ui/components/bd-scroll-area/index.vue";
import type { CollectionResponse } from "r2r-js";
import { ref } from "vue";

interface Props {
    modelValue?: { id: string; name: string };
    disabled?: boolean;
    showDescription?: boolean;
    defaultSelected?: boolean;
    console?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    showDescription: true,
    defaultSelected: true,
    console: false,
});

const emit = defineEmits<{
    (e: "update:modelValue", value: { id?: string; name?: string }): void;
    // eslint-disable-next-line
    (e: "change", value: any): void;
}>();

const { t } = useI18n();

const loading = ref(false);
const isOpen = ref(false);
const search = ref("");
const selected = ref<CollectionResponse>();

// 分页查询文档
const { paging, getLists } = usePaging<CollectionResponse>({
    pageSize: 100,
    fetchFun: apiGetKnowledgeList,
    firstLoading: true,
});

const collections = computed(() => {
    return unref(paging.items)?.sort((a, b) => a.name.localeCompare(b.name)) ?? [];
});

onMounted(() =>
    getLists().then(() => {
        if (props.modelValue?.id) {
            const item = unref(collections).find((item) => item.id == props.modelValue?.id);
            if (item) {
                selected.value = item;
                emit("update:modelValue", { id: item?.id, name: item?.name });
                return;
            }
        }
        if (props.defaultSelected && unref(collections).length > 0) {
            const item = unref(collections)[0];
            selected.value = item;
            emit("update:modelValue", { id: item?.id, name: item?.name });
        }
    }),
);

const filteredCollections = computed(() => {
    const query = unref(search).trim().toLowerCase();
    return unref(collections).filter((k) => {
        if (query) return k.name.toLowerCase().includes(query);
        return true;
    });
});

function select(item?: CollectionResponse) {
    selected.value = item;
    emit("update:modelValue", { id: item?.id, name: item?.name });
    emit("change", item);
    isOpen.value = false;
    search.value = "";
}
</script>

<template>
    <UPopover v-model:open="isOpen">
        <UButton
            color="primary"
            variant="ghost"
            class="bg-secondary/5 flex items-center justify-between"
            :loading="loading"
            @click.stop
        >
            <span class="truncate">
                {{ selected?.name || "请选择知识库" }}
            </span>
            <div class="flex items-center gap-2">
                <UIcon
                    name="i-lucide-x"
                    v-if="selected?.name && props.console"
                    @click.stop="select(undefined)"
                />
                <UIcon name="i-lucide-chevron-down" :class="{ 'rotate-180': isOpen }" />
            </div>
        </UButton>
        <template #content>
            <div class="bg-background w-80 overflow-hidden rounded-lg shadow-lg">
                <div class="border-b p-3">
                    <UInput
                        leading-icon="i-lucide-search"
                        v-model="search"
                        placeholder="搜索知识库"
                        size="lg"
                        :ui="{ root: 'w-full' }"
                    />
                </div>
                <div
                    class="flex h-[calc((100vh-15rem)/3)] flex-col gap-3 p-2"
                    :class="{ 'md:grid-cols-2': filteredCollections.length > 1 }"
                >
                    <BdScrollArea class="h-full" type="hover" :shadow="false">
                        <div
                            v-if="loading"
                            class="text-muted-foreground col-span-full py-10 text-center"
                        >
                            {{ t("common.loading") }}...
                        </div>
                        <div
                            v-else-if="!filteredCollections.length"
                            class="text-muted-foreground col-span-full py-10 text-center"
                        >
                            {{ t("common.empty") }}
                        </div>
                        <ul class="space-y-1">
                            <li
                                v-for="item in filteredCollections"
                                :key="item.id"
                                class="group hover:bg-muted flex cursor-pointer items-center justify-between gap-2 rounded-md px-3 py-2 transition-colors"
                                :class="{ 'bg-secondary': selected?.id === item.id }"
                                @click="select(item)"
                            >
                                <div class="w-full space-y-0.5 overflow-hidden">
                                    <p
                                        class="text-secondary-foreground truncate text-sm font-medium"
                                    >
                                        {{ item.name }}
                                    </p>
                                    <p
                                        class="text-muted-foreground line-clamp-1 flex items-center space-x-2 text-xs"
                                    >
                                        <span class="rounded bg-blue-300 px-1 text-white">
                                            Owner: {{ item.ownerId?.toString().slice(0, 8) }}
                                        </span>
                                        <span
                                            class="flex-1"
                                            v-if="item.description && props.showDescription"
                                        >
                                            {{ item.description }}
                                        </span>
                                    </p>
                                </div>
                                <UIcon
                                    v-if="selected?.id === item.id"
                                    name="i-lucide-check-circle"
                                    class="text-primary flex-none"
                                    size="lg"
                                />
                            </li>
                        </ul>
                    </BdScrollArea>
                </div>
            </div>
        </template>
    </UPopover>
</template>

<style scoped lang="scss"></style>
