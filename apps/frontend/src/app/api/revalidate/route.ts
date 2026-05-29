import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

/**
 * On-demand revalidation: mahsulot/boshqa sahifa o'zgarganida keshnı yangilash.
 * POST /api/revalidate?path=/products/oticon-jet-2-bte-pp
 * Header: Authorization: Bearer <REVALIDATE_SECRET>
 * yoki body: { "path": "/products/oticon-jet-2-bte-pp", "secret": "<REVALIDATE_SECRET>" }
 *
 * .env da REVALIDATE_SECRET o'rnating (ixtiyoriy; bo'lmasa faqat localhost da ishlaydi).
 */
export async function POST(request: Request) {
  try {
    const secret = process.env.REVALIDATE_SECRET;
    const url = new URL(request.url);
    let path = url.searchParams.get('path');
    let givenSecret = url.searchParams.get('secret') ?? request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

    if (!path && request.headers.get('content-type')?.includes('application/json')) {
      const body = await request.json().catch(() => ({}));
      path = body.path ?? (body.slug ? `/products/${body.slug}` : null);
      if (body.secret) givenSecret = body.secret;
    }

    if (!path) {
      return NextResponse.json({ error: 'path kerak (?path=/products/oticon-jet-2-bte-pp yoki body.path)' }, { status: 400 });
    }

    if (secret && givenSecret !== secret) {
      return NextResponse.json({ error: 'Noto\'g\'ri secret' }, { status: 401 });
    }

    if (!path.startsWith('/')) path = `/${path}`;
    revalidatePath(path, 'page');
    // Segment cache ham yangilansin (ba’zi deploymentlarda kerak)
    const segment = path.split('/').slice(0, -1).join('/') || '/';
    if (segment !== path) revalidatePath(segment, 'layout');
    return NextResponse.json({ revalidated: true, path });
  } catch (e) {
    console.error('[revalidate]', e);
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Revalidate xato' }, { status: 500 });
  }
}
