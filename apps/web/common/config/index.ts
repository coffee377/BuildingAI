/**
 * 应用全局配置
 */
const AppConfig = {
    // 应用名称
    APP_NAME: "FreeBuildAI",

    // 应用版本
    VERSION: "1.0.0",

    // 请求基础路径
    BASE_API: import.meta.env.VITE_APP_BASE_URL,

    // 前台接口基础前缀
    WEB_API_PREFIX: import.meta.env.VITE_APP_WEB_API_PREFIX,

    // 后台接口基础前缀
    CONSOLE_API_PREFIX: import.meta.env.VITE_APP_CONSOLE_API_PREFIX,

    // 请求超时时间（毫秒）
    TIMEOUT: 60 * 1000,

    // R2R接口基础前缀
    R2R_API_PREFIX: import.meta.env.VITE_APP_R2R_API_PREFIX,
    // 文件转换接口前缀
    FILE_CONVERSION_API_PREFIX: import.meta.env.VITE_APP_FILE_CONVERSION_API_PREFIX,
};

export default AppConfig;
