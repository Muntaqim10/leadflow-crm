import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fileUrl = searchParams.get('url');
    const filename = searchParams.get('name') || 'document';

    if (!fileUrl) {
      return NextResponse.json({ error: 'Missing file URL' }, { status: 400 });
    }

    // Fetch the file from Supabase Storage in the backend
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch file from storage: ${response.statusText}`);
    }

    const fileBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'application/octet-stream';

    // Return the file with proper same-origin attachment headers
    return new Response(Buffer.from(fileBuffer), {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      },
    });
  } catch (error: any) {
    console.error('Download API error:', error);
    return NextResponse.json({ error: error.message || 'Failed to download file' }, { status: 500 });
  }
}
