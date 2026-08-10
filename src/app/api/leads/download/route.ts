import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fileUrl = searchParams.get('url');
    const filename = searchParams.get('name') || 'document';

    if (!fileUrl) {
      return NextResponse.json({ error: 'Missing file URL' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    try {
      const parsedFileUrl = new URL(fileUrl);
      const parsedSupabaseUrl = new URL(supabaseUrl);
      if (parsedFileUrl.origin !== parsedSupabaseUrl.origin) {
        return NextResponse.json({ error: 'Invalid URL origin' }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    // Fetch the file from Supabase Storage in the backend
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch file from storage: ${response.statusText}`);
    }

    const fileBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'application/octet-stream';

    // Prevent HTTP Response Splitting and Injection
    const safeFilename = filename.replace(/[\r\n]/g, '').replace(/"/g, '\\"');

    // Return the file with proper same-origin attachment headers
    return new Response(Buffer.from(fileBuffer), {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${safeFilename}"; filename*=UTF-8''${encodeURIComponent(safeFilename)}`,
      },
    });
  } catch (error: any) {
    console.error('Download API error:', error);
    return NextResponse.json({ error: error.message || 'Failed to download file' }, { status: 500 });
  }
}
