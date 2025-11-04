<script lang="ts" setup>
import { useFocus } from "@vueuse/core";

import { useUserStore } from "@/common/stores/user";

interface TextareaInstance {
    textareaRef: HTMLTextAreaElement | null;
}

const emits = defineEmits<{
    (e: "update:modelValue", v: string): void;
    (e: "update:metaConfiguration", v: MetaConfiguration): void;
    (e: "submit", v: string, meta?: Record<string, any>): void;
    (e: "stop"): void;
}>();

const { t } = useI18n();
const userStore = useUserStore();

export interface MetaConfiguration {
    /**
     * 是否启用会话记忆
     */
    memory?: boolean;
    /**
     * 是否启用问题重写
     */
    rewrite?: boolean;
    /**
     * 知识库
     */
    kb?: { id: string; name: string };
    /**
     * 添加的文件
     */
    files?: File[];
}

interface ChatPromptProps {
    modelValue: string;
    metaConfiguration?: MetaConfiguration;
    placeholder?: string;
    isLoading?: boolean;
    rows?: number;
    debug?: boolean;
}

const props = withDefaults(defineProps<ChatPromptProps>(), {
    modelValue: "",
    metaConfiguration: () => ({ memory: true }),
    placeholder: "",
    isLoading: false,
    rows: 1,
    debug: false,
});

const uTextareaRefs = useTemplateRef<TextareaInstance | null>("uTextareaRefs");
const textareaElement = computed(() => uTextareaRefs.value?.textareaRef || null);
const inputValue = useVModel(props, "modelValue", emits);
const meta = useVModel(props, "metaConfiguration", emits);

const { focused: isFocused } = useFocus(textareaElement, { initialValue: false });

// 点击其他地方也聚焦输入框
function handleFocus() {
    uTextareaRefs.value?.textareaRef?.focus();
    if (!userStore.isAgreed) {
        navigateTo("/login");
    }
}

// 处理回车事件
function handleKeydown(event: KeyboardEvent) {
    // 检查是否在中文输入法组合状态（拼音输入状态）
    if (event.isComposing) {
        return;
    }

    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault(); // 阻止默认的换行行为

        if (props.isLoading) {
            // 如果正在加载，按回车停止
            emits("stop");
        } else {
            // 如果不在加载，按回车发送
            emits("submit", inputValue.value, unref(meta));
        }
    }
}

// 处理点击发送/停止按钮事件
function handleSubmit() {
    if (props.isLoading) {
        emits("stop");
    } else {
        if (!inputValue.value.trim() && !props.isLoading) return;
        emits("submit", inputValue.value, unref(meta));
    }
}

onMounted(() =>
    nextTick(() => {
        if (userStore.isAgreed) {
            handleFocus();
        }
    }),
);
</script>

<template>
    <div
        class="chat-action-bar bg-muted flex w-full rounded-md border p-2 transition-[border-color_box-shadow] duration-200 sm:block sm:rounded-2xl"
        :class="isFocused ? 'ring-primary/15 border-primary ring-3' : 'border-border'"
        @click.stop="handleFocus"
    >
        <div v-if="debug" class="border border-dashed border-red-500">{{ meta }}</div>
        <div class="flex items-center gap-2">
            <slot name="panel-top"> </slot>
        </div>
        <!-- 输入模块Input -->
        <UTextarea
            ref="uTextareaRefs"
            v-model="inputValue"
            class="custom-textarea-wrapper w-full"
            style="--ui-bg-elevated: var(--color-background)"
            variant="ghost"
            :rows="rows"
            :maxrows="8"
            :highlight="false"
            :autoresize="true"
            :ui="{
                base: 'resize-none custom-textarea text-base min-h-[40px] hover:bg-muted focus:bg-muted',
            }"
            :placeholder="placeholder || t('common.chat.messages.inputPlaceholder')"
            @keydown="handleKeydown"
        />
        <!-- 操作模块 -->
        <div class="flex items-end justify-between p-0 sm:p-2">
            <!-- 功能模块 -->
            <div class="flex items-center gap-2">
                <slot name="panel-left">
                    <!--  -->
                </slot>
                <KnowledgeSelect v-model="meta.kb" />
                <UCheckbox label="启用会话记忆" v-model="meta.memory" />
                <UCheckbox label="启用问题重写" v-model="meta.rewrite" />
            </div>
            <!-- 发送 -->
            <slot name="panel-right">
                <UTooltip
                    :content="{ align: 'center', side: 'top', sideOffset: 8 }"
                    :text="
                        isLoading
                            ? t('common.chat.messages.stopGeneration')
                            : !inputValue?.length
                              ? t('common.chat.messages.enterQuestion')
                              : t('common.chat.messages.sendMessage')
                    "
                    :delay-duration="0"
                    :arrow="true"
                    :disabled="isLoading || !!inputValue?.length"
                >
                    <UButton
                        :icon="isLoading ? 'i-lucide-square' : 'i-lucide-arrow-up'"
                        class="rounded-full font-bold"
                        size="xl"
                        :disabled="!isLoading && !inputValue?.length"
                        :color="isLoading ? 'error' : 'primary'"
                        @click.stop="handleSubmit"
                    />
                </UTooltip>
            </slot>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.chat-action-bar {
    :deep(.custom-textarea) {
        // min-height: 40px;
        // max-height: 220px;
        // line-height: 24px;

        /* 滚动条样式 */
        & {
            /* Firefox 滚动条样式 */
            scrollbar-width: thin;
            scrollbar-color: var(--color-border) transparent;
        }

        /* Webkit 滚动条样式 */
        &::-webkit-scrollbar {
            width: 6px;
            height: 6px;
        }

        &::-webkit-scrollbar-track {
            background: transparent;
            border-radius: 4px;
        }

        &::-webkit-scrollbar-thumb {
            background-color: var(--color-border);
            border-radius: 4px;

            &:hover {
                background-color: var(--color-muted);
            }
        }
    }

    :deep(.textarea-wrapper) {
        min-height: 40px !important;
    }
}
</style>
