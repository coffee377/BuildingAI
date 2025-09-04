<script lang="ts" setup>
import { apiGetKnowledgeDetail } from "@/services/web/knowledge";

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const { hasAccessByCodes } = useAccessControl();
const knowledgeId = computed(() => (route.params as Record<string, string>).id);
const collapsed = ref<boolean>(false);

const { data, pending } = await useAsyncData(`dataset-detail-${knowledgeId.value}`, () =>
    apiGetKnowledgeDetail(knowledgeId.value),
);

function convertUtcToBeijingTime(utcTimeStr: string) {
    // 1. 解析UTC时间字符串为Date对象
    const utcDate = new Date(utcTimeStr);

    // 2. 计算东八区时间戳（UTC+8 = UTC时间 + 8小时毫秒数）
    const beijingTimestamp = utcDate.getTime() + 8 * 60 * 60 * 1000;
    const beijingDate = new Date(beijingTimestamp);

    // 3. 提取年月日时分秒（注意月份从0开始，需+1）
    const year = beijingDate.getFullYear();
    const month = String(beijingDate.getMonth() + 1).padStart(2, "0"); // 补0为两位数
    const day = String(beijingDate.getDate()).padStart(2, "0");
    const hours = String(beijingDate.getHours()).padStart(2, "0");
    const minutes = String(beijingDate.getMinutes()).padStart(2, "0");
    const seconds = String(beijingDate.getSeconds()).padStart(2, "0");

    // 4. 拼接为目标格式
    return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
}
</script>

