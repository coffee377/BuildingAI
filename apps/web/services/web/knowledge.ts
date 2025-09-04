import type {
    CollectionResponse,
    WrappedBooleanResponse,
    WrappedCollectionResponse,
    WrappedCollectionsResponse,
    WrappedIngestionResponse,
} from "r2r-js";
import { r2rClient } from "r2r-js";

import type { Pagination } from "@/models";

// http://localhost:7272 or the address that you are running the R2R server
export const client = new r2rClient("http://10.1.150.105:7272");

// await client.users.login({ email: "admin@example.com", password: "change_me_immediately" });

/**
 * 查询知识库请求参数
 */
export interface QueryKnowledgeParams extends Pagination {
    /** 关键词搜索 */
    keyword?: string;
    /** 是否显示所有知识库 */
    showAll?: boolean;
}

/**
 * 获取知识库列表
 * @param params 查询参数
 */
export function apiGetKnowledgeList(
    params: QueryKnowledgeParams,
): Promise<WrappedCollectionsResponse> {
    const { page, pageSize, showAll = true } = params;
    const offset = ((page || 1) - 1) * (pageSize || 10);
    const limit = pageSize ?? 10;
    const ownerOnly = !showAll;
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

/**
 * 创建文档
 * @returns 创建的文档信息
 * @param file
 */
export function apiCreateDocument(file: File): Promise<WrappedIngestionResponse> {
    return client.documents.create({ file });
}
