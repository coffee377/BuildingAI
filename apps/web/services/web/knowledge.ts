import type {
    CollectionResponse,
    WrappedBooleanResponse,
    WrappedCollectionResponse,
    WrappedCollectionsResponse,
    WrappedDocumentsResponse,
} from "r2r-js";
import { r2rClient } from "r2r-js";

import app from "@/common/config";
import type { Pagination } from "@/models";

// http://localhost:7272 or the address that you are running the R2R server
export const client = new r2rClient(app.R2R_API_PREFIX);

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
    const offset = ((page || 1) - 1) * (pageSize || 10);
    const limit = pageSize ?? 10;
    return { offset, limit };
}

/**
 * 获取知识库列表
 * @param params 查询参数
 */
export function apiGetKnowledgeList(
    params: QueryKnowledgeParams,
): Promise<WrappedCollectionsResponse> {
    const { keyword, showAll = true, ...rest } = params;
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

async function convertFile(files: File[]) {
    console.log(app.FILE_CONVERSION_API_PREFIX);
    // todo 调用 上传转换接口 http://192.168.44.180:8000/docs
    // 下载文件
    return files;
}

/**
 * 创建文档
 * @returns 创建的文档信息
 * @param uploadFiles
 * @param knowledgeId
 */
export async function apiCreateDocument(
    uploadFiles: File | File[],
    knowledgeId: string,
): Promise<void> {
    try {
        const files = await convertFile(Array.isArray(uploadFiles) ? uploadFiles : [uploadFiles]);
        for (const file of files) {
            const {
                results: { documentId },
            } = await client.documents.create({ file });
            // 文档绑定知识库
            await client.collections.addDocument({ id: knowledgeId, documentId: documentId });
        }
    } catch (e) {
        throw new Error(e);
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
        if (id) {
            await client.documents.delete({ id });
        }
        if (knowledgeId && id) {
            await client.collections.removeDocument({ id: knowledgeId, documentId: id });
        }
        return Promise.resolve({ success: true });
    } catch (e) {
        return Promise.resolve({ success: false });
    }
}
