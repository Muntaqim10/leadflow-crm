import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    // Convert file to a Node Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate a unique filename to prevent namespace collisions
    const fileExt = file.name.split('.').pop();
    const uniqueFileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `documents/${uniqueFileName}`;

    // Ensure the storage bucket exists programmatically to self-heal if missing
    try {
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();
      if (!listError) {
        const bucketExists = buckets.some((b: any) => b.name === 'lead-documents');
        if (!bucketExists) {
          await supabase.storage.createBucket('lead-documents', {
            public: true,
            fileSizeLimit: 52428800, // 50MB
          });
        }
      }
    } catch (bucketErr) {
      console.warn('Auto-bucket check/create failed, attempting upload anyway:', bucketErr);
    }

    // Upload to the public 'lead-documents' Supabase bucket
    const { data, error } = await supabase.storage
      .from('lead-documents')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (error) {
      console.error('Supabase Storage Error:', error);
      return NextResponse.json({ error: `Storage upload failed: ${error.message}` }, { status: 500 });
    }

    // Get the public URL of the uploaded file
    const { data: publicUrlData } = supabase.storage
      .from('lead-documents')
      .getPublicUrl(filePath);

    return NextResponse.json({
      url: publicUrlData.publicUrl,
      name: file.name,
    });
  } catch (error: any) {
    console.error('File upload error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
