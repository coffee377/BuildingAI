<script setup lang="ts">
import { useMessage } from "@fastbuildai/ui";
import { useI18n } from "vue-i18n";

import { STORAGE_KEYS } from "@/common/constants/storage.constant";
import type { QuickMenu } from "@/models";
import type { ChatConfig } from "@/models/ai-conversation.d.ts";
import {
    apiCreateAiConversation,
    apiGetChatConfig,
    apiGetQuickMenu,
} from "@/services/web/ai-conversation";

const { t } = useI18n();

// 从API获取对话配置
const { data: chatConfig } = await useAsyncData("chat-config", () => apiGetChatConfig());
const appStore = useAppStore();

// 建议选项启用状态 - 优先使用API配置，否则默认启用
const suggestionsEnabled = computed(
    () => (chatConfig.value as ChatConfig)?.suggestionsEnabled ?? true,
);

// 聊天建议选项 - 优先使用API配置，否则使用默认配置
const suggestions = computed(
    () =>
        (chatConfig.value as ChatConfig)?.suggestions || [
            { icon: "🎮", text: "写一个像宝可梦方式的小游戏" },
            { icon: "📅", text: "2025年节日安排出来了吗?" },
            { icon: "😊", text: "AI时代，什么能力不可被替代?" },
            { icon: "📝", text: "一篇生成爆款小红书笔记" },
            { icon: "🔍", text: "AI能成为全球人类产生威胁吗?" },
        ],
);

// 欢迎信息 - 优先使用API配置，否则使用默认配置
const welcomeInfo = computed(
    () =>
        (chatConfig.value as ChatConfig)?.welcomeInfo || {
            title: "👋 Hi，我是你的智能助手",
            description: "作为你的智能伙伴，我能帮你写文案、思考问题、文档整理和删减、答疑解惑。",
            footer: "内容由AI生成，无法确保真实准确，仅供参考。",
        },
);

const controlsStore = useControlsStore();
const selectedModelId = ref<string | undefined>(undefined);
const inputValue = ref<string>("");
const selectedMcpIdList = ref<string[] | undefined>([]);
const isQuickMenu = ref(false);
const quickMenu = ref<QuickMenu>();

/**
 * 快捷菜单使用的 MCP ID
 */
const QUICK_MENU_MCP_ID = ref<string | undefined>(undefined);

/**
 * 从 localStorage 读取 MCP 选择列表
 * @returns {string[]} MCP ID 数组（若无或格式异常则返回空数组）
 */
function readMcpIdsFromStorage(): string[] {
    try {
        const raw = JSON.parse(localStorage.getItem("mcpIds") || "[]");
        return Array.isArray(raw) ? raw : [];
    } catch {
        return [];
    }
}

/**
 * 将 MCP 选择列表写入 localStorage
 * @param {string[]} ids MCP ID 数组
 */
function writeMcpIdsToStorage(ids: string[]): void {
    if (ids.length) {
        localStorage.setItem("mcpIds", JSON.stringify(ids));
    } else {
        localStorage.removeItem("mcpIds");
    }
}

const getQuickMenu = async () => {
    const res = await apiGetQuickMenu();
    if (!res) return;
    quickMenu.value = res;
    QUICK_MENU_MCP_ID.value = res?.id;
    // 初始化按钮激活态（不改写 localStorage，仅读取）
    isQuickMenu.value = readMcpIdsFromStorage().includes(QUICK_MENU_MCP_ID.value!);
};

async function createChat(prompt: string, metadata?: Record<string, any>) {
    try {
        if (!selectedModelId.value && useUserStore().isLogin)
            return useMessage().warning(t("common.chat.selectModel"));

        const chat = await apiCreateAiConversation({
            title: "",
            metadata,
        });

        useCookie(STORAGE_KEYS.AI_CONVERSATION_TITLE).value = JSON.stringify({
            modelId: selectedModelId.value,
            title: prompt,
            id: chat.id,
        });

        !!metadata && useLocalStorage(chat.id, metadata);

        refreshNuxtData("chats");
        navigateTo({
            path: `/chat/${chat.id}`,
        });
    } catch (error) {
        console.error("创建对话失败:", error);
    }
}

/**
 * 点击“快捷菜单”按钮时，将指定 MCP ID 写入/移除本地存储的 mcpIds 数组
 * 同步 selectedMcpIdList 与按钮激活态，不影响现有功能
 */
const handleQuickMenu = () => {
    // 若 ID 尚未加载，直接返回，避免写入错误数据
    if (!QUICK_MENU_MCP_ID.value) return;

    // 确保响应式列表存在
    if (!Array.isArray(selectedMcpIdList.value)) selectedMcpIdList.value = [];

    const stored = readMcpIdsFromStorage();
    const hasInStore = stored.includes(QUICK_MENU_MCP_ID.value!);
    const hasInState = selectedMcpIdList.value.includes(QUICK_MENU_MCP_ID.value!);

    if (!hasInStore && !hasInState) {
        // 添加到本地与内存（去重）
        stored.push(QUICK_MENU_MCP_ID.value!);
        if (!hasInState) selectedMcpIdList.value.push(QUICK_MENU_MCP_ID.value!);
        writeMcpIdsToStorage(stored);
    } else {
        // 从本地与内存移除该 ID，但不影响其它已选 MCP
        const nextStore = stored.filter((id) => id !== QUICK_MENU_MCP_ID.value!);
        const nextState = selectedMcpIdList.value.filter((id) => id !== QUICK_MENU_MCP_ID.value!);
        writeMcpIdsToStorage(nextStore);
        selectedMcpIdList.value = nextState;
    }

    // 根据最新存储结果设置按钮态
    isQuickMenu.value = readMcpIdsFromStorage().includes(QUICK_MENU_MCP_ID.value!);
};

