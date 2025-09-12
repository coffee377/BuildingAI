<script setup lang="tsx">
import { ProPaginaction, useMessage, useModal, usePaging } from "@fastbuildai/ui";
import type { TableColumn, TableRow } from "@nuxt/ui";
import type { DocumentResponse } from "r2r-js";
import { resolveComponent } from "vue";

import {
    apiCreateDocument,
    apiDeleteDocument,
    apiDownloadDocument,
    apiGetDocumentList,
    type QueryDocumentParams,
} from "@/services/web/knowledge";

import Create from "./create.vue";

const UButton = resolveComponent("UButton");
const UBadge = resolveComponent("UBadge");
const UDropdownMenu = resolveComponent("UDropdownMenu");
const UIcon = resolveComponent("UIcon");
const UInput = resolveComponent("UInput");
const TimeDisplay = resolveComponent("TimeDisplay");

const refresh = inject<() => Promise<void>>("knowledge");
const route = useRoute();
const router = useRouter();
const toast = useMessage();
const { t } = useI18n();
const kid = computed(() => (route.params as Record<string, string>).id);
const { hasAccessByCodes } = useAccessControl();

// 列表查询参数
const searchForm = reactive<QueryDocumentParams>({
    keyword: "",
    knowledgeId: kid.value,
});

// 列ID到中文名称的映射
const columnLabels = computed(() => ({
    fileName: t("knowledge.documents.table.fileName"),
    fileSize: t("knowledge.documents.table.fileSize"),
    originalFileName: t("knowledge.documents.table.originalFileName"),
    ingestionStatus: t("knowledge.documents.table.ingestionStatus"),
    extractionStatus: t("knowledge.documents.table.extractionStatus"),
    createdAt: t("knowledge.documents.table.createdAt"),
    actions: t("console-common.operation"),
}));

// 分页查询文档
const { paging, getLists } = usePaging<DocumentResponse>({
    fetchFun: apiGetDocumentList,
    params: searchForm,
    firstLoading: true,
});

// 文件类型图标映射
const fileTypeIcons = {
    pdf: "i-lucide-file-text",
    doc: "i-lucide-file-text",
    docx: "i-lucide-file-text",
    txt: "i-lucide-file-text",
    md: "i-lucide-file-text",
    csv: "i-lucide-file-spreadsheet",
    xlsx: "i-lucide-file-spreadsheet",
    xls: "i-lucide-file-spreadsheet",
    default: "i-lucide-file",
};

// 定义表格列
const columns: TableColumn<DocumentResponse>[] = [
    {
        accessorKey: "id",
        header: "序号",
        cell: ({ row }) => {
            // 计算分页后的连续序号：(当前页-1)*页大小 + 索引 + 1
            return (paging.page - 1) * paging.pageSize + row.index + 1;
        },
        meta: {
            class: {
                td: "w-16 px-2 text-center",
            },
        },
    },
    {
        accessorKey: "title",
        header: () => h("p", { class: "whitespace-nowrap" }, `${columnLabels.value.fileName}`),
        cell: ({ row }) => {
            const documentType = row.original["documentType"] as string;
            const fileName = row.original["title"] as string;
            return h("div", { class: "flex items-center gap-3" }, [
                h(UIcon, {
                    name: fileTypeIcons[documentType] || fileTypeIcons.default,
                    class: "text-primary size-5",
                }),
                h("div", { class: "flex-1 grid" }, [
                    h("p", { class: "font-medium text-highlighted truncate" }, fileName),
                ]),
            ]);
        },
    },
    {
        accessorKey: "sizeInBytes",
        header: () => h("p", { class: "" }, `${columnLabels.value.fileSize}`),
        cell: ({ row }) => {
            const fileSize = row.original["sizeInBytes"] as number;
            return h("span", { class: "text-sm" }, formatFileSize(fileSize));
        },
    },
    {
        accessorKey: "metadata.originalFilename",
        header: () => h("p", { class: "" }, `${columnLabels.value.originalFileName}`),
        cell: ({ row }) => {
            const url = row.original["metadata"]["originalUrl"] as string;
            const filename = row.original["metadata"]["originalFilename"] as string;
            return h("a", { href: url, target: "_blank" }, filename);
        },
    },
    {
        accessorKey: "ingestionStatus",
        header: () =>
            h("p", { class: "whitespace-nowrap" }, `${columnLabels.value.ingestionStatus}`),
        cell: ({ row }) => {
            const ingestion = row.original["ingestionStatus"] || 0;
            return h("span", { class: "text-sm text-primary" }, ingestion);
        },
    },
    {
        accessorKey: "extractionStatus",
        header: () =>
            h("p", { class: "whitespace-nowrap" }, `${columnLabels.value.extractionStatus}`),
        cell: ({ row }) => {
            const extraction = row.original["extractionStatus"] || 0;
            return h("span", { class: "text-sm text-primary" }, extraction);
        },
    },
    {
        accessorKey: "createdAt",
        header: ({ column }) => {
            const isSorted = column.getIsSorted();
            return h(UButton, {
                color: "neutral",
                variant: "ghost",
                label: columnLabels.value.createdAt,
                icon: isSorted
                    ? isSorted === "asc"
                        ? "i-lucide-arrow-up-narrow-wide"
                        : "i-lucide-arrow-down-wide-narrow"
                    : "i-lucide-arrow-up-down",
                class: "-mx-2.5",
                onClick: () => column.toggleSorting(column.getIsSorted() === "asc"),
            });
        },
        cell: ({ row }) => {
            const createdAt = row.original["createdAt"] as string;
            return h(TimeDisplay, {
                datetime: createdAt,
                mode: "datetime",
            });
        },
    },
    {
        id: "actions",
        header: () => h("p", { class: "" }, `${columnLabels.value.actions}`),
        size: 80,
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => {
            return (
                <div class="space-x-1">
                    <UTooltip delayDuration={100} text={t("knowledge.documents.download")}>
                        <UButton
                            icon="i-lucide-download"
                            color="primary"
                            variant="ghost"
                            class="cursor-pointer"
                            onClick={() => {
                                handleDownload(row.original.id, row.original.title!);
                            }}
                        />
                    </UTooltip>
                    <UTooltip delayDuration={100} text={t("knowledge.documents.delete")}>
                        <UButton
                            icon="i-lucide-trash"
                            color="error"
                            variant="ghost"
                            class="cursor-pointer"
                            onClick={() => {
                                handleDelete(row.original.id);
                            }}
                        />
                    </UTooltip>
                </div>
            );
        },
    },
];

