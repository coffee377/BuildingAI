import type {
    CollectionResponse,
    WrappedBooleanResponse,
    WrappedChunksResponse,
    WrappedCollectionResponse,
    WrappedCollectionsResponse,
    WrappedDocumentsResponse,
    WrappedEntitiesResponse,
    WrappedRelationshipsResponse,
    WrappedUsersResponse,
} from "r2r-js";
import { r2rClient } from "r2r-js";

const app = {
    // R2R接口基础前缀
    R2R_API_PREFIX: import.meta.env.VITE_APP_R2R_API_PREFIX as string,
    // 文件转换接口前缀
    FILE_CONVERSION_API_PREFIX: import.meta.env.VITE_APP_FILE_CONVERSION_API_PREFIX as string,
};

import type { Pagination } from "../models/globals";

// http://localhost:7272 or the address that you are running the R2R server
export const client = new r2rClient(app.R2R_API_PREFIX, false, {
    enableAutoRefresh: true,
    getTokensCallback: () => {
        return {
            accessToken: localStorage.getItem("r2r_access_token"),
            refreshToken: localStorage.getItem("r2r_refresh_token"),
        };
    },
    setTokensCallback: (accessToken, refreshToken) => {
        if (accessToken) {
            localStorage.setItem("r2r_access_token", accessToken);
        }
        if (refreshToken) {
            localStorage.setItem("r2r_refresh_token", refreshToken);
        }
    },
});

/**
 * 查询知识库请求参数
 */
export interface QueryKnowledgeParams extends Pagination {
    /** 关键词搜索 */
    keyword?: string;
    /** 是否显示所有知识库 */
    showAll?: boolean;
}

function getOffsetAndLimit(rest: Pagination): { offset: number; limit: number } {
    const { page, pageSize } = rest;
    const offset = ((page || 1) - 1) * (pageSize || 100);
    const limit = pageSize ?? 100;
    return { offset, limit };
}

/**
 * 获取知识库列表
 * @param params 查询参数
 */
export function apiGetKnowledgeList(
    params: QueryKnowledgeParams,
): Promise<WrappedCollectionsResponse> {
    const { showAll = true, ...rest } = params;
    const ownerOnly = !showAll;
    const { offset, limit } = getOffsetAndLimit(rest);
    return client.collections.list({ offset, limit, ownerOnly });
}

export interface CreateKnowledgeParams {
    name: string;
    description?: string;
}

/**
 * 获取知识库详情
 * @param id 知识库ID
 * @returns 知识库详情
 */
export async function apiGetKnowledgeDetail(id: string): Promise<CollectionResponse> {
    return (await client.collections.retrieve({ id })).results;
}

/**
 * 创建知识库
 * @param params
 */
export function apiCreateKnowledge(
    params: CreateKnowledgeParams,
): Promise<WrappedCollectionResponse> {
    return client.collections.create(params);
}

/**
 * 删除知识库
 * @param id 知识库ID
 * @returns 删除结果
 */
export function apiDeleteKnowledge(id: string): Promise<WrappedBooleanResponse> {
    return client.collections.delete({ id });
}

interface TransformResult {
    converted?: string;
    original?: string;
}

/**
 * 去掉文件名中的后缀
 * @param {string} filename - 原始文件名
 * @returns {string} 去掉后缀后的文件名
 */
function removeFileExtension(filename: string) {
    // 找到最后一个点的位置
    const lastDotIndex = filename.lastIndexOf(".");
    // 如果没有点，或者点是第一个字符（如".gitignore"），则返回原文件名
    if (lastDotIndex <= 0) {
        return filename;
    }
    // 截取从开始到最后一个点之前的部分
    return filename.substring(0, lastDotIndex);
}

async function transformFile(file: File): Promise<{ file: File; meta: any }> {
    const data = new FormData();
    data.append("file", file);
    const res = await fetch(`${app.FILE_CONVERSION_API_PREFIX}/convert`, {
        method: "POST",
        body: data as FormData,
    });

    const meta = {
        title: file.name,
    } as Record<string, any>;

    const json: TransformResult = (await res.json()) ?? {};
    const { converted, original } = json;
    if (original && converted) {
        const originalUrl = new URL(original);
        let filename = decodeURI(originalUrl.pathname);
        filename = filename.substring(filename.lastIndexOf("/") + 1);
        meta["original_filename"] = filename;
        meta["original_url"] = original;
    }
    if (converted) {
        const url = new URL(converted);
        const res = await fetch(url, { method: "GET" });
        const blob = await res.blob();
        // 如果未指定 type，使用 blob 自身的 type
        // const fileType = blob.type;
        const f = decodeURI(url.pathname);
        const filename = f.substring(f.lastIndexOf("/") + 1);
        meta.title = filename;
        // File 构造函数：(文件内容数组, 文件名, 选项)
        const file = new File([blob], filename);
        return { file, meta };
    }

    return { file, meta };
}

interface FileInfo {
    originalFileName: string;
    rawFile: File;
    convertFile?: File;
    meta?: Record<string, any>;
    documentId?: string;
    uploaded?: boolean;
}

/**
 * 创建文档
 * @returns 创建的文档信息
 * @param uploadFiles
 * @param knowledgeId
 * @param callback
 */
