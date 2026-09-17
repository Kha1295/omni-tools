import { NextRequest, NextResponse } from "next/server";
import { extractMediaVideo } from "@/lib/services/mediaDownloader";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, platform } = body as { url?: string; platform?: string };

    if (!url || typeof url !== "string" || !url.trim()) {
      return NextResponse.json(
        { success: false, error: "Vui lòng nhập đường dẫn liên kết (URL) hợp lệ." },
        { status: 400 }
      );
    }

    const trimmedUrl = url.trim();
    if (!trimmedUrl.startsWith("http://") && !trimmedUrl.startsWith("https://")) {
      return NextResponse.json(
        { success: false, error: "Đường dẫn phải bắt đầu bằng http:// hoặc https://" },
        { status: 400 }
      );
    }

    const result = await extractMediaVideo(trimmedUrl, platform);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Không thể trích xuất video từ đường dẫn này. Vui lòng kiểm tra lại quyền truy cập hoặc quyền riêng tư của video.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Đã xảy ra lỗi khi xử lý yêu cầu.";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

