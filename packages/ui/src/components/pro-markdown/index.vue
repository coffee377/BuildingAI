<!--
 * ProMarkdown组件
 * 一个高度可定制的Markdown渲染组件，支持表格、配图、流程图、时序图、状态图、UML图、数学公式等
 * 使用方式: <ProMarkdown :content="content" />
 * @author FastbuildAI
-->

<script setup lang="ts">
import "katex/dist/katex.min.css";

import { watch } from "vue";

import { useMarkdown } from "./composables/useMarkdown";

interface Props {
    /** 内容 */
    content?: string;
}

const props = withDefaults(defineProps<Props>(), {
    content: "",
});

const { result, render, handleClick } = useMarkdown();

const handleDetailsDblClick = (event: MouseEvent) => {
    // 检查双击的目标元素是否是 details 或者在 details 内部
    const target = event.target as HTMLElement;
    const detailsElement = target?.closest("details");

    if (detailsElement) {
        // 如果是 details 元素，执行相应操作 (切换 details 的展开/折叠状态)
        detailsElement.open = !detailsElement.open;
    }
};

/** 初始渲染 */
render(props.content);

/** 监听内容变化渲染 */
watch(
    () => props.content,
    (newContent) => {
        render(newContent);
    },
);

defineExpose({
    /** 手动重新渲染 */
    refresh: () => render(props.content),
});
</script>

<template>
    <!--
        SSR 回退：
        1. 在服务端渲染阶段，v-dompurify-html 指令不会执行，因此先用插值方式渲染纯文本内容。
        2. 客户端挂载完成后，v-dompurify-html 指令会将 innerHTML 覆盖为已消毒的 Markdown 渲染结果。
        这样即可避免 SSR 阶段页面为空的问题。
    -->
    <ClientOnly>
        <div class="pro-markdown" @dblclick="handleDetailsDblClick">
            <slot name="before" />
            <div @click="handleClick($event)" v-dompurify-html:markdown="result" />
            <slot name="after" />
        </div>

        <template #placeholder>
            <pre class="whitespace-pre-line">{{ props.content }}</pre>
        </template>
    </ClientOnly>
</template>

<style>
/* 导入样式 */
@import "./styles/markdown.css";
</style>
