import { useMessage } from "@fastbuildai/ui/composables/useMessage";
import { defineStore } from "pinia";

import { ROUTES } from "@/common/constants/routes.constant";
import { STORAGE_KEYS } from "@/common/constants/storage.constant";
import type { UserInfo } from "@/models/user";
import { apiGetCurrentUserInfo } from "@/services/web/user";
import { client } from "@/services/web/knowledge";

export const useUserStore = defineStore("auth", () => {
    /** 过期时间 */
    const _expireTime = 60 * 60 * 24 * 31;

    const TOKEN = useCookie(STORAGE_KEYS.USER_TOKEN).value || null;
    const TEMPORARY_TOKEN = useCookie(STORAGE_KEYS.USER_TEMPORARY_TOKEN).value || null;
    const LOGIN_TIME_STAMP = Number(useCookie(STORAGE_KEYS.LOGIN_TIME_STAMP).value || 0);

    /** 临时token */
    const temporaryToken = ref<string | null>(TEMPORARY_TOKEN);
    /** token */
    const token = ref<string | null>(TOKEN);
    /** 用户信息 */
    const userInfo = ref<UserInfo | null>(null);
    /** 用户ID */
    /** 登录过期提示 */
    const onExpireNotice = ref<boolean>(false);
    /** 登录时间戳 */
    const loginTimeStamp = ref<number>(LOGIN_TIME_STAMP);
    /** 是否勾选隐私协议 */
    const isAgreed = ref<boolean>(false);

    /** 是否登录 */
    const isLogin = computed(() => {
        return token.value !== null && token.value !== undefined;
    });

    /** 登录 */
    const login = async (newToken: string) => {
        const route = useRoute();
        if (!newToken) return useMessage().error("登录出错，请重试");
        setToken(newToken);
        setLoginTimeStamp();
        await nextTick();
        getUser();

        const params = route.query as Record<string, string>;
        const redirectUrl = params.redirect;

        if (!redirectUrl || redirectUrl === ROUTES.HOME || redirectUrl === ROUTES.LOGIN) {
            return reloadNuxtApp({
                ttl: 100,
                path: ROUTES.HOME,
            });
        }

        // 解析 redirect URL，支持带查询参数的 URL
        const redirectParts = redirectUrl.split("?");
        const redirectPath = redirectParts[0];

        if (route.path === redirectPath) {
            return reloadNuxtApp({
                ttl: 100,
                path: redirectUrl,
            });
        } else {
            return navigateTo(redirectUrl, { replace: true });
        }
    };

    /** 登录 */
    const tempLogin = async (newToken: string) => {
        token.value = newToken;
    };

    /** 退出登录 */
    const logout = async (expire?: boolean, route = useRoute()) => {
        if (import.meta.client && expire && !onExpireNotice.value) {
            onExpireNotice.value = true;
            useMessage().warning("登录过期，请重新登录", {
                hook: () => {
                    onExpireNotice.value = false;
                },
            });
        }
        client.users.logout().then();
        clearToken();
        userInfo.value = null;
        reloadNuxtApp({
            ttl: 100,
        });
        localStorage.removeItem("modelId");
        localStorage.removeItem("mcpIds");

        const needRedirect = route?.meta.auth !== false;
        if (!needRedirect) return;

        return useRouter().replace({
            path: `${ROUTES.HOME}?redirect=${route?.fullPath}`,
            replace: true,
        });
    };

    /** 去登录 */
    const toLogin = async (route = useRoute()) => {
        if (route.path === ROUTES.LOGIN) {
            return;
        }
        clearToken();
        useRouter().push(`${ROUTES.LOGIN}?redirect=${route?.fullPath}`);
    };

    /** 获取用户信息 */
    const getUser = async () => {
        try {
            userInfo.value = await apiGetCurrentUserInfo();
            return userInfo.value;
        } catch (error) {
            console.error("获取用户信息失败:", error);
            return null;
        }
    };

    /** 设置token到cookie */
    const setToken = (newToken: string | null) => {
        token.value = newToken;
        setLoginTimeStamp();
        useCookie(STORAGE_KEYS.USER_TOKEN, { maxAge: _expireTime }).value = newToken;
    };

    /** 设置临时token */
    const setTemporaryToken = (newToken: string | null) => {
        temporaryToken.value = newToken;
        useCookie(STORAGE_KEYS.USER_TEMPORARY_TOKEN).value = newToken;
    };

    /** 清空token */
    const clearToken = () => {
        token.value = null;
        loginTimeStamp.value = 0;
        temporaryToken.value = null;
        useCookie(STORAGE_KEYS.USER_TOKEN).value = null;
        useCookie(STORAGE_KEYS.USER_TEMPORARY_TOKEN).value = null;
        useCookie(STORAGE_KEYS.LOGIN_TIME_STAMP).value = null;
    };

    /** 滑动刷新token */
    const refreshToken = () => {
        if (Date.now() - loginTimeStamp.value >= 3600 * 7) {
            useCookie(STORAGE_KEYS.USER_TOKEN, { maxAge: _expireTime }).value = token.value;
            setLoginTimeStamp();
        }
    };

    /** 设置登录时间 */
    const setLoginTimeStamp = () => {
        useCookie(STORAGE_KEYS.LOGIN_TIME_STAMP, {
            maxAge: _expireTime,
        }).value = String(Date.now());
    };

    return {
        // 变量
        temporaryToken,
        token,
        userInfo,
        onExpireNotice,
        loginTimeStamp,
        isAgreed,
        // 是否登录
        isLogin,
        // 方法
        login,
        tempLogin,
        setToken,
        clearToken,
        logout,
        toLogin,
        getUser,
        setTemporaryToken,
        refreshToken,
    };
});
