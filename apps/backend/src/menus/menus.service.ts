import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { menuItemsSchema, DEFAULT_MENUS, type MenuItemSchema, type MenuChildSchema } from '@acoustic/shared';
import * as fs from 'fs';
import * as path from 'path';

type MenuItem = MenuItemSchema;
type MenuChild = MenuChildSchema;

@Injectable()
export class MenusService {
  constructor(private prisma: PrismaService) {}

  async findOne(name: string) {
    let menu = await this.prisma.menu.findUnique({
      where: { name },
    });

    const defaultItems = DEFAULT_MENUS[name as keyof typeof DEFAULT_MENUS];
    const normalizedDefaults = defaultItems ? menuItemsSchema.parse(defaultItems) : [];

    if (!menu) {
      menu = await this.prisma.menu.create({
        data: { name, items: normalizedDefaults as any },
      });
      return menu;
    }

    const isItemsValid = Array.isArray(menu.items) && menuItemsSchema.safeParse(menu.items).success;
    if (!isItemsValid) {
      menu = await this.prisma.menu.update({
        where: { name },
        data: { items: normalizedDefaults as any },
      });
    }

    return menu;
  }

  /**
   * Update menu in database and sync to JSON file
   */
  async update(name: string, items: unknown) {
    const validatedItems = menuItemsSchema.parse(items);
    const menu = await this.prisma.menu.upsert({
      where: { name },
      update: { items: validatedItems as any },
      create: { name, items: validatedItems as any },
    });

    // Sync to JSON file if it's header menu
    if (name === 'header') {
      await this.syncMenuToJson(name, validatedItems);
    }

    return menu;
  }

  /**
   * Sync menu data to JSON file for frontend
   * Converts database format to JSON format (header.uz, header.ru)
   */
  private async syncMenuToJson(menuName: string, items: MenuItem[]): Promise<void> {
    try {
      // Get the correct path - handle both dev (apps/backend) and production (dist) cases
      let basePath = process.cwd();
      
      // If we're in apps/backend, go up two levels to root
      if (basePath.includes('apps/backend')) {
        basePath = path.join(basePath, '..', '..');
      }
      // If we're in dist, go up to root
      else if (basePath.includes('dist')) {
        basePath = path.join(basePath, '..', '..', '..');
      }
      
      const menuJsonPath = path.join(
        basePath,
        'apps',
        'frontend',
        'src',
        'data',
        'menu.json'
      );

      // Read existing menu.json
      let menuData: any = {};
      if (fs.existsSync(menuJsonPath)) {
        const existingContent = fs.readFileSync(menuJsonPath, 'utf-8');
        menuData = JSON.parse(existingContent);
      }

      // Convert database format to JSON format
      // Database format: [{ id, title_uz, title_ru, href, order, children }]
      // JSON format: { header: { uz: [...], ru: [...] } }
      const convertItem = (item: MenuItem): any => {
        const jsonItem: any = {
          id: item.id,
          title_uz: item.title_uz,
          title_ru: item.title_ru,
          href: item.href,
          order: item.order,
        };
        // Add children if they exist
        if (item.children && item.children.length > 0) {
          jsonItem.children = item.children.map((child) => ({
            id: child.id,
            title_uz: child.title_uz,
            title_ru: child.title_ru,
            href: child.href,
            order: child.order,
          }));
        }
        return jsonItem;
      };

      const uzItems = items.map(convertItem);
      const ruItems = items.map(convertItem);

      // Update menu.json
      menuData[menuName] = {
        uz: uzItems,
        ru: ruItems,
      };

      // Keep `catalog` section in sync with header -> menu-catalog children
      if (menuName === 'header') {
        const catalogItem = items.find((item) => item.id === 'menu-catalog');
        const catalogChildren = catalogItem?.children ?? [];
        menuData.catalog = {
          uz: catalogChildren.map((child: MenuChild) => ({
            href: child.href,
            label: child.title_uz,
          })),
          ru: catalogChildren.map((child: MenuChild) => ({
            href: child.href,
            label: child.title_ru,
          })),
        };
      }

      // Write to file with pretty formatting
      fs.writeFileSync(menuJsonPath, JSON.stringify(menuData, null, 2), 'utf-8');

      console.log(`✅ [MenusService] Synced ${menuName} menu to JSON file`);
    } catch (error) {
      // Log error but don't fail the update
      console.error(`❌ [MenusService] Failed to sync menu to JSON:`, error);
    }
  }
}