<template>
    <div class="flex h-full min-h-0 w-full" v-if="!!data">
        <div
            class="bg-muted flex h-full w-60 flex-none flex-col rounded-xl px-1 py-4"
            :class="{ '!w-16': collapsed }"
        >
            <div class="flex flex-col space-y-3 px-3">
                <div
                    class="flex items-center justify-between gap-2"
                    :class="{ '!flex-col': collapsed }"
                >
                    <UButton
                        variant="soft"
                        color="neutral"
                        size="lg"
                        leading-icon="i-lucide-arrow-left"
                        @click="router.replace('/public/knowledge')"
                    />

                    <div class="bg-primary-50 border-default flex rounded-lg border p-2">
                        <UIcon name="i-lucide-folder" class="text-primary size-5" />
                    </div>
                </div>

                <template v-if="!collapsed">
                    <UTooltip :text="data.name" :delay-duration="0">
                        <div class="text-foreground line-clamp-2 text-sm font-medium">
                            {{ data?.name }}
                        </div>
                    </UTooltip>

                    <div class="text-muted-foreground text-xs" v-if="!collapsed">
                        {{ data?.description }}
                    </div>

                    <div class="text-muted-foreground flex flex-col space-y-3 text-xs">
                        <div class="flex items-center justify-between font-medium">
                            <span> {{ t("knowledge.details.documentCount") }}：</span>
                            <span>{{ data.documentCount }}</span>
                        </div>
                        <div class="flex items-center justify-between font-medium">
                            <span>{{ t("knowledge.details.userCount") }}：</span>
                            <span>{{ data.userCount }}</span>
                        </div>
                        <div class="flex items-center justify-between font-medium">
                            <span>{{ t("knowledge.details.graphClusterStatus") }}：</span>
                            <span>{{ data.graphClusterStatus }}</span>
                        </div>
                        <div class="flex items-center justify-between font-medium">
                            <span>{{ t("knowledge.details.graphSyncStatus") }}：</span>
                            <span>{{ data.graphSyncStatus }}</span>
                        </div>
                        <div class="flex items-center justify-between font-medium">
                            <span>{{ t("knowledge.details.createdAt") }}：</span>
                            <span>{{ convertUtcToBeijingTime(data.createdAt) }}</span>
                        </div>
                        <div class="flex items-center justify-between font-medium">
                            <span>{{ $t("knowledge.details.updatedAt") }}：</span>
                            <span>{{ convertUtcToBeijingTime(data.updatedAt) }}</span>
                        </div>
                    </div>
                </template>
            </div>
            <USeparator class="my-3 flex" />
            <div class="flex h-full w-full flex-col justify-between">
                <UNavigationMenu
                    orientation="vertical"
                    :collapsed="collapsed"
                    :items="
                        [
                            hasAccessByCodes(['ai-datasets-documents:list'])
                                ? {
                                      label: $t('knowledge.menu.documents'),
                                      icon: 'i-lucide-files',
                                      to: `/public/knowledge/${knowledgeId}/documents`,
                                      active: [
                                          `/public/knowledge/${knowledgeId}`,
                                          `/public/knowledge/${knowledgeId}/documents`,
                                      ].includes(route.path),
                                  }
                                : null,
                            hasAccessByCodes(['ai-datasets-team-members:list'])
                                ? {
                                      label: $t('knowledge.menu.members'),
                                      icon: 'i-lucide-users',
                                      to: `/public/knowledge/${knowledgeId}/members`,
                                  }
                                : null,
                            // {
                            //     label: $t('knowledge.menu.entities'),
                            //     icon: 'i-lucide-settings-2',
                            //     to: `/public/knowledge/${knowledgeId}/entities`,
                            // },
                            // {
                            //     label: $t('knowledge.menu.relationships'),
                            //     icon: 'i-lucide-settings-2',
                            //     to: `/public/knowledge/${knowledgeId}/relationships`,
                            // },
                            // {
                            //     label: $t('knowledge.menu.communities'),
                            //     icon: 'i-lucide-settings-2',
                            //     to: `/public/knowledge/${knowledgeId}/communities`,
                            // },
                            // {
                            //     label: $t('knowledge.menu.explore'),
                            //     icon: 'i-lucide-settings-2',
                            //     to: `/public/knowledge/${knowledgeId}/explore`,
                            // },
                            hasAccessByCodes(['ai-datasets:update'])
                                ? {
                                      label: $t('knowledge.menu.settings'),
                                      icon: 'i-lucide-settings-2',
                                      to: `/public/knowledge/${knowledgeId}/settings`,
                                  }
                                : null,
                        ].filter(Boolean) as NavigationMenuItem[]
                    "
                    class="data-[orientation=vertical]:w-full"
                    :ui="{
                        list: 'space-y-1',
                        link: collapsed ? 'p-2.5 flex justify-center' : 'p-2 pl-3',
                        linkLeadingIcon: collapsed ? 'size-6' : 'size-4',
                    }"
                />

                <div
                    class="mt-auto flex items-center justify-center"
                    :class="{ '!justify-between': !collapsed }"
                >
                    <UButton
                        data-sidebar="trigger"
                        variant="ghost"
                        color="neutral"
                        size="xs"
                        :ui="{ base: 'py-2' }"
                        @click="collapsed = !collapsed"
                    >
                        <template v-if="!collapsed">
                            <UIcon name="i-lucide-panel-right" class="size-5" />
                        </template>
                        <template v-else>
                            <UIcon name="i-lucide-panel-left" class="size-5" />
                        </template>
                        <span class="sr-only">侧边栏切换</span>
                    </UButton>
                </div>
            </div>
        </div>
        <USeparator orientation="vertical" />
        <!-- 内容区域 -->
        <div class="w-full p-4">
            <slot v-bind="data" />
        </div>
    </div>
    <div v-else class="flex h-[calc(100vh-6rem)] items-center justify-center text-center">
        <div class="max-w-md">
            <h1 class="text-error mb-4 text-6xl font-extrabold">403</h1>
            <p class="mb-2 text-xl font-semibold text-gray-800">
                {{ $t("console-ai-datasets.permission.title") }}
            </p>
            <p class="text-muted-foreground mb-6">
                {{ $t("console-ai-datasets.permission.description") }}
            </p>

            <UButton to="/" color="primary" size="lg" icon="i-heroicons-arrow-left">
                {{ $t("console-ai-datasets.permission.back") }}
            </UButton>
        </div>
    </div>
</template>
