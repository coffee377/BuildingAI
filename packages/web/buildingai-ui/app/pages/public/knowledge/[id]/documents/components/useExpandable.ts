import {
    apiListDocumentChunks,
    apiListDocumentEntities,
    apiListDocumentRelationships,
} from "@buildingai/service/webapi/knowledge";
import type { ChunkResponse, EntityResponse, RelationshipResponse } from "r2r-js";

export interface PageData<T = never> {
    page: number;
    pageSize: number;
    loading: boolean;
    total: number;
    items?: T[];
}

export const useExpandable = (docId: string) => {
    const chunksPaging = usePaging<ChunkResponse>({
        page: 1,
        pageSize: 10,
        fetchFun: apiListDocumentChunks,
        params: { docId },
        firstLoading: true,
    });

    watch(
        () => chunksPaging.paging.page,
        (val) => {
            if (val) {
                chunksPaging.getLists();
            }
        },
    );

    const entitiesPaging = usePaging<EntityResponse>({
        page: 1,
        pageSize: 10,
        fetchFun: apiListDocumentEntities,
        params: { docId },
        firstLoading: true,
    });

    watch(
        () => entitiesPaging.paging.page,
        (val) => {
            if (val) {
                entitiesPaging.getLists();
            }
        },
    );

    const relationshipsPaging = usePaging<RelationshipResponse>({
        page: 1,
        pageSize: 10,
        fetchFun: apiListDocumentRelationships,
        params: { docId },
        firstLoading: true,
    });

    watch(
        () => relationshipsPaging.paging.page,
        (val) => {
            if (val) {
                relationshipsPaging.getLists();
            }
        },
    );

    const firstLoad = () => {
        return Promise.all([
            chunksPaging.getLists(),
            entitiesPaging.getLists(),
            relationshipsPaging.getLists(),
        ]);
    };

    return reactive<{
        chunks: PageData<ChunkResponse>;
        entities: PageData<EntityResponse>;
        relationships: PageData<RelationshipResponse>;
        firstLoad: () => void;
    }>({
        chunks: unref(chunksPaging.paging),
        entities: unref(entitiesPaging.paging),
        relationships: unref(relationshipsPaging.paging),
        firstLoad,
    });
};
