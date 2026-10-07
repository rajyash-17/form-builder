import mongoose from 'mongoose';
import { connectToDatabase } from './db';
import { Readable } from 'stream';

export async function getGridFSBucket(): Promise<mongoose.mongo.GridFSBucket> {
  const conn = await connectToDatabase();
  const db = conn.connection.db;
  if (!db) {
    throw new Error('Database connection not established for GridFS.');
  }
  return new mongoose.mongo.GridFSBucket(db, {
    bucketName: 'evidence_files',
  });
}

export async function uploadFileToGridFS(
  buffer: Buffer,
  filename: string,
  contentType: string
): Promise<string> {
  const bucket = await getGridFSBucket();
  const readableStream = Readable.from(buffer);

  const uploadStream = bucket.openUploadStream(filename, {
    contentType,
  });

  return new Promise((resolve, reject) => {
    readableStream
      .pipe(uploadStream)
      .on('error', (err) => reject(err))
      .on('finish', () => {
        resolve(uploadStream.id.toString());
      });
  });
}

export async function downloadFileFromGridFS(
  fileId: string
): Promise<{ stream: Readable; filename: string; contentType: string }> {
  const bucket = await getGridFSBucket();
  const objectId = new mongoose.Types.ObjectId(fileId);

  const files = await bucket.find({ _id: objectId }).toArray();
  if (!files || files.length === 0) {
    throw new Error('Evidence file not found in GridFS storage.');
  }

  const fileDoc = files[0];
  const downloadStream = bucket.openDownloadStream(objectId);

  return {
    stream: downloadStream as unknown as Readable,
    filename: fileDoc.filename,
    contentType: (fileDoc as unknown as { contentType?: string }).contentType || 'application/octet-stream',
  };
}
