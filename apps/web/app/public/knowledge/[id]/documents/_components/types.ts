import type { ChunkResponse, EntityResponse, RelationshipResponse } from "r2r-js";

import type { PageData } from "./useExpandable";

export interface ExpandableDocumentData {
    chunks: ChunkResponse[];
    entities: EntityResponse[];
    relationships: RelationshipResponse[];
}

export interface ExpandableListProps<T = ChunkResponse | EntityResponse | RelationshipResponse> {
    type?: keyof ExpandableDocumentData;
    pagination?: PageData<T>;
}
