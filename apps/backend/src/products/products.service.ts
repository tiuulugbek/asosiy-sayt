import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { productSchema } from '@acoustic/shared';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import * as XLSX from 'xlsx';

const UPLOADS_ORIGIN = 'https://a.acoustic.uz';

function normalizeImageUrl(url: string): string {
  if (!url || typeof url !== 'string') return url;
  const u = url.trim();
  const pathMatch = u.match(/\/uploads\/[^?#]*/);
  if (pathMatch) return `${UPLOADS_ORIGIN}${pathMatch[0]}`;
  if (u.startsWith('uploads/')) return `${UPLOADS_ORIGIN}/${u}`;
  if (u.includes('acoustic.uz') && !u.includes('a.acoustic.uz')) {
    return u.replace(/https?:\/\/[^\/]*acoustic\.uz/g, UPLOADS_ORIGIN);
  }
  return u;
}

function normalizeProductUrls(product: any): any {
  if (!product) return product;
  const out = { ...product };
  if (Array.isArray(out.galleryUrls)) {
    out.galleryUrls = out.galleryUrls.map((u: string) => normalizeImageUrl(u));
  }
  if (out.brand?.logo?.url) {
    out.brand = { ...out.brand, logo: { ...out.brand.logo, url: normalizeImageUrl(out.brand.logo.url) } };
  }
  return out;
}

function getProductRevalidationPaths(product?: { slug?: string | null; catalogs?: Array<{ slug?: string | null }> | null }): string[] {
  const paths = new Set(['/catalog', '/ramazon-chegirmasi']);

  if (product?.slug) {
    paths.add(`/products/${product.slug}`);
  }

  product?.catalogs?.forEach((catalog) => {
    if (catalog.slug) {
      paths.add(`/catalog/${catalog.slug}`);
    }
  });

  return Array.from(paths);
}

function normalizeDiscountFields(discountPercent?: number | null, originalPrice?: number | null) {
  const activeDiscount = typeof discountPercent === 'number' && discountPercent > 0;

  return {
    discountPercent: activeDiscount ? discountPercent : null,
    originalPrice: activeDiscount ? originalPrice ?? null : null,
  };
}

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  private parseProductInput(data: unknown, partial = false) {
    try {
      return partial ? productSchema.partial().parse(data) : productSchema.parse(data);
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.errors
          .map((e) => `${e.path.length ? e.path.join('.') + ': ' : ''}${e.message}`)
          .join('; ');
        throw new BadRequestException(details || 'Ma\'lumotlar noto\'g\'ri');
      }
      throw error;
    }
  }

  private async revalidateProductPages(product?: { slug?: string | null; catalogs?: Array<{ slug?: string | null }> | null }) {
    try {
      const endpoint = process.env.FRONTEND_REVALIDATE_URL || 'https://acoustic.uz/api/revalidate';
      const secret = process.env.REVALIDATE_SECRET || process.env.FRONTEND_REVALIDATE_SECRET;

      await Promise.allSettled(
        getProductRevalidationPaths(product).map((path) => {
          const url = new URL(endpoint);
          url.searchParams.set('path', path);
          if (secret) url.searchParams.set('secret', secret);

          return fetch(url, { method: 'POST' });
        }),
      );
    } catch (error) {
      console.warn('[products] Failed to revalidate product pages:', error);
    }
  }

  async findAll(filters?: {
    status?: string;
    brandId?: string;
    catalogId?: string;
    productType?: string;
    search?: string;
    audience?: string;
    formFactor?: string;
    signalProcessing?: string;
    powerLevel?: string;
    hearingLossLevel?: string;
    smartphoneCompatibility?: string;
    paymentOption?: string;
    availabilityStatus?: string;
    discount?: boolean; // true = faqat chegirmali mahsulotlar
    limit?: number;
    offset?: number;
    sort?: 'newest' | 'price_asc' | 'price_desc';
  }) {
    const where: Prisma.ProductWhereInput = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.discount === true) where.discountPercent = { gt: 0 };
    if (filters?.brandId) where.brandId = filters.brandId;
    if (filters?.productType) where.productType = filters.productType;
    if (filters?.catalogId) {
      where.catalogs = {
        some: {
          id: filters.catalogId,
        },
      };
    }
    if (filters?.search) {
      where.OR = [
        { name_uz: { contains: filters.search, mode: 'insensitive' } },
        { name_ru: { contains: filters.search, mode: 'insensitive' } },
        { description_uz: { contains: filters.search, mode: 'insensitive' } },
        { description_ru: { contains: filters.search, mode: 'insensitive' } },
        { specsText: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    if (filters?.audience) where.audience = { has: filters.audience };
    if (filters?.formFactor) where.formFactors = { has: filters.formFactor };
    if (filters?.signalProcessing) where.signalProcessing = filters.signalProcessing;
    if (filters?.powerLevel) where.powerLevel = filters.powerLevel;
    if (filters?.hearingLossLevel) where.hearingLossLevels = { has: filters.hearingLossLevel };
    if (filters?.smartphoneCompatibility)
      where.smartphoneCompatibility = { has: filters.smartphoneCompatibility };
    if (filters?.paymentOption) where.paymentOptions = { has: filters.paymentOption };
    if (filters?.availabilityStatus) where.availabilityStatus = filters.availabilityStatus;

    // Pagination defaults
    const limit = filters?.limit ?? 12;
    const offset = filters?.offset ?? 0;
    const sort = filters?.sort ?? 'newest';

    // Build orderBy based on sort parameter
    let orderBy: Prisma.ProductOrderByWithRelationInput;
    switch (sort) {
      case 'price_asc':
        orderBy = { price: 'asc' };
        break;
      case 'price_desc':
        orderBy = { price: 'desc' };
        break;
      case 'newest':
      default:
        orderBy = { createdAt: 'desc' };
        break;
    }

    // Get total count for pagination metadata
    const total = await this.prisma.product.count({ where });

    // Fetch paginated products
    let items = await this.prisma.product.findMany({
      where,
      include: { brand: true, catalogs: true },
      orderBy,
      take: limit,
      skip: offset,
    });


    // Populate galleryUrls from galleryIds
    const itemsWithUrls = await Promise.all(
      items.map(async (item) => {
        if (item.galleryIds && item.galleryIds.length > 0) {
          const mediaItems = await this.prisma.media.findMany({
            where: { id: { in: item.galleryIds } },
            select: { id: true, url: true },
          });
          const urlMap = new Map(mediaItems.map((m) => [m.id, m.url]));
          const galleryUrls = item.galleryIds
            .map((id) => urlMap.get(id))
            .filter((url): url is string => url !== undefined);
          
          return {
            ...item,
            galleryUrls: galleryUrls.length > 0 ? galleryUrls : (item.galleryUrls || []),
          };
        }
        return {
          ...item,
          galleryUrls: item.galleryUrls || [],
        };
      })
    );
    items = itemsWithUrls.map((item) => normalizeProductUrls(item));
    const pageSize = limit;
    const page = Math.floor(offset / pageSize) + 1;

    return {
      items,
      total,
      page,
      pageSize,
    };
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { brand: true, catalogs: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return normalizeProductUrls(product);
  }

  async findBySlug(slug: string) {
    let product = await this.prisma.product.findUnique({
      where: { slug, status: 'published' },
      include: { brand: true, catalogs: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.galleryIds && product.galleryIds.length > 0) {
      const mediaItems = await this.prisma.media.findMany({
        where: { id: { in: product.galleryIds } },
        select: { id: true, url: true },
      });
      const urlMap = new Map(mediaItems.map((m) => [m.id, m.url]));
      const galleryUrls = product.galleryIds
        .map((id) => urlMap.get(id))
        .filter((url): url is string => url !== undefined);
      product = { ...product, galleryUrls: galleryUrls.length > 0 ? galleryUrls : (product.galleryUrls || []) };
    }

    const relatedProducts = product.relatedProductIds.length
      ? await this.prisma.product.findMany({
          where: { id: { in: product.relatedProductIds }, status: 'published' },
          include: { brand: true, catalogs: true },
        })
      : [];

    const usefulArticles = product.usefulArticleSlugs.length
      ? await this.prisma.post.findMany({
          where: { slug: { in: product.usefulArticleSlugs }, status: 'published' },
          select: {
            id: true,
            title_uz: true,
            title_ru: true,
            slug: true,
            excerpt_uz: true,
            excerpt_ru: true,
          },
        })
      : [];

    return {
      ...normalizeProductUrls(product),
      relatedProducts: relatedProducts.map((p) => normalizeProductUrls(p)),
      usefulArticles,
    };
  }

  async generateUniqueSlug(baseSlug: string): Promise<string> {
    let slug = baseSlug;
    let counter = 1;
    
    // Check if slug exists and generate unique one
    while (true) {
      const existing = await this.prisma.product.findUnique({
        where: { slug },
        select: { id: true },
      });
      
      if (!existing) {
        return slug;
      }
      
      // Slug exists, append counter
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  }

  async create(data: unknown) {
    const validated = this.parseProductInput(data);

    const uniqueSlug = await this.generateUniqueSlug(validated.slug);

    const catalogIds = validated.catalogIds ?? [];
    
    const discountFields = normalizeDiscountFields(validated.discountPercent, validated.originalPrice);

    const createData: Prisma.ProductCreateInput = {
      name_uz: validated.name_uz,
      name_ru: validated.name_ru,
      slug: uniqueSlug,
      description_uz: validated.description_uz ?? null,
      description_ru: validated.description_ru ?? null,
      price: validated.price ?? undefined,
      stock: validated.stock ?? undefined,
      brand: validated.brandId 
        ? { connect: { id: validated.brandId } }
        : undefined,
      catalogs: catalogIds.length > 0 
        ? { connect: catalogIds.map(id => ({ id })) }
        : undefined,
      specsText: validated.specsText ?? null,
      galleryIds: validated.galleryIds ?? [],
      audience: validated.audience ?? [],
      formFactors: validated.formFactors ?? [],
      signalProcessing: validated.signalProcessing ?? undefined,
      powerLevel: validated.powerLevel ?? undefined,
      hearingLossLevels: validated.hearingLossLevels ?? [],
      smartphoneCompatibility: validated.smartphoneCompatibility ?? [],
      tinnitusSupport:
        validated.tinnitusSupport === undefined ? undefined : validated.tinnitusSupport ?? false,
      paymentOptions: validated.paymentOptions ?? [],
      availabilityStatus: validated.availabilityStatus ?? undefined,
      intro_uz: validated.intro_uz ?? null,
      intro_ru: validated.intro_ru ?? null,
      features_uz: validated.features_uz ?? [],
      features_ru: validated.features_ru ?? [],
      benefits_uz: validated.benefits_uz ?? [],
      benefits_ru: validated.benefits_ru ?? [],
      tech_uz: validated.tech_uz ?? null,
      tech_ru: validated.tech_ru ?? null,
      fittingRange_uz: validated.fittingRange_uz ?? null,
      fittingRange_ru: validated.fittingRange_ru ?? null,
      regulatoryNote_uz: validated.regulatoryNote_uz ?? null,
      regulatoryNote_ru: validated.regulatoryNote_ru ?? null,
      galleryUrls: validated.galleryUrls ?? [],
      relatedProductIds: validated.relatedProductIds ?? [],
      usefulArticleSlugs: validated.usefulArticleSlugs ?? [],
      discountPercent: discountFields.discountPercent,
      originalPrice: discountFields.originalPrice,
      status: validated.status ?? 'published',
    };
    
    try {
      const product = await this.prisma.product.create({
        data: createData,
        include: { brand: true, catalogs: true },
      });

      void this.revalidateProductPages(product);
      return product;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new BadRequestException('Bu slug allaqachon mavjud. Boshqa slug tanlang.');
      }
      throw error;
    }
  }

  async update(id: string, data: unknown) {
    const validated = this.parseProductInput(data, true);
    const updateData: Prisma.ProductUpdateInput = {};

    if (validated.name_uz !== undefined) updateData.name_uz = validated.name_uz;
    if (validated.name_ru !== undefined) updateData.name_ru = validated.name_ru;
    if (validated.slug !== undefined) updateData.slug = validated.slug;
    if (validated.description_uz !== undefined) updateData.description_uz = validated.description_uz ?? null;
    if (validated.description_ru !== undefined) updateData.description_ru = validated.description_ru ?? null;
    if (validated.price !== undefined) updateData.price = validated.price ?? null;
    if (validated.stock !== undefined) updateData.stock = validated.stock ?? null;
    if (validated.brandId !== undefined) {
      updateData.brand = validated.brandId 
        ? { connect: { id: validated.brandId } }
        : { disconnect: true };
    }
    if (validated.status !== undefined) updateData.status = validated.status;
    if (validated.specsText !== undefined) {
      updateData.specsText = validated.specsText ?? null;
    }
    if (validated.galleryIds !== undefined) {
      updateData.galleryIds = { set: validated.galleryIds };
    }
    if (validated.audience !== undefined) {
      updateData.audience = { set: validated.audience };
    }
    if (validated.formFactors !== undefined) {
      updateData.formFactors = { set: validated.formFactors };
    }
    if (validated.signalProcessing !== undefined) {
      updateData.signalProcessing = validated.signalProcessing ?? null;
    }
    if (validated.powerLevel !== undefined) {
      updateData.powerLevel = validated.powerLevel ?? null;
    }
    if (validated.hearingLossLevels !== undefined) {
      updateData.hearingLossLevels = { set: validated.hearingLossLevels };
    }
    if (validated.smartphoneCompatibility !== undefined) {
      updateData.smartphoneCompatibility = { set: validated.smartphoneCompatibility };
    }
    if (validated.tinnitusSupport !== undefined) {
      updateData.tinnitusSupport = validated.tinnitusSupport ?? false;
    }
    if (validated.paymentOptions !== undefined) {
      updateData.paymentOptions = { set: validated.paymentOptions };
    }
    if (validated.availabilityStatus !== undefined) {
      updateData.availabilityStatus = validated.availabilityStatus ?? null;
    }
    if (validated.productType !== undefined) {
      updateData.productType = validated.productType ?? null;
    }
    if (validated.intro_uz !== undefined) updateData.intro_uz = validated.intro_uz ?? null;
    if (validated.intro_ru !== undefined) updateData.intro_ru = validated.intro_ru ?? null;
    if (validated.features_uz !== undefined) {
      updateData.features_uz = { set: validated.features_uz };
    }
    if (validated.features_ru !== undefined) {
      updateData.features_ru = { set: validated.features_ru };
    }
    if (validated.benefits_uz !== undefined) {
      updateData.benefits_uz = { set: validated.benefits_uz };
    }
    if (validated.benefits_ru !== undefined) {
      updateData.benefits_ru = { set: validated.benefits_ru };
    }
    if (validated.tech_uz !== undefined) updateData.tech_uz = validated.tech_uz ?? null;
    if (validated.tech_ru !== undefined) updateData.tech_ru = validated.tech_ru ?? null;
    if (validated.fittingRange_uz !== undefined) updateData.fittingRange_uz = validated.fittingRange_uz ?? null;
    if (validated.fittingRange_ru !== undefined) updateData.fittingRange_ru = validated.fittingRange_ru ?? null;
    if (validated.regulatoryNote_uz !== undefined) updateData.regulatoryNote_uz = validated.regulatoryNote_uz ?? null;
    if (validated.regulatoryNote_ru !== undefined) updateData.regulatoryNote_ru = validated.regulatoryNote_ru ?? null;
    if (validated.galleryUrls !== undefined) {
      updateData.galleryUrls = { set: validated.galleryUrls };
    }
    if (validated.discountPercent !== undefined) {
      const discountFields = normalizeDiscountFields(validated.discountPercent, validated.originalPrice);
      updateData.discountPercent = discountFields.discountPercent;
      updateData.originalPrice = discountFields.originalPrice;
    } else if (validated.originalPrice !== undefined) {
      updateData.originalPrice = validated.originalPrice ?? null;
    }
    if (validated.relatedProductIds !== undefined) {
      updateData.relatedProductIds = { set: validated.relatedProductIds };
    }
    if (validated.usefulArticleSlugs !== undefined) {
      updateData.usefulArticleSlugs = { set: validated.usefulArticleSlugs };
    }
    
    // Handle catalogIds for many-to-many relationship
    if (validated.catalogIds !== undefined) {
      updateData.catalogs = {
        set: validated.catalogIds.map(id => ({ id }))
      };
    }

    try {
      const product = await this.prisma.product.update({
        where: { id },
        data: updateData,
        include: { brand: true, catalogs: true },
      });

      void this.revalidateProductPages(product);
      return product;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new BadRequestException('Bu slug allaqachon mavjud. Boshqa slug tanlang.');
      }
      throw error;
    }
  }

  async delete(id: string) {
    const product = await this.prisma.product.delete({
      where: { id },
      include: { catalogs: true },
    });

    void this.revalidateProductPages(product);
    return product;
  }

  async importFromExcel(fileBuffer: Buffer): Promise<{
    success: number;
    failed: number;
    errors: Array<{ row: number; error: string }>;
  }> {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { raw: false });

    if (!data || data.length === 0) {
      throw new BadRequestException('Excel fayli bo\'sh');
    }

    const errors: Array<{ row: number; error: string }> = [];
    let success = 0;
    let failed = 0;

    // Process each row (starting from row 2, as row 1 is headers)
    for (let i = 0; i < data.length; i++) {
      const row = data[i] as Record<string, any>;
      const rowNumber = i + 2; // +2 because Excel rows start at 1 and we skip header

      try {
        // Helper function to parse array fields (comma-separated)
        const parseArray = (value: any): string[] => {
          if (!value) return [];
          if (Array.isArray(value)) return value;
          if (typeof value === 'string') {
            return value.split(',').map((s) => s.trim()).filter(Boolean);
          }
          return [];
        };

        // Helper function to parse boolean
        const parseBoolean = (value: any): boolean | undefined => {
          if (value === undefined || value === null || value === '') return undefined;
          if (typeof value === 'boolean') return value;
          if (typeof value === 'string') {
            const lower = value.toLowerCase().trim();
            if (lower === 'true' || lower === 'yes' || lower === 'да' || lower === 'ha') return true;
            if (lower === 'false' || lower === 'no' || lower === 'нет' || lower === 'yo\'q') return false;
          }
          return undefined;
        };

        // Helper function to generate slug from name
        const generateSlug = (name: string): string => {
          return name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
        };

        // Map Excel columns to product fields
        // Column names can be in UZ or RU, so we check both
        const productData: any = {
          name_uz: row['name_uz'] || row['Название (uz)'] || row['Nomi (uz)'] || '',
          name_ru: row['name_ru'] || row['Название (ru)'] || row['Nomi (ru)'] || '',
          slug: row['slug'] || generateSlug(row['name_uz'] || row['Название (uz)'] || row['Nomi (uz)'] || `product-${i}`),
          description_uz: row['description_uz'] || row['Описание (uz)'] || row['Tavsif (uz)'] || null,
          description_ru: row['description_ru'] || row['Описание (ru)'] || row['Tavsif (ru)'] || null,
          price: row['price'] || row['Цена'] || row['Narx'] ? String(row['price'] || row['Цена'] || row['Narx']).replace(/\s/g, '') : null,
          stock: row['stock'] || row['Склад'] || row['Ombor'] ? parseInt(String(row['stock'] || row['Склад'] || row['Ombor']), 10) : undefined,
          status: row['status'] || row['Статус'] || row['Holat'] || 'published',
          brandId: row['brandId'] || row['brand_id'] || null,
          brandName: row['brandName'] || row['brand_name'] || row['Бренд'] || row['Brend'] || null,
          catalogIds: row['catalogIds'] || row['catalog_ids'] || null,
          catalogSlugs: row['catalogSlugs'] || row['catalog_slugs'] || null,
          audience: parseArray(row['audience'] || row['Аудитория'] || row['Auditoriya']),
          formFactors: parseArray(row['formFactors'] || row['form_factors'] || row['Тип корпуса'] || row['Korpus turi']),
          hearingLossLevels: parseArray(row['hearingLossLevels'] || row['hearing_loss_levels'] || row['Степень потери'] || row['Eshitish darajasi']),
          smartphoneCompatibility: parseArray(row['smartphoneCompatibility'] || row['smartphone_compatibility'] || row['Смартфон'] || row['Smartfon']),
          paymentOptions: parseArray(row['paymentOptions'] || row['payment_options'] || row['Способы оплаты'] || row['To\'lov usullari']),
          signalProcessing: row['signalProcessing'] || row['signal_processing'] || row['Обработка сигнала'] || row['Signalni qayta ishlash'] || null,
          powerLevel: row['powerLevel'] || row['power_level'] || row['Мощность'] || row['Quvvat'] || null,
          tinnitusSupport: parseBoolean(row['tinnitusSupport'] || row['tinnitus_support'] || row['Тиннитус'] || row['Tinnitus']),
          availabilityStatus: row['availabilityStatus'] || row['availability_status'] || row['Наличие'] || row['Mavjudlik'] || null,
          specsText: row['specsText'] || row['specs_text'] || row['Характеристики'] || row['Xususiyatlar'] || null,
          intro_uz: row['intro_uz'] || row['Введение (uz)'] || row['Kirish (uz)'] || null,
          intro_ru: row['intro_ru'] || row['Введение (ru)'] || row['Kirish (ru)'] || null,
          tech_uz: row['tech_uz'] || row['Технологии (uz)'] || row['Texnologiyalar (uz)'] || null,
          tech_ru: row['tech_ru'] || row['Технологии (ru)'] || row['Texnologiyalar (ru)'] || null,
          features_uz: parseArray(row['features_uz'] || row['Особенности (uz)'] || row['Afzalliklar (uz)']),
          features_ru: parseArray(row['features_ru'] || row['Особенности (ru)'] || row['Afzalliklar (ru)']),
          benefits_uz: parseArray(row['benefits_uz'] || row['Преимущества (uz)'] || row['Foydalar (uz)']),
          benefits_ru: parseArray(row['benefits_ru'] || row['Преимущества (ru)'] || row['Foydalar (ru)']),
          galleryUrls: parseArray(row['galleryUrls'] || row['gallery_urls'] || row['Галерея'] || row['Galereya']),
          relatedProductIds: parseArray(row['relatedProductIds'] || row['related_product_ids'] || row['Связанные товары'] || row['Bog\'liq mahsulotlar']),
          usefulArticleSlugs: parseArray(row['usefulArticleSlugs'] || row['useful_article_slugs'] || row['Полезные статьи'] || row['Foydali maqolalar']),
        };

        // Validate required fields
        if (!productData.name_uz || !productData.name_ru) {
          throw new Error('name_uz va name_ru maydonlari majburiy. Iltimos, mahsulot nomini o\'zbek va rus tillarida kiriting.');
        }

        // Lookup brand if brandName provided
        if (productData.brandName && !productData.brandId) {
          const brand = await this.prisma.brand.findFirst({
            where: {
              OR: [
                { name: { contains: productData.brandName, mode: 'insensitive' } },
                { slug: { contains: productData.brandName.toLowerCase().replace(/\s/g, '-'), mode: 'insensitive' } },
              ],
            },
          });
          if (brand) {
            productData.brandId = brand.id;
          }
        }

        // Lookup catalogs if catalogSlugs provided
        if (productData.catalogSlugs && !productData.catalogIds) {
          const slugs = parseArray(productData.catalogSlugs);
          const catalogs = await this.prisma.catalog.findMany({
            where: {
              slug: { in: slugs },
            },
          });
          if (catalogs.length > 0) {
            productData.catalogIds = catalogs.map((c) => c.id);
          }
        } else if (productData.catalogIds) {
          productData.catalogIds = parseArray(productData.catalogIds);
        }

        // Remove helper fields
        delete productData.brandName;
        delete productData.catalogSlugs;

        // Validate and create product
        await this.create(productData);
        success++;
      } catch (error: any) {
        failed++;
        let errorMessage = error.message || String(error);
        // Make error messages more user-friendly
        if (errorMessage.includes('name_uz va name_ru')) {
          errorMessage = 'Mahsulot nomi (o\'zbek va rus tillarida) majburiy';
        } else if (errorMessage.includes('Unique constraint')) {
          errorMessage = 'Bu slug yoki nom allaqachon mavjud. Boshqa nom yoki slug kiriting.';
        } else if (errorMessage.includes('Invalid')) {
          errorMessage = 'Noto\'g\'ri ma\'lumot formati. Iltimos, shablonni tekshiring.';
        }
        errors.push({ row: rowNumber, error: errorMessage });
      }
    }

    return { success, failed, errors };
  }

  generateExcelTemplate(): Buffer {
    const XLSX = require('xlsx');
    
    // Create workbook
    const workbook = XLSX.utils.book_new();
    
    // Simplified headers - only essential fields
    const headers = [
      'name_uz',
      'name_ru',
      'slug',
      'price',
      'stock',
      'status',
      'brandName',
      'catalogSlugs',
      'audience',
      'formFactors',
      'availabilityStatus',
      'description_uz',
      'description_ru',
    ];
    
    // Simple example rows
    const exampleRows = [
      {
        name_uz: 'Oticon More 1',
        name_ru: 'Oticon More 1',
        slug: 'oticon-more-1',
        price: '15000000',
        stock: '5',
        status: 'published',
        brandName: 'Oticon',
        categorySlug: '',
        catalogSlugs: 'for-children',
        audience: 'children,adults',
        formFactors: 'bte',
        availabilityStatus: 'in-stock',
        description_uz: 'Zamonaviy eshitish apparati bolalar uchun',
        description_ru: 'Современный слуховой аппарат для детей',
      },
      {
        name_uz: 'Phonak Audéo Lumity',
        name_ru: 'Phonak Audéo Lumity',
        slug: 'phonak-audeo-lumity',
        price: '17500000',
        stock: '3',
        status: 'published',
        brandName: 'Phonak',
        categorySlug: '',
        catalogSlugs: 'for-elderly',
        audience: 'elderly',
        formFactors: 'bte',
        availabilityStatus: 'in-stock',
        description_uz: 'Keksalar uchun qulay apparat',
        description_ru: 'Удобный аппарат для пожилых',
      },
    ];
    
    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(exampleRows, { header: headers });
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');
    
    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    return buffer;
  }
}

