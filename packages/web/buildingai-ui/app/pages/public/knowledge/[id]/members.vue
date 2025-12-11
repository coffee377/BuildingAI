<script setup lang="ts">
import {
    apiAddKnowledgeUser,
    apiDeleteKnowledgeUser,
    apiLisAllUser,
    apiListKnowledgeUser,
} from "@buildingai/service/webapi/knowledge";
import type { User } from "r2r-js";

import Empty from "../components/Empty.vue";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const refresh = inject<() => Promise<void>>("knowledge");
const toast = useMessage();
const { t } = useI18n();

const kid = computed(() => (useRoute().params as Record<string, string>).id);
// 列表查询参数
const searchForm = reactive({
    knowledgeId: kid.value,
});

const userDrawerOpen = ref(false);
const user = ref<{ id?: string }>({});
const userSearch = ref<string>("");

interface KUser extends User {
    accountType: string;
}

const { paging, getLists } = usePaging<KUser>({
    fetchFun: apiListKnowledgeUser,
    params: searchForm,
    firstLoading: true,
});

const { paging: userPaging, getLists: getUserList } = usePaging<KUser>({
    fetchFun: apiLisAllUser,
    firstLoading: true,
});

const allUsers = computed(() =>
    userPaging.items.filter((user) => !user.collectionIds.includes(unref(kid) as string)),
);

const groups = computed(() => [
    {
        id: "users",
        label: userSearch.value ? `用户匹配中 “${userSearch.value}” ...` : "用户",
        items: unref(allUsers)
            .filter(
                ({ name, email }) =>
                    name?.includes(userSearch.value) || email?.includes(userSearch.value),
            )
            .map((user) => ({
                id: user.id,
                label: user.name ?? user.email,
                suffix: user.name ? user.email : undefined,
                avatar: {
                    src: `https://picsum.photos/seed/${user.email}/120/120`,
                },
            })),
        ignoreFilter: true,
    },
]);

const handleRemoveUser = async (id: string) => {
    await useModal({
        description: "确定需要移除用户吗",
        color: "error",
    });
    await apiDeleteKnowledgeUser(id, kid.value as string);
    toast.success(t("common.message.deleteSuccess"));
    // 刷新数据
    await getLists();
    await getUserList();
};

// 初始化
onMounted(() => {
    getLists();
    getUserList();
});

const resetUserDrawer = () => {
    userDrawerOpen.value = false;
    user.value = {};
    userSearch.value = "";
};

const handleOk = () => {
    const userId = unref(user)?.id as string;
    if (!userId) {
        toast.error("请选择用户");
    }
    apiAddKnowledgeUser(userId, unref(kid) as string).then(() => {
        resetUserDrawer();
        // 刷新数据
        getLists();
        getUserList();
    });
};

const handleClose = () => {
    resetUserDrawer();
};

definePageMeta({
    layout: "knowledge",
    auth: false,
    inSystem: true,
    inLinkSelector: true,
});
</script>

