import JSZip from "jszip";

export type BatchArchiveFile = {
  name: string;
  blob: Blob;
};

export async function createBatchArchive(files: BatchArchiveFile[]): Promise<Blob> {
  const archive = new JSZip();
  await Promise.all(files.map(async file => {
    archive.file(file.name, await file.blob.arrayBuffer());
  }));
  return archive.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } });
}
