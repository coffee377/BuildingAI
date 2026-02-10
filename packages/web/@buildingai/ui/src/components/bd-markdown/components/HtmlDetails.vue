<script setup lang="ts">
import MarkdownRender, { getMarkdown, parseMarkdownToStructure } from "markstream-vue";

const props = defineProps<{
    node: {
        type: "details";
        tag: string;
        content: string;
        raw: string;
        attrs: [string, string][];
        [key: string]: unknown;
    };
    customId?: string;
    indexKey?: number | string;
}>();

const dProps = computed(() => {
    if (props.node.attrs?.find((a) => a[0] === "open")) {
        return { open: true };
    }
    return {};
});

const md = getMarkdown();
const result = computed(() => {
    const nodes = parseMarkdownToStructure(props.node.content, md);
    const { content } = nodes.find(({ type }) => "html_block" === type) as any;
    const n = nodes.filter((n) => "html_block" !== n["type"]);
    return { summary: content.replace(/<summary[^>]*>|<\/summary>/g, ""), nodes: markRaw(n) };
});

const handleDetailsDblClick = (event: MouseEvent) => {
    // 检查双击的目标元素是否是 details 或者在 details 内部
    const target = event.target as HTMLElement;
    const detailsElement = target?.closest("details");

    if (detailsElement) {
        // 如果是 details 元素，执行相应操作 (切换 details 的展开/折叠状态)
        detailsElement.open = !detailsElement.open;
    }
};
</script>

<template>
    <details v-bind="dProps" class="cursor-pointer" @dblclick="handleDetailsDblClick">
        <summary class="text-lg">{{ result.summary }}</summary>
        <MarkdownRender :nodes="result.nodes" />
    </details>
</template>

<style scoped lang="scss"></style>
