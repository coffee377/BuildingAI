<script setup lang="ts">
import type { MenuItem, NavigationConfig } from "@/app/console/decorate/layout/types";
import { ROUTES } from "@/common/constants/routes.constant";
import Logo from "@/public/logo.svg";

const UserProfile = defineAsyncComponent(() => import("./components/user-profile.vue"));

interface Props {
    navigationConfig: NavigationConfig;
    hasPreview?: boolean;
}

const props = defineProps<Props>();
const userStore = useUserStore();
const appStore = useAppStore();

/**
 * 转换导航配置为菜单项
 */
const sidebarMenus = computed(() => {
    return props.navigationConfig.items
        .map((item: MenuItem) => ({
            path: item.link?.path || "/",
            title: item.title,
            icon: item.icon || "i-lucide-circle",
            children: item.children,
            hidden: !!item.hidden,
        }))
        .filter((item) => !item.hidden);
});

/**
 * 检查路由是否激活
 */
const isActive = (path: string): boolean => {
    const route = useRoute();
    return (
        route.path === path || route.path.startsWith(path + "/") || route.meta.activePath === path
    );
};
</script>

<template>
    <div class="bg-muted dark:bg-muted/50 flex h-full min-h-full w-full flex-1">
        <!-- 固定侧边栏 -->
        <div
            class="fixed top-0 left-0 z-50 h-full w-20 overflow-y-auto transition-[width,opacity]"
            :class="{ '!left-inherit !static !translate-x-0': hasPreview }"
        >
            <div class="flex size-full flex-col items-center gap-5 py-4">
                <!-- Logo 区域 -->
                <NuxtLink to="/" class="flex justify-center">
                    <h1 class="bg-primary flex size-10 items-center justify-center rounded-lg">
                        <img
                            v-if="appStore.siteConfig?.webinfo.logo"
                            :src="appStore.siteConfig?.webinfo.logo"
                            alt="Logo"
                            class="size-8"
                        />
                        <Logo
                            v-else
                            class="text-background size-7"
                            :fontControlled="false"
                            filled
                        />
                    </h1>
                </NuxtLink>

                <!-- 主导航菜单 -->
                <template v-for="item in sidebarMenus" :key="item.path">
                    <!-- 普通菜单项 -->
                    <NuxtLink
                        :to="item.path"
                        :class="`group flex flex-col items-center justify-center gap-1 ${
                            isActive(item.path) ? 'text-primary' : 'text-foreground/80'
                        }`"
                    >
                        <div
                            class="group-hover:bg-foreground/5 flex h-10 w-10 items-center justify-center rounded-full transition-colors"
                            :class="
                                isActive(item.path)
                                    ? 'bg-primary/[0.09] hover:bg-primary/[0.09]'
                                    : ''
                            "
                        >
                            <UIcon :name="item.icon" class="h-5 w-5" />
                        </div>
                        <span class="text-center text-xs">{{ item.title }}</span>
                    </NuxtLink>
                </template>

                <!-- 底部区域 -->
                <div class="mt-auto flex flex-col items-center gap-6">
                    <!-- 帮助链接 -->
                    <NuxtLink
                        v-if="userStore.userInfo?.permissions"
                        :to="ROUTES.CONSOLE"
                        class="group text-foreground/80 flex flex-col items-center gap-1"
                    >
                        <div
                            class="group-hover:bg-foreground/5 flex h-10 w-10 items-center justify-center rounded-full"
                            :class="isActive('/help') ? 'bg-primary/[0.09]' : ''"
                        >
                            <UIcon name="i-lucide-layout-dashboard" class="h-5 w-5" />
                        </div>
                        <span class="text-center text-xs">{{ $t("common.menu.workspace") }}</span>
                    </NuxtLink>

                    <!-- 用户头像 -->
                    <UserProfile
                        size="md"
                        :collapsed="true"
                        :content="{
                            side: 'right',
                            align: 'end',
                            sideOffset: 10,
                            alignOffset: -10,
                        }"
                    />
                </div>
            </div>
        </div>

        <!-- 主要内容区域 -->
        <main
            class="bg-background ml-20 flex h-full flex-1 flex-col rounded-l-xl"
            :class="{ '!ml-0 p-4 pl-0': hasPreview }"
        >
            <slot />
        </main>

        <!-- 移动端导航菜单 -->
        <!-- <MobileNavigation v-model="false" :navigation-config="navigationConfig" /> -->
    </div>
</template>