<template>
    <div class="container mx-auto max-w-6xl px-4 py-8">
        <!-- 页面标题与操作栏 -->
        <div
            class="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center"
        >
            <div>
                <h1 class="text-2xl font-bold text-gray-800">成员管理</h1>
                <p class="mt-1 text-gray-500">促协同维护，控内容质量，保障知识库高效运转</p>
            </div>
            <UDrawer
                v-model:open="userDrawerOpen"
                direction="right"
                :handle="false"
                :dismissible="true"
            >
                <UButton
                    label="添加成员"
                    color="primary"
                    variant="subtle"
                    trailing-icon="i-lucide-user-plus"
                />
                <template #header>
                    <div class="flex items-center">
                        <UButton
                            color="neutral"
                            variant="ghost"
                            icon="i-lucide-x"
                            @click="handleClose"
                        />
                        <h2 class="text-highlighted flex-1 pl-2 font-semibold">添加成员</h2>
                    </div>
                </template>
                <template #body>
                    <div
                        class="size-full min-w-96 rounded border border-dashed border-slate-300/60"
                    >
                        <UCommandPalette
                            v-model:search-term="userSearch"
                            v-model="user"
                            :loading="false"
                            :groups="groups"
                            placeholder="人员搜索..."
                            class="h-full"
                            selected-icon="i-lucide-circle-check"
                        >
                            <template #empty>
                                <Empty class="mt-16" />
                            </template>
                        </UCommandPalette>
                    </div>
                </template>
                <template #footer>
                    <div class="flex justify-end space-x-2">
                        <UButton
                            label="确认"
                            color="primary"
                            class="cursor-pointer justify-center"
                            @click="handleOk"
                        />
                        <UButton
                            label="取消"
                            color="neutral"
                            variant="outline"
                            class="cursor-pointer justify-center"
                            @click="handleClose"
                        />
                    </div>
                </template>
            </UDrawer>
        </div>

        <!-- 用户列表（卡片容器） -->
        <div
            id="user-list"
            :class="{
                'grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3': paging.items.length,
            }"
        >
            <div
                v-if="paging.items?.length"
                v-for="user in paging.items"
                :key="user.id"
                class="group relative rounded-lg bg-white px-4 py-6 shadow-md transition-shadow duration-300 hover:shadow-lg"
            >
                <div class="mb-4 flex items-center gap-2">
                    <!-- 添加默认头像，使用邮箱作为seed确保头像固定 -->
                    <img
                        :src="
                            user.profilePicture ?? `https://picsum.photos/seed/${user.email}/80/80`
                        "
                        :alt="`${user.email}的头像`"
                        class="h-14 w-14 rounded-full border-2 border-gray-100 object-cover shadow-sm"
                    />
                    <div class="flex-1">
                        <h3 class="text-lg font-semibold text-gray-800">{{ user.email }}</h3>
                        <div class="flex items-center">
                            <p class="flex-1 text-sm text-gray-500">
                                ID: {{ user.id.slice(0, 8) }}...{{ user.id.slice(-4) }}
                            </p>
                            <span
                                class="rounded px-2 py-1 text-xs font-medium"
                                :class="{
                                    'bg-blue-100 text-blue-800': user.isSuperuser,
                                    'bg-gray-100 text-gray-800': !user.isSuperuser,
                                }"
                            >
                                {{ user.isSuperuser ? "超级管理员" : "普通成员" }}
                            </span>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                    <div class="flex items-center">
                        <span class="text-gray-500">账号状态：</span>
                        <span
                            class="inline-flex items-center"
                            :class="{
                                'text-green-600': user.isActive,
                                'text-red-600': !user.isActive,
                            }"
                        >
                            <i class="fa fa-circle mr-1 text-xs"></i>
                            {{ user.isActive ? "已激活" : "未激活" }}
                        </span>
                    </div>
                    <div class="flex items-center">
                        <span class="text-gray-500">邮箱验证：</span>
                        <span
                            class="inline-flex items-center"
                            :class="{
                                'text-green-600': user.isActive,
                                'text-red-600': !user.isActive,
                            }"
                        >
                            <i class="fa fa-check mr-1"></i>
                            {{ user.isVerified ? "已验证" : "未验证" }}
                        </span>
                    </div>
                    <div class="flex items-center">
                        <span class="text-gray-500">登录方式：</span>
                        <span class="text-gray-800">
                            {{ user.accountType === "password" ? "密码登录" : user.accountType }}
                        </span>
                    </div>
                    <div class="col-span-full flex items-center">
                        <span class="text-gray-500">创建时间：</span>

                        <TimeDisplay
                            class="text-gray-800"
                            :datetime="user.createdAt"
                            mode="datetime"
                        />
                    </div>
                </div>

                <div
                    class="invisible absolute right-3 bottom-0 flex cursor-pointer items-center justify-end space-x-1 px-2 py-3 text-red-500 transition-colors duration-300 group-hover:visible hover:text-red-700"
                    @click="handleRemoveUser(user.id)"
                >
                    <UButton
                        icon="i-lucide-trash"
                        color="error"
                        variant="ghost"
                        class="cursor-pointer"
                        size="xl"
                    />
                </div>
            </div>
            <Empty v-else class="mt-24" />
        </div>
    </div>
</template>

<style scoped lang="scss"></style>
