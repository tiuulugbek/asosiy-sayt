// Direct import script for Signia products
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://acoustic_user:PAROL_ENV_DAN_OLINADI@localhost:5432/acousticwebdb',
    },
  },
});

async function importProducts() {
  const jsonFile = '/root/signia-products-import.json';
  const filterBrand = 'Signia';
  
  console.log(`📂 Reading JSON file: ${jsonFile}`);
  
  if (!fs.existsSync(jsonFile)) {
    throw new Error(`File not found: ${jsonFile}`);
  }
  
  const fileContent = fs.readFileSync(jsonFile, 'utf-8');
  const products = JSON.parse(fileContent);
  
  console.log(`📦 Found ${products.length} products in file`);
  console.log(`🔍 Filtering by brand: ${filterBrand}`);
  console.log('');
  
  let success = 0;
  let skipped = 0;
  let failed = 0;
  const errors = [];
  
  // Find Signia brand
  const brand = await prisma.brand.findFirst({
    where: {
      OR: [
        { name: { contains: filterBrand, mode: 'insensitive' } },
        { slug: { contains: filterBrand.toLowerCase().replace(/\s/g, '-'), mode: 'insensitive' } },
      ],
    },
  });
  
  if (!brand) {
    throw new Error(`Brand not found: ${filterBrand}`);
  }
  
  console.log(`✅ Brand found: ${brand.name} (ID: ${brand.id})`);
  console.log('');
  
  for (let i = 0; i < products.length; i++) {
    const productData = products[i];
    
    try {
      // Filter by brand
      if (productData.brandName && productData.brandName.toLowerCase() !== filterBrand.toLowerCase()) {
        skipped++;
        continue;
      }
      
      // Generate unique slug
      let slug = productData.slug || productData.name_uz.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').trim();
      let uniqueSlug = slug;
      let counter = 1;
      
      while (true) {
        const existing = await prisma.product.findUnique({
          where: { slug: uniqueSlug },
          select: { id: true },
        });
        
        if (!existing) {
          break;
        }
        
        uniqueSlug = `${slug}-${counter}`;
        counter++;
      }
      
      // Prepare product data
      const data = {
        name_uz: productData.name_uz,
        name_ru: productData.name_ru,
        slug: uniqueSlug,
        description_uz: productData.description_uz || null,
        description_ru: productData.description_ru || null,
        price: productData.price ? parseFloat(productData.price) : null,
        productType: productData.productType || 'hearing-aids',
        brandId: brand.id,
        intro_uz: productData.intro_uz || null,
        intro_ru: productData.intro_ru || null,
        features_uz: productData.features_uz || [],
        features_ru: productData.features_ru || [],
        benefits_uz: productData.benefits_uz || [],
        benefits_ru: productData.benefits_ru || [],
        tech_uz: productData.tech_uz || null,
        tech_ru: productData.tech_ru || null,
        specsText: productData.specsText || null,
        galleryUrls: productData.galleryUrls || [],
        audience: productData.audience || [],
        formFactors: productData.formFactors || [],
        signalProcessing: productData.signalProcessing || null,
        powerLevel: productData.powerLevel || null,
        hearingLossLevels: productData.hearingLossLevels || [],
        smartphoneCompatibility: productData.smartphoneCompatibility || [],
        paymentOptions: productData.paymentOptions || [],
        availabilityStatus: productData.availabilityStatus || null,
        tinnitusSupport: productData.tinnitusSupport ?? false,
        status: 'archived', // Signia mahsulotlari arxiv holatida
      };
      
      // Check if product exists
      const existing = await prisma.product.findUnique({
        where: { slug: uniqueSlug },
      });
      
      if (existing) {
        await prisma.product.update({
          where: { id: existing.id },
          data,
        });
        console.log(`✅ Updated [${i + 1}/${products.length}]: ${productData.name_uz}`);
      } else {
        await prisma.product.create({
          data,
        });
        console.log(`✅ Created [${i + 1}/${products.length}]: ${productData.name_uz}`);
      }
      
      success++;
    } catch (error) {
      failed++;
      const errorMessage = error.message || String(error);
      errors.push({
        index: i + 1,
        name: productData.name_uz || 'Unknown',
        error: errorMessage,
      });
      console.error(`❌ Failed [${i + 1}]: ${productData.name_uz} - ${errorMessage}`);
    }
  }
  
  console.log('');
  console.log('📊 Import Summary:');
  console.log(`   ✅ Success: ${success}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   ❌ Failed: ${failed}`);
  
  if (errors.length > 0) {
    console.log('');
    console.log('❌ Errors:');
    errors.slice(0, 10).forEach((err) => {
      console.log(`   [${err.index}] ${err.name}: ${err.error}`);
    });
    if (errors.length > 10) {
      console.log(`   ... and ${errors.length - 10} more errors`);
    }
  }
  
  return { success, skipped, failed, errors };
}

async function main() {
  try {
    await importProducts();
  } catch (error) {
    console.error('❌ Import failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}
