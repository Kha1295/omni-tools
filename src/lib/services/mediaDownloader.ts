export type MediaPlatform = "facebook" | "twitter" | "threads" | "unknown";

export interface MediaDownloadOption {
  quality: "HD" | "SD" | "Audio" | "Origin";
  resolution?: string;
  format: "mp4" | "mp3";
  url: string;
  size?: string;
}

export interface MediaVideoResult {
  success: boolean;
  platform: "facebook" | "twitter" | "threads";
  id: string;
  title: string;
  author?: {
    name: string;
    username?: string;
    avatar?: string;
  };
  thumbnail: string;
  duration?: string;
  downloads: MediaDownloadOption[];
  sourceUrl: string;
  error?: string;
}

const BASE64_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

/**
 * Clean URL and unescape escaped characters (JSON slashes, unicode escapes)
 */
export function cleanMediaUrl(rawUrl: string): string {
  if (!rawUrl) return "";
  return rawUrl
    .replace(/\\\//g, "/")
    .replace(/\\u0026/g, "&")
    .replace(/\\u0025/g, "%")
    .replace(/&amp;/g, "&")
    .replace(/\\/g, "")
    .trim();
}

/**
 * Detect platform from input URL
 */
export function detectPlatform(url: string): MediaPlatform {
  const trimmed = url.trim().toLowerCase();
  if (
    trimmed.includes("facebook.com") ||
    trimmed.includes("fb.watch") ||
    trimmed.includes("fb.me") ||
    trimmed.includes("m.facebook.com")
  ) {
    return "facebook";
  }
  if (
    trimmed.includes("twitter.com") ||
    trimmed.includes("x.com") ||
    trimmed.includes("t.co")
  ) {
    return "twitter";
  }
  if (trimmed.includes("threads.net") || trimmed.includes("threads.com")) {
    return "threads";
  }
  return "unknown";
}

/**
 * Extract Facebook video ID or reel slug from URL
 */
export function extractFacebookId(url: string): string {
  const watchMatch = url.match(/[?&]v=(\d+)/i);
  if (watchMatch) return watchMatch[1];

  const reelMatch = url.match(/(?:reels|reel|videos|watch)\/([A-Za-z0-9_-]+)/i);
  if (reelMatch) return reelMatch[1];

  const postMatch = url.match(/posts\/(\d+)/i);
  if (postMatch) return postMatch[1];

  return "fb_video";
}

/**
 * Extract X / Twitter Status ID from URL
 */
export function extractTwitterId(url: string): string | null {
  const match = url.match(/(?:twitter\.com|x\.com)\/(?:#!\/)?(\w+)\/status(?:es)?\/(\d+)/i);
  if (match) return match[2];
  const shortMatch = url.match(/\/status(?:es)?\/(\d+)/i);
  return shortMatch ? shortMatch[1] : null;
}

/**
 * Extract Threads shortcode from URL
 */
export function extractThreadsCode(url: string): string | null {
  const match = url.match(/threads\.(?:net|com)\/(?:@([^\/]+)\/)?post\/([A-Za-z0-9_-]+)/i);
  if (match) return match[2];
  const tMatch = url.match(/threads\.(?:net|com)\/t\/([A-Za-z0-9_-]+)/i);
  return tMatch ? tMatch[1] : null;
}

/**
 * Convert Threads shortcode to numeric Instagram/Threads post ID
 */
export function threadsShortcodeToPostId(shortcode: string): string {
  let id = 0n;
  for (let i = 0; i < shortcode.length; i++) {
    const char = shortcode[i];
    const index = BigInt(BASE64_ALPHABET.indexOf(char));
    if (index === -1n) continue;
    id = id * 64n + index;
  }
  return id.toString();
}

/**
 * Format bytes to readable string (e.g. 15.4 MB)
 */
export function formatFileSize(bytes?: number): string | undefined {
  if (!bytes || isNaN(bytes) || bytes <= 0) return undefined;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// --------------------------------------------------------------------------
// FACEBOOK EXTRACTOR
// --------------------------------------------------------------------------
export async function extractFacebookVideo(rawUrl: string): Promise<MediaVideoResult> {
  const videoId = extractFacebookId(rawUrl);
  let targetUrl = rawUrl.trim();

  // If fb.watch or fb.me, resolve redirect first
  if (targetUrl.includes("fb.watch") || targetUrl.includes("fb.me")) {
    try {
      const headRes = await fetch(targetUrl, {
        method: "HEAD",
        redirect: "follow",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        },
      });
      if (headRes.url) {
        targetUrl = headRes.url;
      }
    } catch {
      // Continue with original url if head fails
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-User": "?1",
        "Sec-Fetch-Dest": "document",
      },
    });

    clearTimeout(timeoutId);
    if (!response.ok) {
      throw new Error(`Không thể kết nối đến Facebook (HTTP ${response.status})`);
    }

    const html = await response.text();

    // Extract HD URL
    const hdMatch =
      html.match(/"browser_native_hd_url":"([^"]+)"/) ||
      html.match(/"playable_url_quality_hd":"([^"]+)"/) ||
      html.match(/"hd_src":"([^"]+)"/) ||
      html.match(/"hd_src_no_ratelimit":"([^"]+)"/);

    // Extract SD URL
    const sdMatch =
      html.match(/"browser_native_sd_url":"([^"]+)"/) ||
      html.match(/"playable_url":"([^"]+)"/) ||
      html.match(/"sd_src":"([^"]+)"/) ||
      html.match(/"sd_src_no_ratelimit":"([^"]+)"/);

    // Extract OpenGraph fallback
    const ogVideoMatch =
      html.match(/property="og:video(:secure_url)?"\s+content="([^"]+)"/i) ||
      html.match(/content="([^"]+)"\s+property="og:video(:secure_url)?"/i);

    const hdUrl = cleanMediaUrl(hdMatch?.[1] || "");
    const sdUrl = cleanMediaUrl(sdMatch?.[1] || "");
    const ogVideoUrl = cleanMediaUrl(ogVideoMatch?.[2] || ogVideoMatch?.[1] || "");

    if (!hdUrl && !sdUrl && !ogVideoUrl) {
      throw new Error(
        "Không tìm thấy video khả dụng. Có thể video này nằm trong nhóm riêng tư hoặc bị hạn chế đối tượng người xem."
      );
    }

    // Extract Title / Description
    const titleMatch =
      html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i) ||
      html.match(/<title>([^<]+)<\/title>/i);
    const descMatch = html.match(/<meta\s+property="og:description"\s+content="([^"]+)"/i);

    let rawTitle = titleMatch?.[1] || descMatch?.[1] || "Video Facebook";
    rawTitle = rawTitle
      .replace(/&#xb7;/g, "·")
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, "&")
      .replace(/\| Facebook/i, "")
      .trim();

    // Extract Thumbnail
    const thumbMatch =
      html.match(/"preferred_thumbnail":\{"image":\{"uri":"([^"]+)"/) ||
      html.match(/property="og:image"\s+content="([^"]+)"/i) ||
      html.match(/content="([^"]+)"\s+property="og:image"/i);
    const thumbnail = cleanMediaUrl(thumbMatch?.[1] || "");

    const downloads: MediaDownloadOption[] = [];

    if (hdUrl) {
      downloads.push({
        quality: "HD",
        resolution: "1080p / 720p HD",
        format: "mp4",
        url: hdUrl,
      });
    }

    if (sdUrl && sdUrl !== hdUrl) {
      downloads.push({
        quality: "SD",
        resolution: "480p / 360p SD",
        format: "mp4",
        url: sdUrl,
      });
    }

    if (downloads.length === 0 && ogVideoUrl) {
      downloads.push({
        quality: "HD",
        resolution: "Standard MP4",
        format: "mp4",
        url: ogVideoUrl,
      });
    }

    return {
      success: true,
      platform: "facebook",
      id: videoId,
      title: rawTitle,
      thumbnail: thumbnail || "/images/placeholder-video.png",
      downloads,
      sourceUrl: rawUrl,
    };
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    const message = err instanceof Error ? err.message : "Lỗi không xác định khi trích xuất video Facebook";
    return {
      success: false,
      platform: "facebook",
      id: videoId,
      title: "",
      thumbnail: "",
      downloads: [],
      sourceUrl: rawUrl,
      error: message,
    };
  }
}

