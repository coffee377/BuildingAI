<script lang="ts" setup>
import type { DropdownMenuItem } from "@nuxt/ui";
import type { CollectionResponse } from "r2r-js";
import { useRouter } from "vue-router";

interface Props {
    data: CollectionResponse;
}

interface Emits {
    (e: "delete", data: CollectionResponse): void;
    (e: "settings", data: CollectionResponse): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const router = useRouter();
const { t } = useI18n();

// 获取图聚类状态标签
const graphClusterStatusColor = computed(() => {
    const { graphClusterStatus } = props.data ?? {};
    switch (graphClusterStatus) {
        case "pending":
            return "primary";
        case "success":
            return "success";
        case "info":
            return "info";
        case "warning":
            return "warning";
        case "error":
            return "error";
        default:
            return "info";
    }
});

// 查看详情
const handleViewDetail = () => {
    if (props.data?.id) {
        const routePath = `/public/knowledge/${props.data.id}/documents`;
        router.push(routePath);
    }
};

// 下拉菜单选项
const menuItems: DropdownMenuItem[] = [
    {
        label: t("console-common.delete"),
        color: "error",
        icon: "i-lucide-trash",
        onSelect: () => emit("delete", props.data),
    },
].filter(Boolean) as DropdownMenuItem[];
</script>

<template>
    <div
        class="group border-default relative cursor-pointer rounded-lg border p-4 transition-all duration-200 hover:shadow-lg"
        @click="handleViewDetail"
    >
        <!-- 左上角图标和标题 -->
        <div class="mb-3 flex items-start gap-3">
            <div
                class="border-default bg-primary-50 flex size-10 shrink-0 items-center justify-center rounded-lg border"
            >
                <UIcon name="i-lucide-folder" class="text-primary-500 h-6 w-6" />
            </div>
            <div class="flex min-w-0 flex-1 flex-col">
                <h3 class="text-foreground truncate text-sm font-medium">
                    {{ data.name }}
                </h3>

                <!-- 统计信息 -->
                <div class="text-muted-foreground mt-1 text-xs">
                    {{ data.documentCount }} {{ t("knowledge.card.documents") }} ·
                    {{ data.userCount }} {{ t("knowledge.card.members") }}
                </div>
            </div>
        </div>

        <!-- 描述文字 -->
        <div class="text-muted-foreground mb-4 h-10 pr-8 text-xs">
            <p v-if="data.description" class="line-clamp-2 overflow-hidden">
                {{ data.description }}
            </p>
            <p v-else class="line-clamp-2 space-x-2 overflow-hidden">
                <span>当您想要回答有关</span>
                <span>{{ data.name }}</span>
                <span>的问题时非常有用</span>
            </p>
        </div>

        <!-- 状态标签 -->
        <div class="text-muted-foreground mt-1 flex gap-6 text-xs">
            <UTooltip :text="t('knowledge.graph.cluster.statusTip')" :delay-duration="0">
                <div class="flex items-center">
                    <UChip :color="graphClusterStatusColor" size="sm" />
                    <span class="ml-3 text-xs">
                        {{ t("knowledge.graph.cluster.status") }}：
                        {{ data.graphClusterStatus }}
                    </span>
                </div>
            </UTooltip>

            <UTooltip :text="t('knowledge.graph.sync.statusTip')" :delay-duration="0">
                <div class="flex items-center">
                    <UChip :color="graphClusterStatusColor" size="sm" />
                    <span class="ml-3 text-xs">
                        {{ t("knowledge.graph.sync.status") }}：
                        {{ data.graphSyncStatus }}
                    </span>
                </div>
            </UTooltip>
        </div>

        <!--  右下角下拉菜单 -->
        <div
            class="absolute right-3 bottom-3 z-10 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
            @click.stop
        >
            <UDropdownMenu :items="menuItems" :popper="{ placement: 'bottom-end' }">
                <UButton
                    icon="i-heroicons-ellipsis-vertical"
                    size="xs"
                    color="neutral"
                    variant="ghost"
                    class="opacity-70 hover:opacity-100"
                    @click.stop
                />
            </UDropdownMenu>
        </div>
    </div>
</template>
