import type { Metadata } from 'next';
import { getPageBySlug, getPosts, getPostCategories, getBranches, getSettings } from '@/lib/api-server';
import { detectLocale } from '@/lib/locale-server';
import { getBilingualText } from '@/lib/locale';
import PageHeader from '@/components/page-header';
import PostsListPaginated from '@/components/posts-list-paginated';
import CategoryGrid from '@/components/category-grid';
import NearbyBranches from '@/components/nearby-branches';
import Link from 'next/link';
import { MapPin, Phone } from 'lucide-react';
import { normalizeImageUrl } from '@/lib/image-utils';
import Image from 'next/image';

// Force dynamic rendering to always fetch fresh data from admin
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const locale = detectLocale();
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://acoustic.uz';
  const pageUrl = `${baseUrl}/patients`;
  const title =
    locale === 'ru'
      ? 'Информация для пациентов'
      : 'Bemorlar uchun ma\'lumotlar';
  const description =
    locale === 'ru'
      ? 'Полезные статьи и информация для пациентов о слухе.'
      : 'Bemorlar uchun foydali maqolalar, eshitish haqida ma\'lumotlar.';

  return {
    title: `${title} — Acoustic.uz`,
    description,
    alternates: {
      canonical: pageUrl,
      languages: { uz: pageUrl, ru: pageUrl, 'x-default': pageUrl },
    },
    openGraph: {
      title: `${title} — Acoustic.uz`,
      description,
      url: pageUrl,
      siteName: 'Acoustic.uz',
      locale: locale === 'ru' ? 'ru_RU' : 'uz_UZ',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} — Acoustic.uz`,
      description,
    },
  };
}

export default async function PatientsPage() {
  const locale = detectLocale();
  const [page, categories, branches, settings] = await Promise.all([
    getPageBySlug('patients', locale),
    getPostCategories(locale, 'patients'),
    getBranches(locale),
    getSettings(locale),
  ]);
  
  // Get posts ONLY from categories in this section
  // Each section shows only posts that belong to its own categories
  const categoryIds = categories?.map(cat => cat.id) || [];
  let posts: any[] = [];
  
  if (categoryIds.length > 0) {
    // Get posts from categories in this section only
    const allPosts = await Promise.all(
      categoryIds.map(categoryId => getPosts(locale, true, categoryId, 'article'))
    );
    posts = allPosts.flat().filter((post, index, self) => 
      index === self.findIndex(p => p.id === post.id)
    );
    
    // Ensure posts belong to this section's categories
    posts = posts.filter(post => {
      // Only include posts that have a category AND belong to this section
      return post.categoryId && categoryIds.includes(post.categoryId);
    });
  }
  
  // Posts without category are NOT shown in section pages
  // Each section is isolated - only shows its own category posts

  const title =
    locale === 'ru' ? 'Информация для пациентов' : 'Bemorlar uchun ma\'lumotlar';

  return (
    <main className="min-h-screen bg-background">
      <PageHeader
        locale={locale}
        breadcrumbs={[
          { label: locale === 'ru' ? 'Главная' : 'Bosh sahifa', href: '/' },
          { label: title },
        ]}
        title={title}
      />

      <section className="bg-white py-12">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
            {/* Main Content */}
            <div className="min-w-0">
              {/* Posts List with Pagination */}
              {posts && posts.length > 0 ? (
                <div>
                  <h2 className="mb-6 text-2xl font-bold text-foreground">
                    {locale === 'ru' ? 'Статьи' : 'Maqolalar'}
                  </h2>
                  <PostsListPaginated posts={posts} locale={locale} postsPerPage={6} />
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    {locale === 'ru'
                      ? 'Статьи скоро будут добавлены.'
                      : "Maqolalar tez orada qo'shiladi."}
                  </p>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <aside className="sticky top-6 h-fit space-y-6">
              {/* Branches Card - Show nearby branches */}
              {branches && branches.length > 0 && (
                <NearbyBranches branches={branches} locale={locale} limit={3} />
              )}

              {/* Contact Card */}
              <div className="rounded-lg border border-border bg-gradient-to-br from-brand-primary/5 to-brand-accent/5 p-6">
                <h3 className="mb-3 text-lg font-semibold text-foreground">
                  {locale === 'ru' ? 'Связаться с нами' : 'Biz bilan bog\'laning'}
                </h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  {locale === 'ru' 
                    ? 'Наши специалисты готовы ответить на все ваши вопросы.'
                    : 'Bizning mutaxassislarimiz barcha savollaringizga javob berishga tayyor.'}
                </p>
                <Link
                  href="/contact"
                  className="block w-full rounded-md bg-brand-primary px-4 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-brand-accent"
                >
                  {locale === 'ru' ? 'Связаться' : 'Bog\'lanish'}
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}

