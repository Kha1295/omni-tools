import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get("url");
  const rawFilename = searchParams.get("filename") || "omni-video.mp4";

  if (!targetUrl || (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://"))) {
    return NextResponse.json(
      { error: "Tham số URL không hợp lệ" },
      { status: 400 }
    );
  }

  // Sanitize filename to prevent header injection
  const cleanFilename = rawFilename
    .replace(/[^\w.-]/gi, "_")
    .replace(/\s+/g, "_")
    .substring(0, 100);

  try {
    const remoteResponse = await fetch(targetUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Accept: "*/*",
      },
    });

    if (!remoteResponse.ok || !remoteResponse.body) {
      return NextResponse.json(
        { error: `Không thể tải file media từ máy chủ nguồn (HTTP ${remoteResponse.status})` },
        { status: remoteResponse.status || 502 }
      );
    }

    const contentType =
      remoteResponse.headers.get("content-type") || "video/mp4";
    const contentLength = remoteResponse.headers.get("content-length");

    const responseHeaders = new Headers();
    responseHeaders.set("Content-Type", contentType);
    responseHeaders.set(
      "Content-Disposition",
      `attachment; filename="${cleanFilename}"`
    );
    if (contentLength) {
      responseHeaders.set("Content-Length", contentLength);
    }
    responseHeaders.set("Cache-Control", "public, max-age=3600");

    return new Response(remoteResponse.body, {
      status: 200,
      headers: responseHeaders,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Lỗi khi stream media";
    return NextResponse.json(
      { error: `Lỗi kết nối: ${message}` },
      { status: 500 }
    );
  }
}