// --------------------------------------------------------------------------
// X (TWITTER) EXTRACTOR
// --------------------------------------------------------------------------
interface FxVideoVariant {
  bitrate?: number;
  content_type?: string;
  url: string;
}

interface FxVideoMedia {
  url?: string;
  thumbnail_url?: string;
  width?: number;
  height?: number;
  format?: string;
  variants?: FxVideoVariant[];
}

interface FxTweetResponse {
  code: number;
  message?: string;
  tweet?: {
    id: string;
    text?: string;
    author?: {
      name?: string;
      screen_name?: string;
      avatar_url?: string;
    };
    media?: {
      videos?: FxVideoMedia[];
    };
  };
}

export async function extractTwitterVideo(rawUrl: string): Promise<MediaVideoResult> {
  const tweetId = extractTwitterId(rawUrl);
  if (!tweetId) {
    return {
      success: false,
      platform: "twitter",
      id: "unknown",
      title: "",
      thumbnail: "",
      downloads: [],
      sourceUrl: rawUrl,
      error: "Không tìm thấy ID bài viết hợp lệ từ đường dẫn X/Twitter đã nhập.",
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    // Attempt 1: FxTwitter API
    const fxEndpoints = [
      `https://api.fxtwitter.com/status/${tweetId}`,
      `https://api.fxtwitter.com/i/status/${tweetId}`,
    ];

    let fxData: FxTweetResponse | null = null;
    for (const ep of fxEndpoints) {
      try {
        const res = await fetch(ep, {
          signal: controller.signal,
          headers: {
            Accept: "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
        });
        if (res.ok) {
          const json = (await res.json()) as FxTweetResponse;
          if (json.code === 200 && json.tweet) {
            fxData = json;
            break;
          }
        }
      } catch {
        // Try next endpoint
      }
    }

    if (fxData && fxData.tweet) {
      const tweet = fxData.tweet;
      const videos = tweet.media?.videos || [];

      if (videos.length > 0) {
        const video = videos[0];
        const variants = (video.variants || []).filter(
          (v) => v.content_type?.includes("mp4") || v.url?.includes(".mp4")
        );

        // Sort by bitrate descending
        variants.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));

        const downloads: MediaDownloadOption[] = [];
        if (variants.length > 0) {
          // Highest bitrate -> HD
          downloads.push({
            quality: "HD",
            resolution: `${video.width && video.height ? `${video.width}x${video.height} ` : ""}HD`,
            format: "mp4",
            url: variants[0].url,
          });

          // Lowest bitrate (if distinct) -> SD
          if (variants.length > 1) {
            const lowest = variants[variants.length - 1];
            if (lowest.url !== variants[0].url) {
              downloads.push({
                quality: "SD",
                resolution: "Tiết kiệm dung lượng (SD)",
                format: "mp4",
                url: lowest.url,
              });
            }
          }
        } else if (video.url) {
          downloads.push({
            quality: "HD",
            resolution: "MP4 Video",
            format: "mp4",
            url: video.url,
          });
        }

        clearTimeout(timeoutId);
        return {
          success: true,
          platform: "twitter",
          id: tweetId,
          title: tweet.text || "Video X/Twitter",
          author: {
            name: tweet.author?.name || "Người dùng X",
            username: tweet.author?.screen_name ? `@${tweet.author.screen_name}` : undefined,
            avatar: tweet.author?.avatar_url,
          },
          thumbnail: video.thumbnail_url || tweet.author?.avatar_url || "",
          downloads,
          sourceUrl: rawUrl,
        };
      }
    }

    // Attempt 2: TwitSave Fallback
    const twitsaveUrl = `https://twitsave.com/info?url=${encodeURIComponent(rawUrl)}`;
    const twitRes = await fetch(twitsaveUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      },
    });

    clearTimeout(timeoutId);

    if (twitRes.ok) {
      const html = await twitRes.text();
      // Extract download links from twitsave
      const links = html.match(/href="(https:\/\/twitsave\.com\/download\?[^"]+)"/g) || [];
      const cleanLinks = links.map((l) => l.replace(/href="|"/g, ""));

      if (cleanLinks.length > 0) {
        const titleMatch = html.match(/<p class="[^"]*text-gray-800[^"]*">([^<]+)<\/p>/i);
        const thumbMatch = html.match(/<img[^>]+src="(https:\/\/pbs\.twimg\.com\/[^"]+)"/i);

        const downloads: MediaDownloadOption[] = cleanLinks.map((url, idx) => ({
          quality: idx === 0 ? "HD" : "SD",
          resolution: idx === 0 ? "Chất lượng cao" : "Tiêu chuẩn",
          format: "mp4",
          url,
        }));

        return {
          success: true,
          platform: "twitter",
          id: tweetId,
          title: titleMatch?.[1]?.trim() || "Video X/Twitter",
          thumbnail: thumbMatch?.[1] || "",
          downloads,
          sourceUrl: rawUrl,
        };
      }
    }

    throw new Error(
      "Không tìm thấy video trong bài viết X/Twitter này. Vui lòng kiểm tra lại link hoặc chắc chắn bài viết chứa video/GIF."
    );
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    const message = err instanceof Error ? err.message : "Lỗi không xác định khi trích xuất video X/Twitter";
    return {
      success: false,
      platform: "twitter",
      id: tweetId,
      title: "",
      thumbnail: "",
      downloads: [],
      sourceUrl: rawUrl,
      error: message,
    };
  }
}

