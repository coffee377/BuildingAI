import { Logger } from "@nestjs/common";
import fse from "fs-extra";
import * as path from "path";
import { DataSource, Repository } from "typeorm";
import { MenuItem } from "web/app/console/decorate/layout/types";

import { PageService } from "@/modules/console/decorate/services/page.service";
import { Menu } from "@/modules/console/menu/entities/menu.entity";
import { PermissionService } from "@/modules/console/permission/permission.service";

/**
 * 版本 1.0.0-beta.4 升级逻辑
 */
export class Upgrade {
    private readonly logger = new Logger(Upgrade.name);
    private menuRepository: Repository<Menu>;
    private permissionService: PermissionService;
    private pageService: PageService;

    constructor(
        dataSource: DataSource,
        permissionService: PermissionService,
        pageService: PageService,
    ) {
        this.menuRepository = dataSource.getRepository(Menu);
        this.permissionService = permissionService;
        this.pageService = pageService;
    }

    /**
     * 执行升级逻辑
     */
    async execute(): Promise<void> {
        this.logger.debug("开始执行 1.0.0-beta.4 版本升级逻辑");

        try {
            // 1. 升级前台菜单配置
            await this.upgradeHomeMenus();

            this.logger.log("✅ 1.0.0-beta.4 版本升级逻辑执行完成");
        } catch (error) {
            this.logger.error(`❌ 1.0.0-beta.4 版本升级逻辑执行失败: ${error.message}`);
            throw error;
        }
    }

    /**
     * 升级前台菜单配置
     */
    private async upgradeHomeMenus(): Promise<void> {
        this.logger.debug("开始升级前台菜单配置...");

        try {
            // 查找升级前台菜单配置文件
            const homeMenuPath = this.getUpgradeHomeMenuFilePath("1.0.0-beta.4");
            if (!homeMenuPath) {
                this.logger.warn(
                    "未找到版本 1.0.0-beta.4 的升级前台菜单配置文件，跳过前台菜单升级",
                );
                return;
            }

            // 读取升级前台菜单配置
            const homeMenus = await fse.readJson(homeMenuPath);
            if (!Array.isArray(homeMenus)) {
                throw new Error("升级前台菜单配置格式不正确，应为数组格式");
            }

            this.logger.log(`读取到 ${homeMenus.length} 个升级前台菜单项`);

            // 更新或创建前台菜单配置（增量更新）
            try {
                // 先查找是否已存在 web 页面配置
                const existingPage = await this.pageService.findOne({
                    where: { name: "web" },
                });

                if (existingPage && existingPage.data) {
                    // 如果存在，进行增量更新且查重
                    const existingData = existingPage.data as any;
                    let existingMenus = existingData.menus || [];

                    // 获取现有菜单的ID集合
                    const existingMenuIds = new Set(existingMenus.map((menu: any) => menu.id));

                    const agentMenuItem = existingMenus.find((item) => item.title == "智能体");
                    // 隐藏智能体菜单
                    if (agentMenuItem) agentMenuItem.hidden = true;
                    existingMenus = existingMenus.filter((item) => item.title != "智能体");
                    existingMenus.push(agentMenuItem);

                    // 过滤出不重复的新菜单项
                    const newMenus = homeMenus.filter((menu: any) => !existingMenuIds.has(menu.id));

                    if (newMenus.length) {
                        // 合并菜单：现有菜单 + 新增菜单
                        const mergedMenus: MenuItem[] = [...existingMenus, ...newMenus];

                        const updatedData = {
                            ...existingData,
                            menus: mergedMenus,
                            layout: existingData.layout || "layout-5", // 保持现有布局或使用默认值
                        };
                        this.logger.log(JSON.stringify(updatedData));

                        await this.pageService.updateById(existingPage.id, {
                            data: updatedData,
                        });
                        this.logger.log(
                            `增量更新前台菜单配置成功，新增 ${newMenus.length} 个菜单项`,
                        );
                    } else {
                        this.logger.log("所有菜单项已存在，跳过更新");
                    }
                } else {
                    // 如果不存在，创建新的配置
                    const homeMenuData = {
                        menus: homeMenus,
                        layout: "layout-5",
                    };

                    await this.pageService.create({
                        name: "web",
                        data: homeMenuData,
                    });
                    this.logger.log(`创建前台菜单配置成功，包含 ${homeMenus.length} 个菜单项`);
                }
            } catch (error) {
                throw new Error(`前台菜单配置操作失败: ${error.message}`);
            }

            this.logger.log("✅ 前台菜单配置升级完成");
        } catch (error) {
            this.logger.error(`❌ 前台菜单配置升级失败: ${error.message}`);
            throw error;
        }
    }

    /**
     * 获取升级前台菜单配置文件路径
     */
    private getUpgradeHomeMenuFilePath(version: string): string | null {
        const possiblePaths = [
            path.join(process.cwd(), `data/upgrade/${version}/home-menu.json`), // 在 apps/server 目录下运行
            path.join(process.cwd(), `apps/server/data/upgrade/${version}/home-menu.json`), // 在项目根目录下运行
            path.join(__dirname, `../../../data/upgrade/${version}/home-menu.json`), // 编译后的路径
        ];

        for (const possiblePath of possiblePaths) {
            if (fse.pathExistsSync(possiblePath)) {
                this.logger.log(`找到升级前台菜单配置文件: ${possiblePath}`);
                return possiblePath;
            }
        }

        this.logger.log(
            `未找到版本 ${version} 的升级前台菜单配置文件，检查路径: ${possiblePaths.join(", ")}`,
        );
        return null;
    }
}
