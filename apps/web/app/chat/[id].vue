<script setup lang="ts">
import { ProChatScroll, ProMarkdown, ProScrollArea, useMessage } from "@fastbuildai/ui";
import { nextTick, onMounted, onUnmounted, watch } from "vue";

import type { MetaConfiguration } from "@/common/components/chat-prompt.vue";
import { useChat } from "@/common/composables/useChat";
import { STORAGE_KEYS } from "@/common/constants";
import type { QuickMenu } from "@/models";
import type { AiMessage, AiModel, ChatConfig } from "@/models/ai-conversation";
import {
    apiChatStream,
    apiGetAiConversation,
    apiGetAiConversationDetail,
    apiGetChatConfig,
    apiGetQuickMenu,
    apiUpdateAiConversation,
} from "@/services/web/ai-conversation";

const { params: URLQueryParams } = useRoute();
const { t } = useI18n();
const toast = useMessage();
const controlsStore = useControlsStore();
const scrollAreaRef = useTemplateRef<InstanceType<typeof ProScrollArea>>("scrollAreaRef");
const { height: scrollAreaHeight } = useElementSize(scrollAreaRef);

const currentConversationId = computed(() => (URLQueryParams as Record<string, string>).id);

const queryPaging = reactive({ page: 1, pageSize: 5 });
const hasMore = ref(false);
const selectedModel = ref<AiModel>({} as AiModel);
const cookieCache = useCookie<any>(STORAGE_KEYS.AI_CONVERSATION_TITLE);
const selectedMcpIdList = ref<string[] | undefined>([]);
const isQuickMenu = ref(false);
const quickMenu = ref<QuickMenu>();

// 提取链接 query
const modelId = ref("");
const meta = ref<MetaConfiguration>({});

const { data: messagesData, pending: loading } = await useAsyncData(
    `chat-messages-${currentConversationId.value}`,
    () => apiGetAiConversation(currentConversationId.value as string, queryPaging),
    {
        transform: (data) => {
            data.items = data.items.reverse();
            return data;
        },
    },
);

if (!messagesData.value?.items) {
    throw createError({ statusCode: 404, statusMessage: "Chat not found", fatal: true });
}

hasMore.value = messagesData.value.total > messagesData.value.items.length;

const { data: currentConversation } = await useAsyncData(
    `chat-detail-${currentConversationId.value}`,
    () => apiGetAiConversationDetail(currentConversationId.value as string),
);

watch(
    currentConversation,
    (val: Record<string, any> = {}) => {
        // const { metadata } = val;
        // meta.value = metadata ?? {};
        meta.value = { memory: true };
    },
    { deep: true, immediate: true },
);

const { data: chatConfig } = await useAsyncData("chat-config", () => apiGetChatConfig());

const initialMessages = messagesData.value.items.map((item: AiMessage) => {
    return {
        id: item.id || uuid(),
        role: item.role,
        metadata: item.metadata,
        content: item.errorMessage || item.content,
        status: item.errorMessage ? ("failed" as const) : ("completed" as const),
        mcpToolCalls: item.mcpToolCalls,
    };
});

const { messages, input, handleSubmit, reload, stop, status, error } = useChat({
    id: currentConversationId.value,
    api: apiChatStream,
    initialMessages: initialMessages,
    body: {
        get modelId() {
            return selectedModel.value?.id;
        },
        get mcpServers() {
            const userStore = useUserStore();
            return JSON.parse(localStorage.getItem("mcpIds") || "[]");
        },
        saveConversation: true,
        get conversationId() {
            return currentConversationId.value;
        },
        // options: { temperature: 0.7 },
        metadata: unref(meta),
    },
    onToolCall(message) {
        scrollToBottom();
    },
    onResponse(response) {
        if (response.status === 401) {
            const userStore = useUserStore();
            userStore.logout(true);
        }
    },
    onError(err) {
        const message = err?.message || "发送失败";
        console.error("聊天错误:", message);
    },
    onFinish(message) {
        refreshNuxtData("chats");
        refreshNuxtData(`chat-detail-${currentConversationId.value}`);
    },
} as UseChatOptions);

const isLoading = computed(() => status.value === "loading");

// 自动滚动状态
const isAtBottom = ref(true);

/**
 * 监听滚动事件，实时更新是否处于底部
 */
function handleScroll(event: Event) {
    const target = event.target as HTMLElement;
    const threshold = 40; // 阈值，单位：px
    isAtBottom.value = target.scrollHeight - (target.scrollTop + target.clientHeight) <= threshold;
}

async function loadMoreMessages() {
    if (!hasMore.value) return;
    queryPaging.page++;
    try {
        const data = await apiGetAiConversation(currentConversationId.value as string, queryPaging);
        const newMessages = data.items.reverse().map(
            (item: AiMessage): AiMessage => ({
                id: item.id || uuid(),
                role: item.role,
                content: item.errorMessage || item.content,
                status: item.errorMessage ? ("failed" as const) : ("completed" as const),
                mcpToolCalls: item.mcpToolCalls,
            }),
        );
        messages.value.unshift(...newMessages);
        hasMore.value = data.total > messages.value.length;
    } catch (err) {
        queryPaging.page--;
        console.error(err);
        hasMore.value = true;
    }
}

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
    console.log("mcpIds:", readMcpIdsFromStorage(), "selected:", selectedMcpIdList.value);
};