const handleDownload = async (docId: string, fileName: string) => {
    try {
        const tip = toast.info("文档正在下载中");
        const blob = await apiDownloadDocument(docId);
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.style.display = "none";
        link.href = url;
        link.download = fileName;

        document.body.appendChild(link);
        link.click();

        URL.revokeObjectURL(url);
        document.body.removeChild(link);

        tip.close();
    } catch (error) {
        toast.error("文档下载失败");
        console.error(error);
    }
};

const files = ref<File[]>([]);

const handleFileChange = (file: File[]) => {
    files.value = file;
};

const handleCreate = async () => {
    try {
        await useModal({
            color: "primary",
            title: t("knowledge.documents.create.title"),
            content: <Create onChange={handleFileChange} />,
            confirmText: t("console-common.confirm"),
            ui: {},
        });
        apiCreateDocument(unref(files), unref(kid), refresh);
        toast.success(t("common.message.createSuccess") + "，后台异步处理中，请稍后查询！");
    } catch (error) {
        console.error("文档创建失败:", error);
    } finally {
        files.value = [];
    }
};

// 删除文档
const handleDelete = async (docId: string) => {
    try {
        await useModal({
            color: "error",
            title: t("console-ai-datasets.documents.delete.title"),
            content: t("console-ai-datasets.documents.delete.desc"),
            confirmText: t("console-common.delete"),
            ui: {
                content: "!w-sm",
            },
        });
        await apiDeleteDocument(docId, kid.value);
        await refresh?.();
        toast.success(t("common.message.deleteSuccess"));
        // 刷新数据
        await getLists();
    } catch (error) {
        console.error("删除失败:", error);
    }
};

// 点击表格行跳转分段
const handleRowClick = (row: TableRow<DocumentResponse>) => {};

// 初始化
onMounted(getLists);

definePageMeta({ layout: "knowledge" });
</script>

<template>
    <div class="flex h-full w-full flex-col px-6">
        <div class="flex flex-col justify-center gap-1 pt-4">
            <h1 class="!text-lg font-bold">{{ t("console-ai-datasets.documents.title") }}</h1>
            <p class="text-muted-foreground text-sm">
                {{ t("console-ai-datasets.documents.description") }}
            </p>
        </div>

        <!-- 搜索区域 -->
        <div class="flex w-full justify-between gap-4 py-6 backdrop-blur-sm">
            <UInput
                v-model="searchForm.keyword"
                :placeholder="t('console-ai-datasets.documents.searchPlaceholder')"
                class="w-80"
                icon="i-lucide-search"
            />

            <div class="flex items-center gap-2 md:ml-auto">
                <UButton leading-icon="i-lucide-search" @click="getLists" label="查询"></UButton>
                <AccessControl :codes="['ai-datasets-documents:create']">
                    <UButton
                        :label="t('knowledge.documents.create.title')"
                        leading-icon="i-lucide-plus"
                        color="primary"
                        @click="handleCreate"
                    />
                </AccessControl>
            </div>
        </div>

        <div class="flex h-full flex-col">
            <div class="table h-full">
                <!-- 表格区域 -->
                <UTable
                    :loading="paging.loading"
                    :data="paging.items"
                    :columns="columns"
                    class="h-full shrink-0"
                    ref="table"
                    selectable
                    sticky
                    :ui="{
                        base: 'table-fixed border-separate border-spacing-0',
                        thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
                        tbody: '[&>tr]:last:[&>td]:border-b-0',
                        th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
                        td: 'border-b border-default ',
                        tr: 'hover:bg-elevated/50',
                    }"
                    :onSelect="handleRowClick"
                />
            </div>
        </div>

        <!-- 分页 -->
        <div class="flex items-center justify-end gap-3 py-4">
            <div class="flex items-center gap-1.5">
                <ProPaginaction
                    v-model:page="paging.page"
                    v-model:size="paging.pageSize"
                    :total="paging.total"
                    @change="getLists"
                />
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss"></style>
