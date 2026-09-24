import fs from "fs";
import path from "path";
import type { Request, Response } from "express";

/**
 * Handles HTTP Byte-Range video streaming (HTTP 206 Partial Content)
 * specifically designed for Apple WebKit (Safari, iOS Safari, DuckDuckGo Mac)
 * and Cloudflare proxying.
 */
export function streamVideoFile(filePath: string, req: Request, res: Response) {
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "Video file not found" });
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  // Determine MIME type based on extension
  const ext = path.extname(filePath).toLowerCase();
  let contentType = 'video/mp4';
  if (ext === '.webm') contentType = 'video/webm';
  else if (ext === '.mov') contentType = 'video/quicktime';
  else if (ext === '.m4v') contentType = 'video/x-m4v';
  else if (ext === '.mkv') contentType = 'video/x-matroska';

  // Common CORS and streaming headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range, Authorization');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Accept-Ranges, Content-Length');
  res.setHeader('Accept-Ranges', 'bytes');
  // Critical for Cloudflare: prevents edge from stripping range headers or caching full 200 responses
  res.setHeader('Cache-Control', 'no-cache, private, no-transform');

  if (req.method === 'HEAD') {
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', fileSize);
    return res.status(200).end();
  }

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    if (isNaN(start) || start >= fileSize || (end !== undefined && end >= fileSize) || start > end) {
      res.setHeader('Content-Range', `bytes */${fileSize}`);
      return res.status(416).end(); // Range Not Satisfiable
    }

    const chunksize = (end - start) + 1;
    const fileStream = fs.createReadStream(filePath, { start, end });

    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': contentType,
    });

    fileStream.pipe(res);
  } else {
    res.writeHead(200, {
      'Content-Length': fileSize,
      'Accept-Ranges': 'bytes',
      'Content-Type': contentType,
    });

    fs.createReadStream(filePath).pipe(res);
  }
}
