import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { COOKIE_NAME, verifyJWT } from '@/lib/auth';
import { downloadFileFromGridFS } from '@/lib/gridfs';
import { Readable } from 'stream';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const fileId = params.id;

    // Verify requesting user authentication
    const cookieStore = cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Access Denied: Detective badge verification required to download evidence files.' },
        { status: 401 }
      );
    }

    const user = await verifyJWT(token);
    if (!user) {
      return NextResponse.json(
        { error: 'Access Denied: Invalid detective badge credentials.' },
        { status: 401 }
      );
    }

    const { stream, filename, contentType } = await downloadFileFromGridFS(fileId);

    // Convert Node Stream to ReadableStream
    const readable = new ReadableStream({
      start(controller) {
        stream.on('data', (chunk) => controller.enqueue(chunk));
        stream.on('end', () => controller.close());
        stream.on('error', (err) => controller.error(err));
      },
    });

    return new NextResponse(readable, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${encodeURIComponent(filename)}"`,
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: err.message || 'Evidence file not found.' },
      { status: 404 }
    );
  }
}
