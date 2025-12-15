<script setup lang="ts">
import {
    apiDeleteKnowledge,
    apiGetKnowledgeList,
    type QueryKnowledgeParams,
} from "@buildingai/service/webapi/knowledge";
import { useDebounceFn } from "@vueuse/core";
import type { CollectionResponse } from "r2r-js";
import { reactive, ref } from "vue";

import KnowledgeCard from "./components/knowledge-card.vue";

// 路由实例
const router = useRouter();
const toast = useMessage();
const { t } = useI18n();

// 搜索和筛选参数
const searchForm: QueryKnowledgeParams = reactive<QueryKnowledgeParams>({
    page: 1,
    pageSize: 15,
});

// 状态管理
const loading = ref(false);
const hasMore = ref(false);
const list = ref<CollectionResponse[]>([]);

/**
 * 获取知识库体列表（客户端搜索/筛选时使用）
 */
const getLists = async () => {
    if (loading.value) return;

    loading.value = true;
    searchForm.page = 1;

    try {
        const res = await apiGetKnowledgeList(searchForm);
        list.value = res.results || [];
        hasMore.value = false;
    } catch (error) {
        console.error("获取数据失败:", error);
        hasMore.value = false;
    } finally {
        loading.value = false;
    }
};

/**
 * 加载更多数据
 */
const loadMore = async () => {
    if (loading.value || !hasMore.value) return;

    loading.value = true;
    searchForm.page = (searchForm.page ?? 0) + 1;

    try {
        const res = await apiGetKnowledgeList(searchForm);

        if (res.results && res.results.length > 0) {
            list.value.push(...res.results);
            searchForm.page = searchForm.page + 1;
            hasMore.value = false;
        } else {
            hasMore.value = false;
        }
    } catch (error) {
        searchForm.page--;
        console.error("加载更多数据失败:", error);
    } finally {
        loading.value = false;
    }
};

onMounted(getLists);

const handleSearch = useDebounceFn(getLists, 500);
watch(() => searchForm.keyword, handleSearch);

/** 删除数据 */
const handleDelete = async (data: CollectionResponse) => {
    try {
        await useModal({
            title: t("knowledge.delete.title"),
            description: t("knowledge.delete.desc"),
            color: "error",
        });

        await apiDeleteKnowledge(data.id);

        await getLists();

        toast.success(t("common.message.deleteSuccess"));
    } catch (error) {
        console.error("删除失败:", error);
    }
};

/** 知识库设置 */
const handleSettings = (data: CollectionResponse) => {
    const routePath = `/public/knowledge/${data.id}/settings`;
    if (data.id) router.push(routePath);
};

/**
 * 创建新知识库
 */
const handleCreate = () => {
    const routePath = "/public/knowledge/create";
    router.push(routePath);
};

definePageMeta({
    title: "知识库（晶奇）",
    auth: false,
    inSystem: true,
    inLinkSelector: true,
});
</script>

<template>
    <div
        class="dark:to-primary-950 flex h-full flex-col bg-linear-to-br from-blue-50 via-white to-purple-50 dark:from-neutral-900 dark:via-neutral-800"
    >
        <!-- 搜索区域 -->
        <div class="container mx-auto px-4 pt-4 pb-4">
            <div class="text-center">
                <h1 class="text-foreground mb-2 text-4xl font-bold">
                    {{ $t("knowledge.title") }}
                </h1>
                <p class="text-md text-accent-foreground mb-4">
                    {{ $t("knowledge.subtitle") }}
                </p>

                <!-- 搜索框 -->
                <div class="relative mx-auto w-full max-w-3xl">
                    <UInput
                        v-model="searchForm.keyword"
                        :placeholder="$t('knowledge.searchPlaceholder')"
                        size="xl"
                        class="w-full"
                        @input="handleSearch"
                    >
                        <template #leading>
                            <UIcon name="i-lucide-search" />
                        </template>
                    </UInput>
                </div>
            </div>
        </div>

        <div class="container mx-auto h-full min-h-0 rounded px-4">
            <section class="flex h-full min-h-0 flex-col">
                <BdScrollArea class="h-[calc(100vh-9rem)] min-h-0 w-full">
                    <BdInfiniteScroll
                        :loading="loading"
                        :has-more="hasMore"
                        :threshold="200"
                        :no-more-text="searchForm.page === 1 ? ' ' : ''"
                        @load-more="loadMore"
                    >
                        <div
                            class="grid grid-cols-1 gap-6 py-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                        >
                            <!-- 创建知识库卡片 -->
                            <AccessControl :codes="[]">
                                <div
                                    class="group border-default relative cursor-pointer rounded-lg border border-dashed p-4 transition-all duration-200 hover:shadow-lg"
                                    @click="handleCreate"
                                >
                                    <!-- 左上角图标和标题 -->
                                    <div
                                        class="group-hover:text-primary text-foreground mb-3 flex items-center gap-3"
                                    >
                                        <div
                                            class="border-default flex size-10 shrink-0 items-center justify-center rounded-lg border border-dashed"
                                        >
                                            <UIcon name="i-lucide-plus" class="h-6 w-6" />
                                        </div>

                                        <h3 class="truncate text-sm font-medium">
                                            {{ $t("knowledge.create.title") }}
                                        </h3>
                                    </div>

                                    <!-- 描述文字 -->
                                    <div class="text-muted-foreground mb-6 pr-8 text-xs">
                                        <p class="line-clamp-2 overflow-hidden">
                                            {{ $t("knowledge.create.desc") }}
                                        </p>
                                    </div>
                                </div>
                            </AccessControl>

                            <!-- 知识库卡片 -->
                            <knowledge-card
                                v-for="knowledge in list"
                                :key="knowledge.id"
                                :data="knowledge"
                                @delete="handleDelete"
                                @settings="handleSettings"
                            />
                        </div>
                    </BdInfiniteScroll>
                </BdScrollArea>
            </section>
        </div>
    </div>
</template>
