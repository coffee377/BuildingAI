import { fileURLToPath } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import { visualizer } from "rollup-plugin-visualizer";
import type { PluginOption } from "vite";

import icons from "./assets/icons/icons.json";
import { pwa } from "./common/config/pwa";
import localesI18n from "./core/modules/locales-i18n";

// 构建环境标识：用于优化 SSR 打包时间
const isProd = process.env.NUXT_BUILD_ENV === "production";
const isSSR = process.env.NUXT_BUILD_SSR === "true";

export default defineNuxtConfig({
    modules: [
        localesI18n,
        "@vueuse/nuxt",
        "@pinia/nuxt",
        "nuxt-svgo",
        "@nuxtjs/color-mode",
        "@nuxt/ui",
        "@nuxtjs/i18n",
        // "@vite-pwa/nuxt",
        "@nuxt/eslint",
        "motion-v/nuxt",
    ],

    ssr: import.meta.env.NUXT_BUILD_SSR === "true",

    pages: {
        // 筛选 匹配任意子目录 以及去除 console/下面的所有文件。
        pattern: [
            "*.vue",
            "**/*/*.vue",
            "!**/_***/*.*",
            "!console/**/*.*",
            "!public/**/_components/**/*.*",
        ],
    },

    components: {
        dirs: [
            {
                path: "common/components",
                pathPrefix: true,
                global: false,
                watch: false,
            },
        ],
    },

    imports: {
        dirs: ["common/stores", "common/composables/**", "common/utils/**.ts"],
        // 性能优化：按需导入
        // scan: true,
        // global: false, // 禁用全局导入以提升性能
    },

    devtools: { enabled: false },

    app: {
        head: {
            viewport: "width=device-width,initial-scale=1",
            meta: [
                {
                    name: "viewport",
                    content: "width=device-width, initial-scale=1",
                },
                {
                    name: "apple-mobile-web-app-status-bar-style",
                    content: "black-translucent",
                },
                {
                    name: "theme-color",
                    media: "(prefers-color-scheme: light)",
                    content: "#ffffff",
                },
                {
                    name: "theme-color",
                    media: "(prefers-color-scheme: dark)",
                    content: "#222222",
                },
            ],
        },

        rootAttrs: {
            "data-vaul-drawer-wrapper": "true",
        },
    },

    css: ["assets/styles/globals.css", "assets/styles/ripple.css"],

    unhead: {
        renderSSRHeadOptions: {
            omitLineBreaks: false,
        },
    },

    colorMode: {
        preference: "system",
        fallback: "light",
        hid: "nuxt-color-mode-script",
        globalName: "__NUXT_COLOR_MODE__",
        componentName: "ColorScheme",
        classPrefix: "",
        classSuffix: "",
        storage: "localStorage",
        storageKey: "nuxt-color-mode",
    },

    ui: {
        prefix: "U",
        fonts: false,
        colorMode: true,
        theme: {
            colors: ["primary", "secondary", "success", "info", "warning", "error"],
        },
    },
    spaLoadingTemplate: "./public/spa-loading-template.html",

    dir: {
        plugins: "core/plugins",
        layouts: "core/layouts",
        pages: "app",
        modules: "core/modules",
        middleware: "core/middleware",
    },

    srcDir: ".",

    alias: {
        "@": fileURLToPath(new URL("./", import.meta.url)),
        "~": fileURLToPath(new URL("./", import.meta.url)),
        "@plugins": fileURLToPath(new URL("./plugins", import.meta.url)),
    },

    // 路由懒加载
    routeRules: {
        "/console/**": { prerender: false, ssr: false, swr: true },
        "/profile/**": { prerender: false, ssr: false, swr: true },
    },

    sourcemap: false,

    devServer: {
        port: 4091,
        host: "localhost,0.0.0.0",
    },

    future: {
        compatibilityVersion: 4,
    },

    experimental: {
        // when using generate, payload js assets included in sw precache manifest
        // but missing on offline, disabling extraction it until fixed
        payloadExtraction: true,
        renderJsonPayloads: true,
        typedPages: !isProd,
        asyncContext: true,
        viewTransition: true,

        defaults: {
            useAsyncData: {
                deep: true,
            },
        },

        browserDevtoolsTiming: false,
    },

    compatibilityDate: "2025-07-20",

    nitro: {
        esbuild: {
            options: {
                target: "esnext",
            },
        },
        prerender: {
            crawlLinks: false,
            routes: [],
        },
        compressPublicAssets: false,
        minify: false,
    },

    // // 配置 Vite
    vite: {
        plugins: [tailwindcss() as PluginOption],
        optimizeDeps: {
            include:
                import.meta.env.NUXT_BUILD_ENV === "development"
                    ? [
                          "@tanstack/table-core",
                          "@internationalized/date",
                          "reka-ui",
                          "@tiptap/vue-3",
                          "@tiptap/starter-kit",
                          "@tanstack/vue-table",
                          "@iconify-json/lucide",
                          "yup",
                          "@intlify/shared",
                          "@intlify/core-base",
                          "markdown-it-async",
                          "markdown-it-github-alerts",
                          "@shikijs/markdown-it/async",
                          "qrcode.vue",
                          "echarts/charts",
                          "vue-dompurify-html",
                          "echarts/components",
                          "echarts/core",
                          "echarts/features",
                          "echarts/renderers",
                          "tailwindcss/colors",
                          "motion-v",
                          "@lottiefiles/dotlottie-vue",
                          "@fancyapps/ui",
                          "uuid",
                          "vuedraggable",
                          "panzoom",
                          "@shikijs/langs",
                          "libphonenumber-js",
                          "@nuxt/ui/locale",
                          "clsx",
                          "tailwind-merge",
                          "@tiptap/extension-color",
                          "@tiptap/extension-image",
                          "@tiptap/extension-link",
                          "@tiptap/extension-list-item",
                          "@tiptap/extension-placeholder",
                          "@tiptap/extension-text-style",
                          "@tiptap/extension-underline",
                      ]
                    : [],
            exclude: [],
            entries: [],
        },
        // 添加环境变量目录配置，指向项目根目录
        envDir: fileURLToPath(new URL("../../", import.meta.url)),
        build: {
            target: "esnext",
            minify: isProd && !isSSR,
            cssMinify: isProd && !isSSR,
            sourcemap: false,
        },
    },

    // 关闭 nuxt 数据收集工具
    telemetry: {
        enabled: false,
    },

    eslint: {
        config: {
            standalone: false,
            nuxt: {
                sortConfigKeys: true,
            },
        },
    },

    i18n: {
        strategy: "no_prefix",
        defaultLocale: "en",
        detectBrowserLanguage: {
            useCookie: true,
            cookieKey: "nuxt-ui-language",
            redirectOn: "root",
        },
        bundle: {
            optimizeTranslationDirective: false,
        },
    },

    icon: {
        serverBundle: "local",
        clientBundle: {
            scan: true,
            icons,
            sizeLimitKb: 10 * 1024,
        },
    },
    // // pwa,
});