onMounted(() => {
    getQuickMenu();
});

definePageMeta({
    layout: "default",
    name: "menu.home",
    auth: false,
    inSystem: true,
    inLinkSelector: true,
});
</script>

<template>
    <!-- 不同 layout 风格展示不同的样式 -->
    <div
        class="ai-chat bg-muted dark:bg-muted/50 flex h-full min-h-0 items-center justify-center p-2 pl-0"
        :class="{
            'border-l': !controlsStore.chatSidebarVisible,
            '!bg-background !border-none !p-0':
                controlsStore.layoutStyle === 'layout-3' ||
                controlsStore.layoutStyle === 'layout-2' ||
                controlsStore.layoutStyle === 'layout-1',
        }"
    >
        <div
            class="h-full flex-none"
            :class="{
                'border-muted border-r':
                    (controlsStore.layoutStyle === 'layout-3' ||
                        controlsStore.layoutStyle === 'layout-2' ||
                        controlsStore.layoutStyle === 'layout-1') &&
                    !controlsStore.chatSidebarVisible,
            }"
        >
            <ChatsList />
        </div>

        <div
            class="bg-background flex h-full min-h-0 flex-1 flex-col items-center justify-center rounded-lg"
        >
            <!-- 主内容区 -->
            <div class="flex h-full w-full max-w-[800px] flex-col items-center justify-center">
                <!-- 欢迎标题 -->
                <div class="mb-8 text-center">
                    <h1 class="mb-2 flex items-center justify-center text-2xl font-bold">
                        {{ welcomeInfo.title }}
                    </h1>
                    <p class="text-accent-foreground text-sm">
                        {{ welcomeInfo.description }}
                    </p>
                </div>

                <!-- 输入框 -->
                <div class="w-full">
                    <ChatPrompt
                        class="[view-transition-name:chat-prompt]"
                        v-model="inputValue"
                        :rows="2"
                        @submit="createChat"
                    >
                        <template #panel-left>
                            <ModelSelect
                                v-model="selectedModelId"
                                :supportedModelTypes="['llm']"
                                placeholder="选择AI模型开始对话"
                            />
                            <McpSelect
                                v-model="selectedMcpIdList"
                                :mcpIds="selectedMcpIdList || []"
                                placeholder="选择MCP..."
                            />
                            <UButton
                                v-if="quickMenu"
                                :color="isQuickMenu ? 'primary' : 'neutral'"
                                variant="ghost"
                                :icon="quickMenu?.icon ? '' : 'tabler:tool'"
                                :ui="{ leadingIcon: 'size-4' }"
                                :class="{ 'bg-primary/10': isQuickMenu }"
                                @click="handleQuickMenu"
                            >
                                <UAvatar
                                    v-if="quickMenu?.icon"
                                    :src="quickMenu?.icon!"
                                    :ui="{ root: 'size-4 rounded-md' }"
                                />
                                {{ quickMenu?.alias || quickMenu?.name }}
                            </UButton>
                        </template>
                    </ChatPrompt>
                </div>

                <!-- 建议选项 -->
                <div
                    class="my-4 flex w-full flex-wrap justify-start gap-3"
                    v-if="suggestionsEnabled"
                >
                    <UButton
                        v-for="(suggestion, index) in suggestions"
                        :key="index"
                        variant="outline"
                        color="neutral"
                        size="md"
                        class="text-left"
                        @click="createChat(suggestion.text)"
                    >
                        <span class="mr-1">{{ suggestion.icon }}</span>
                        {{ suggestion.text }}
                    </UButton>
                </div>
            </div>

            <!-- 页脚 -->
            <div class="w-full p-2 text-center text-xs text-gray-400">
                <div class="flex flex-col items-center justify-center gap-1">
                    <span>{{ welcomeInfo.footer }}</span>
                    <div class="flex items-center justify-center gap-2">
                        <a
                            :href="appStore.siteConfig?.copyright.url"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="hover:text-primary flex items-center justify-center gap-1 transition-colors"
                        >
                            <UAvatar
                                v-if="appStore.siteConfig?.copyright.iconUrl"
                                :src="appStore.siteConfig?.copyright.iconUrl"
                                :ui="{ root: 'size-4 rounded-md' }"
                            />
                            <span>{{ appStore.siteConfig?.copyright.displayName }}</span>
                        </a>
                        <span
                            v-if="
                                appStore.siteConfig?.copyright.displayName ||
                                appStore.siteConfig?.copyright.iconUrl
                            "
                            >|</span
                        >
                        <span class="space-x-1">
                            <span>Powered by</span>
                            <a
                                class="text-primary font-bold"
                                href="https://www.fastbuildai.com"
                                target="_blank"
                            >
                                FastbuildAI
                            </a>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped></style>
