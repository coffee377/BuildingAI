import type { ChunkResponse, EntityResponse, RelationshipResponse } from "r2r-js";

import type { PageData } from "./useExpandable";

export interface ExpandableDocumentData {
    chunks: ChunkResponse[];
    entities: EntityResponse[];
    relationships: RelationshipResponse[];
}

// export interface ExpandableListProps<T = ChunkResponse | EntityResponse | RelationshipResponse> {
//     type?: keyof ExpandableDocumentData;
//     pagination?: PageData<T>;
// }

// 核心：定义 type 到元素类型的映射（自动提取 ExpandableDocumentData 每个键对应的元素类型）
type ExpandableTypeMap = {
    [K in keyof ExpandableDocumentData]: ExpandableDocumentData[K][number];
};

// 优化后的泛型接口：泛型约束为 ExpandableDocumentData 的键，自动推导元素类型
export interface ExpandableListProps<
    K extends keyof ExpandableDocumentData = keyof ExpandableDocumentData,
> {
    // type 与泛型 K 强绑定
    type?: K;
    // 分页数据的类型自动从 K 推导，无需手动传 T
    pagination?: PageData<ExpandableTypeMap[K]>;
}
