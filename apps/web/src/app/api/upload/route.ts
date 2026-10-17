import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const singleFile = formData.get('file') as File | null;

    const allFiles: File[] = files.length > 0 ? files : (singleFile ? [singleFile] : []);

    if (allFiles.length === 0) {
      return NextResponse.json({ error: 'No files provided for upload' }, { status: 400 });
    }

    const publicUploadDir = path.join(process.cwd(), 'public', 'uploads', 'listings');
    if (!existsSync(publicUploadDir)) {
      await mkdir(publicUploadDir, { recursive: true });
    }

    // Also mirror to services/api/uploads/listings if available
    const apiUploadDir = path.resolve(process.cwd(), '../../services/api/uploads/listings');
    try {
      if (!existsSync(apiUploadDir)) {
        await mkdir(apiUploadDir, { recursive: true });
      }
    } catch (_e) {
      // ignore if path structure differs
    }

    const results = [];

    for (let i = 0; i < allFiles.length; i++) {
      const file = allFiles[i];
      if (!file) continue;
      const buffer = Buffer.from(await file.arrayBuffer());

      let ext = path.extname(file.name || '').toLowerCase();
      if (!ext || ext === '.') {
        if (file.type === 'image/png') ext = '.png';
        else if (file.type === 'image/webp') ext = '.webp';
        else ext = '.jpg';
      }

      const fileId = `listing_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 8)}`;
      const fileName = `${fileId}${ext}`;
      const filePath = path.join(publicUploadDir, fileName);

      await writeFile(filePath, buffer);

      try {
        if (existsSync(apiUploadDir)) {
          await writeFile(path.join(apiUploadDir, fileName), buffer);
        }
      } catch (_e) {
        // ignore mirror write errors
      }

      results.push({
        url: `/uploads/listings/${fileName}`,
        cloudinaryPublicId: `marketplace/listings/${fileId}`,
        sortOrder: i,
        fileName: file.name,
      });
    }

    return NextResponse.json({
      success: true,
      data: results,
      url: results[0]?.url,
      cloudinaryPublicId: results[0]?.cloudinaryPublicId,
    });
  } catch (error: any) {
    console.error('Upload handler error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process file upload' },
      { status: 500 },
    );
  }
}
