/**
 * AI Operator bot akkaunti + API token yaratish.
 * Ishga tushirish: pnpm exec ts-node --transpile-only scripts/setup-ai-operator.ts
 */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

const BOT_EMAIL = process.env.AI_OPERATOR_EMAIL || 'ai-operator@acoustic.uz';
const BOT_NAME = 'AI Operator Bot';

async function main() {
  let editorRole = await prisma.role.findUnique({ where: { name: 'editor' } });
  if (!editorRole) {
    editorRole = await prisma.role.create({
      data: {
        name: 'editor',
        permissions: ['content.*', 'media.*', 'leads.read', 'reviews.read'],
      },
    });
  }

  const apiToken = crypto.randomBytes(32).toString('hex');
  const apiTokenHash = await bcrypt.hash(apiToken, 10);
  const password = crypto.randomBytes(16).toString('hex');
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email: BOT_EMAIL },
    create: {
      email: BOT_EMAIL,
      password: passwordHash,
      fullName: BOT_NAME,
      roleId: editorRole.id,
      apiTokenHash,
      isActive: true,
      mustChangePassword: false,
    },
    update: {
      fullName: BOT_NAME,
      roleId: editorRole.id,
      apiTokenHash,
      isActive: true,
    },
  });

  const defaultCategory = await prisma.postCategory.findFirst({
    where: { slug: 'eshitish-muammolari', status: 'published' },
  });

  const webhookSecret = crypto.randomBytes(16).toString('hex');

  const envBlock = `# === Personal AI Operator → acoustic.uz ===
# Yaratilgan: ${new Date().toISOString()}
ACOUSTIC_API_BASE_URL=https://a.acoustic.uz/api
ACOUSTIC_PUBLIC_BASE_URL=https://acoustic.uz
ACOUSTIC_API_TOKEN=${apiToken}
ACOUSTIC_DEFAULT_CATEGORY_SLUG=${defaultCategory?.slug || 'eshitish-muammolari'}
ACOUSTIC_DEFAULT_CATEGORY_ID=${defaultCategory?.id || ''}
ACOUSTIC_WEBHOOK_SECRET=${webhookSecret}
# OPERATOR_WEBHOOK_URL=https://your-operator-host/api/v1/integrations/n8n/trigger

# Docker ichida (bir xil host):
# ACOUSTIC_API_BASE_URL=http://host.docker.internal:3001/api

# Bot akkaunt (faqat zaxira — API token ishlating):
# ACOUSTIC_BOT_EMAIL=${BOT_EMAIL}
# ACOUSTIC_BOT_PASSWORD=${password}
`;

  const outPath = path.join(__dirname, '..', 'apps', 'backend', '.env.ai-operator');
  fs.writeFileSync(outPath, envBlock, { mode: 0o600 });
  console.log('✅ AI Operator akkaunt tayyor');
  console.log(`   User ID: ${user.id}`);
  console.log(`   Email:   ${BOT_EMAIL}`);
  console.log(`   Env:     ${outPath}`);
  console.log('');
  console.log(envBlock);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