const getQuickMenu = async () => {
    const res = await apiGetQuickMenu();
    if (!res) return;
    quickMenu.value = res;
    QUICK_MENU_MCP_ID.value = res.id;
    // 初始化按钮激活态（不改写 localStorage，仅读取）
    isQuickMenu.value = readMcpIdsFromStorage().includes(QUICK_MENU_MCP_ID.value!);
};

async function scrollToBottom(animate = true) {
    await nextTick();
    scrollAreaRef.value?.scrollToBottom(animate);
}

async function saveEditedName(event: Event): Promise<void> {
    await apiUpdateAiConversation(currentConversationId.value as string, {
        title: (event.target as HTMLInputElement).value,
    });
    refreshNuxtData("chats");
}

async function handleSubmitMessage(content: string) {
    if (!content.trim() || isLoading.value) return;
    if (!selectedModel.value.id) return toast.warning(t("common.chat.selectModel"));
    await handleSubmit(content);
    scrollToBottom();
}

// 当最后一条消息的内容变化，并且滚动条在底部时，保持自动滚动
watch(
    () => messages.value.at(-1)?.content,
    () =>
        nextTick(() => {
            if (isAtBottom.value) {
                scrollToBottom(false);
            }
        }),
    { flush: "post" },
);

let mutationObserver: MutationObserver | null = null;

onMounted(async () => {
    // 页面首次渲染后滚动到底部
    scrollToBottom(false);

    modelId.value = localStorage.getItem("modelId") || "";

    const viewportComp = scrollAreaRef.value?.getViewportElement();
    const viewportEl = (viewportComp && (viewportComp as any).viewportElement) as
        | HTMLElement
        | undefined;

    viewportEl?.addEventListener("scroll", handleScroll, { passive: true });
    // 初始判断是否在底部
    if (viewportEl) {
        handleScroll({ target: viewportEl } as unknown as Event);

        // 监听内容变更（代码高亮、mermaid 渲染等异步操作可能改变高度）
        mutationObserver = new MutationObserver(() => {
            // 只有滚动条在底部时才自动跟随
            if (isAtBottom.value) {
                scrollToBottom(false);
            }
        });
        mutationObserver.observe(viewportEl, {
            childList: true,
            subtree: true,
            characterData: true,
        });
    }

    if (messages.value.length === 0 && cookieCache.value?.id === currentConversationId.value) {
        selectedModel.value.id = cookieCache.value.modelId;
        await handleSubmitMessage(cookieCache.value.title);
    }
    cookieCache.value = null;
});

onMounted(() => {
    getQuickMenu();
});

onUnmounted(() => {
    const viewportComp = scrollAreaRef.value?.getViewportElement();
    const viewportEl = (viewportComp && (viewportComp as any).viewportElement) as
        | HTMLElement
        | undefined;
    viewportEl?.removeEventListener("scroll", handleScroll);
    mutationObserver?.disconnect();
});

definePageMeta({ activePath: "/" });
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
            class="bg-background flex h-full w-full flex-col items-center justify-center rounded-lg px-4 xl:px-0"
        >
            <div class="flex w-full items-center justify-center py-2">
                <UInput
                    :model-value="
                        isLoading ? t('common.chat.messages.typing') : currentConversation?.title
                    "
                    size="sm"
                    variant="ghost"
                    :ui="{ base: 'text-center text-lg' }"
                    @change="saveEditedName($event)"
                />
            </div>

            <ProScrollArea
                class="revert-layer h-full min-h-0 w-full"
                type="auto"
                ref="scrollAreaRef"
                @in-view="scrollToBottom(false)"
            >
                <ProChatScroll
                    :loading="loading"
                    :has-more="hasMore"
                    :threshold="500"
                    content-class="max-w-[800px] w-full space-y-3 py-6"
                    @load-more="loadMoreMessages"
                >
                    <ChatMessages
                        :messages="messages as AiMessage[]"
                        :scroll-area-height="scrollAreaHeight"
                        :error="error as unknown as Error"
                        :assistant="{
                            actions: [
                                {
                                    label: t('common.chat.messages.retry'),
                                    icon: 'i-lucide-rotate-cw-square',
                                    onClick: () => reload(),
                                },
                            ],
                        }"
                        :spacing-offset="160"
                    >
                        <template #content="{ message }">
                            <ProMarkdown :content="message.content" />
                        </template>
                    </ChatMessages>
                </ProChatScroll>
            </ProScrollArea>

            <div class="w-full max-w-[800px]">
                <div>{{ currentConversation["metadata"] }}</div>
                <ChatPrompt
                    v-model="input"
                    :meta-configuration="meta"
                    :is-loading="isLoading"
                    class="sticky bottom-0 z-10 [view-transition-name:chat-prompt]"
                    @stop="stop"
                    @submit="handleSubmitMessage"
                >
                    <template #panel-left>
                        <ModelSelect
                            :supportedModelTypes="['llm']"
                            placeholder="选择AI模型开始对话"
                            @change="(e) => (selectedModel = e)"
                        />
                        <McpSelect
                            v-model="selectedMcpIdList"
                            :mcpIds="selectedMcpIdList || []"
                            capability="chat"
                            placeholder="选择MCP..."
                        />

                        <UButton
                            v-if="quickMenu"
                            color="primary"
                            variant="ghost"
                            :icon="quickMenu?.icon ? '' : 'tabler:tool'"
                            :ui="{ leadingIcon: 'size-4' }"
                            :class="{ 'bg-primary/15': isQuickMenu }"
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

            <div class="text-muted-forgeround w-full p-2 text-center text-xs">
                {{ (chatConfig as ChatConfig)?.welcomeInfo?.footer }}
            </div>
        </div>
    </div>
</template>
