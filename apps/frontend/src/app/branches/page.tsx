import { Suspense } from 'react';
import Script from 'next/script';
import { detectLocale } from '@/lib/locale-server';
import { getBranches, getPosts } from '@/lib/api-server';
import BranchesPageContent from './page-content';
import type { Metadata } from 'next';
import type { BranchResponse, PostResponse } from '@/lib/api';

export async function generateMetadata(): Promise<Metadata> {
  const locale = detectLocale();
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://acoustic.uz';
  const pageUrl = `${baseUrl}/branches`;
  const title = locale === 'ru' ? 'Наши филиалы' : 'Bizning filiallarimiz';
  const description =
    locale === 'ru'
      ? 'Адреса и контакты филиалов центра слуха Acoustic в Узбекистане.'
      : 'Acoustic eshitish markazi filiallari manzillari va aloqa ma\'lumotlari.';
  return {
    title: `${title} — Acoustic.uz`,
    description,
    alternates: { canonical: pageUrl },
  };
}

export default async function BranchesPage() {
  const locale = detectLocale();
  
  // Fetch data on server
  const [branches, posts] = await Promise.all([
    getBranches(locale),
    getPosts(locale, true, undefined, 'article'),
  ]);

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://acoustic.uz';
  const medicalOrgSchema = {
    '@context': 'https://schema.org',
    '@type': 'MedicalOrganization',
    name: 'Acoustic eshitish markazi',
    url: baseUrl,
    medicalSpecialty: 'Otolaryngology',
    hasMap: `${baseUrl}/branches`,
  };

  return (
    <>
      <Script
        id="medical-org-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(medicalOrgSchema) }}
      />
    <Suspense fallback={
      <main className="min-h-screen bg-background">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Yuklanmoqda...</p>
          </div>
        </div>
      </main>
    }>
      <BranchesPageContent 
        initialBranches={branches || []} 
        initialPosts={posts || []}
        initialLocale={locale}
      />
    </Suspense>
    </>
  );
}