// --------------------------------------------------------------------------
// THREADS EXTRACTOR
// --------------------------------------------------------------------------
export async function extractThreadsVideo(rawUrl: string): Promise<MediaVideoResult> {
  const shortcode = extractThreadsCode(rawUrl);
  if (!shortcode) {
    return {
      success: false,
      platform: "threads",
      id: "unknown",
      title: "",
      thumbnail: "",
      downloads: [],
      sourceUrl: rawUrl,
      error: "Không tìm thấy mã bài viết hợp lệ từ đường dẫn Threads đã nhập.",
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const postNumericId = threadsShortcodeToPostId(shortcode);

    // Method 1: Fetch threads web page directly
    const res = await fetch(rawUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7",
      },
    });

    const html = await res.text();

    // Look for video URL in script tags or open graph
    const ogVideoMatch =
      html.match(/property="og:video(:secure_url)?"\s+content="([^"]+)"/i) ||
      html.match(/content="([^"]+)"\s+property="og:video(:secure_url)?"/i);

    // Look for video_versions array in embedded JSON
    const videoVersionsMatch = html.match(/"video_versions":(\[[^\]]+\])/);

    let foundVideoUrl = "";
    if (videoVersionsMatch) {
      try {
        const versions = JSON.parse(videoVersionsMatch[1]) as Array<{ url?: string; width?: number; height?: number }>;
        if (Array.isArray(versions) && versions.length > 0 && versions[0].url) {
          foundVideoUrl = cleanMediaUrl(versions[0].url);
        }
      } catch {
        // ignore parse error
      }
    }

    if (!foundVideoUrl && ogVideoMatch) {
      foundVideoUrl = cleanMediaUrl(ogVideoMatch[2] || ogVideoMatch[1]);
    }

    // Look for any direct mp4 url in HTML
    if (!foundVideoUrl) {
      const mp4Match = html.match(/https:\/\/[^"\s\\]+?\.mp4[^"\s\\]*/);
      if (mp4Match) {
        foundVideoUrl = cleanMediaUrl(mp4Match[0]);
      }
    }

    // Method 2: Fallback query GraphQL endpoint with LSD token from HTML
    if (!foundVideoUrl) {
      const lsdToken = html.match(/"LSD",\[\],\{"token":"([^"]+)"\}/)?.[1] || "AVo_";
      try {
        const gqlRes = await fetch("https://www.threads.net/api/graphql", {
          signal: controller.signal,
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "X-IG-App-ID": "238260118697367",
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            "X-FB-LSD": lsdToken,
          },
          body: `lsd=${encodeURIComponent(lsdToken)}&variables=${encodeURIComponent(
            JSON.stringify({ postID: postNumericId })
          )}&doc_id=5587632691339264`,
        });

        if (gqlRes.ok) {
          const gqlText = await gqlRes.text();
          const gqlMp4 = gqlText.match(/https:\/\/[^"\s\\]+?\.mp4[^"\s\\]*/);
          if (gqlMp4) {
            foundVideoUrl = cleanMediaUrl(gqlMp4[0]);
          }
        }
      } catch {
        // Fallback continues
      }
    }

    // Title / Caption
    const titleMatch =
      html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i) ||
      html.match(/<meta\s+property="og:description"\s+content="([^"]+)"/i);
    let title = titleMatch?.[1] || "Bài viết Threads";
    title = title.replace(/&quot;/g, '"').replace(/&amp;/g, "&").trim();

    // Thumbnail
    const thumbMatch =
      html.match(/property="og:image"\s+content="([^"]+)"/i) ||
      html.match(/content="([^"]+)"\s+property="og:image"/i);
    const thumbnail = cleanMediaUrl(thumbMatch?.[2] || thumbMatch?.[1] || "");

    clearTimeout(timeoutId);

    if (!foundVideoUrl) {
      throw new Error(
        "Không tìm thấy video trong bài viết Threads này. Có thể bài viết chỉ chứa hình ảnh/chữ hoặc tài khoản ở chế độ riêng tư."
      );
    }

    const downloads: MediaDownloadOption[] = [
      {
        quality: "HD",
        resolution: "Chất lượng gốc HD (MP4)",
        format: "mp4",
        url: foundVideoUrl,
      },
    ];

    return {
      success: true,
      platform: "threads",
      id: shortcode,
      title,
      thumbnail: thumbnail || "/images/placeholder-video.png",
      downloads,
      sourceUrl: rawUrl,
    };
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    const message = err instanceof Error ? err.message : "Lỗi không xác định khi trích xuất video Threads";
    return {
      success: false,
      platform: "threads",
      id: shortcode,
      title: "",
      thumbnail: "",
      downloads: [],
      sourceUrl: rawUrl,
      error: message,
    };
  }
}

// --------------------------------------------------------------------------
// UNIFIED EXTRACTOR
// --------------------------------------------------------------------------
export async function extractMediaVideo(
  url: string,
  preferredPlatform?: string
): Promise<MediaVideoResult> {
  const platform =
    preferredPlatform && preferredPlatform !== "auto"
      ? (preferredPlatform as MediaPlatform)
      : detectPlatform(url);

  if (platform === "facebook") {
    return extractFacebookVideo(url);
  }
  if (platform === "twitter") {
    return extractTwitterVideo(url);
  }
  if (platform === "threads") {
    return extractThreadsVideo(url);
  }

  return {
    success: false,
    platform: "unknown" as "facebook",
    id: "unknown",
    title: "",
    thumbnail: "",
    downloads: [],
    sourceUrl: url,
    error:
      "Đường dẫn không hợp lệ. Vui lòng nhập liên kết video từ Facebook (facebook.com, fb.watch), X/Twitter (x.com, twitter.com) hoặc Threads (threads.net).",
  };
}