export async function apiCreateDocument(
    uploadFiles: File | File[],
    knowledgeId: string,
    callback?: () => void | Promise<void>,
): Promise<void> {
    try {
        // 获取所有已上传文档
        const docs = await client.documents.list({ limit: 1000 });
        // 更新上传文件信息
        const fileInfos: FileInfo[] = [];

        for (const file of Array.isArray(uploadFiles) ? uploadFiles : [uploadFiles]) {
            // 如果存在相应 docx 文件，就认为已经上传过了
            const name = removeFileExtension(file.name);
            const names = [file.name, `${name}.docx`];
            const documentId = docs.results.find((doc) => names.includes(doc.title ?? ""))?.id;
            let convertFile: File | undefined, meta: Record<string, any> | undefined;
            if (!documentId) {
                const transform = await transformFile(file);
                convertFile = transform.file;
                meta = transform.meta;
            }
            const fileInfo: FileInfo = {
                originalFileName: file.name,
                rawFile: file,
                convertFile,
                documentId,
                uploaded: !!documentId,
                meta,
            };
            fileInfos.push(fileInfo);
        }

        for (const fileInfo of fileInfos) {
            const { rawFile, convertFile, meta = {}, documentId: docId, uploaded } = fileInfo;
            let documentId: string;
            if (!uploaded) {
                const res = await client.documents.create({
                    file: convertFile || rawFile,
                    metadata: { ...meta },
                    collectionIds: [knowledgeId],
                });
                documentId = res.results.documentId;
            } else {
                documentId = docId!;
                // 文档绑定知识库
                try {
                    await client.collections.addDocument({
                        id: knowledgeId,
                        documentId: documentId,
                    });
                } catch (e) {
                    console.log("文档已存在");
                }
            }
        }

        callback?.();
    } catch (e) {
        throw new Error(String(e));
    }
}

/**
 * 查询知识库文档请求参数
 */
export interface QueryDocumentParams extends Pagination {
    keyword?: string;
    /**
     * 知识库 id
     */
    knowledgeId: string;
}

/**
 * 获取知识库文档
 * @returns 文档信息
 * @param params
 */
export function apiGetDocumentList(params: QueryDocumentParams): Promise<WrappedDocumentsResponse> {
    const { knowledgeId, ...rest } = params;
    const { offset, limit } = getOffsetAndLimit(rest);
    return client.collections.listDocuments({ id: knowledgeId, offset, limit });
}

/**
 * 下载文档
 * @param id
 */
export function apiDownloadDocument(id: string): Promise<Blob> {
    return client.documents.download({ id });
}

/**
 * 删除文档
 * @param id 文档ID
 * @param knowledgeId
 * @returns 删除结果
 */
export async function apiDeleteDocument(
    id: string,
    knowledgeId: string,
): Promise<{ success: boolean }> {
    try {
        if (knowledgeId && id) {
            await client.collections.removeDocument({ id: knowledgeId, documentId: id });
        }
        if (id) {
            await client.documents.delete({ id });
        }
        return Promise.resolve({ success: true });
    } catch (e) {
        return Promise.resolve({ success: false });
    }
}

/**
 * 查询知识库文档请求参数
 */
export interface QueryKnowledgeUserParams extends Pagination {
    /**
     * 知识库 id
     */
    knowledgeId: string;
}

/**
 * 列出所有用户
 */
export async function apiLisAllUser(): Promise<WrappedUsersResponse> {
    return client.users.list();
}

/**
 * 列出知识库用户
 * @param params
 */
export async function apiListKnowledgeUser(
    params: QueryKnowledgeUserParams,
): Promise<WrappedUsersResponse> {
    const { knowledgeId, ...rest } = params;
    const { offset, limit } = getOffsetAndLimit(rest);
    return client.collections.listUsers({ id: knowledgeId, offset, limit });
}

/**
 * 删除知识库用户
 * @param id
 * @param knowledgeId
 */
export async function apiDeleteKnowledgeUser(
    id: string,
    knowledgeId: string,
): Promise<WrappedBooleanResponse> {
    return client.users.removeFromCollection({ id, collectionId: knowledgeId });
}

/**
 * 添加知识库用户
 * @param userId
 * @param knowledgeId
 */
export async function apiAddKnowledgeUser(
    userId: string,
    knowledgeId: string,
): Promise<WrappedBooleanResponse> {
    return client.users.addToCollection({ id: userId, collectionId: knowledgeId });
}

/**
 * 列出文档 Chunks
 * @param params
 */
export async function apiListDocumentChunks(params: {
    docId: string;
}): Promise<WrappedChunksResponse> {
    const { ...rest } = params;
    const { offset, limit } = getOffsetAndLimit(rest);
    return client.documents.listChunks({ id: params.docId, offset, limit });
}

/**
 * 列出文档 Entities
 * @param params
 */
export async function apiListDocumentEntities(params: {
    docId: string;
}): Promise<WrappedEntitiesResponse> {
    const { ...rest } = params;
    const { offset, limit } = getOffsetAndLimit(rest);
    return client.documents.listEntities({ id: params.docId, offset, limit });
}

/**
 * 列出文档 Relationships
 * @param params
 */
export async function apiListDocumentRelationships(params: {
    docId: string;
}): Promise<WrappedRelationshipsResponse> {
    const { ...rest } = params;
    const { offset, limit } = getOffsetAndLimit(rest);
    return client.documents.listRelationships({ id: params.docId, offset, limit });
}
