import { describe, it, expect } from "vitest";
import {
  detectPlatform,
  cleanMediaUrl,
  extractFacebookId,
  extractTwitterId,
  extractThreadsCode,
  threadsShortcodeToPostId,
  formatFileSize,
} from "../services/mediaDownloader";

describe("Media Downloader Service Tests", () => {
  describe("detectPlatform", () => {
    it("identifies Facebook URLs correctly", () => {
      expect(detectPlatform("https://www.facebook.com/watch/?v=10153231379946729")).toBe("facebook");
      expect(detectPlatform("https://fb.watch/abcdef123/")).toBe("facebook");
      expect(detectPlatform("https://m.facebook.com/reel/123456789/")).toBe("facebook");
      expect(detectPlatform("https://facebook.com/username/videos/987654321")).toBe("facebook");
    });

    it("identifies X (Twitter) URLs correctly", () => {
      expect(detectPlatform("https://x.com/jack/status/20")).toBe("twitter");
      expect(detectPlatform("https://twitter.com/SpaceX/status/1768262744799056157")).toBe("twitter");
      expect(detectPlatform("https://mobile.twitter.com/user/status/12345")).toBe("twitter");
    });

    it("identifies Threads URLs correctly", () => {
      expect(detectPlatform("https://www.threads.net/@zuck/post/CuW64vFv400")).toBe("threads");
      expect(detectPlatform("https://threads.net/t/CuW64vFv400")).toBe("threads");
      expect(detectPlatform("https://www.threads.com/@user/post/xyz123")).toBe("threads");
    });

    it("returns unknown for unsupported URLs", () => {
      expect(detectPlatform("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("unknown");
      expect(detectPlatform("https://tiktok.com/@user/video/123")).toBe("unknown");
      expect(detectPlatform("https://google.com")).toBe("unknown");
    });
  });

  describe("cleanMediaUrl", () => {
    it("unescapes slashes, unicode entities and html entities", () => {
      const raw = "https:\\/\\/video.fbcdn.net\\/v\\/t2\\/video.mp4?_nc_cat=101\\u0026oe=6AB12A9D\\u002526&amp;tag=hd";
      const cleaned = cleanMediaUrl(raw);
      expect(cleaned).toBe("https://video.fbcdn.net/v/t2/video.mp4?_nc_cat=101&oe=6AB12A9D%26&tag=hd");
    });

    it("handles empty or falsy inputs gracefully", () => {
      expect(cleanMediaUrl("")).toBe("");
    });
  });

  describe("extractFacebookId", () => {
    it("extracts ID from watch query parameter", () => {
      expect(extractFacebookId("https://www.facebook.com/watch/?v=10153231379946729")).toBe("10153231379946729");
    });

    it("extracts ID from reel URL", () => {
      expect(extractFacebookId("https://www.facebook.com/reel/1234567890/")).toBe("1234567890");
    });

    it("extracts ID from post URL", () => {
      expect(extractFacebookId("https://www.facebook.com/user/posts/99887766")).toBe("99887766");
    });
  });

  describe("extractTwitterId", () => {
    it("extracts status ID from standard X/Twitter URLs", () => {
      expect(extractTwitterId("https://x.com/jack/status/20")).toBe("20");
      expect(extractTwitterId("https://twitter.com/SpaceX/status/1768262744799056157")).toBe("1768262744799056157");
      expect(extractTwitterId("https://x.com/i/status/123456789")).toBe("123456789");
    });

    it("returns null for non-status URLs", () => {
      expect(extractTwitterId("https://x.com/jack")).toBeNull();
    });
  });

  describe("extractThreadsCode & threadsShortcodeToPostId", () => {
    it("extracts shortcode from user post URL", () => {
      expect(extractThreadsCode("https://www.threads.net/@zuck/post/CuW64vFv400")).toBe("CuW64vFv400");
      expect(extractThreadsCode("https://threads.net/t/CuW64vFv400")).toBe("CuW64vFv400");
    });

    it("converts shortcode to numeric Instagram/Threads post ID correctly", () => {
      // Test conversion of shortcode to BigInt
      const postId = threadsShortcodeToPostId("C_123");
      expect(postId).toBe("50290103");
      expect(typeof postId).toBe("string");
    });
  });

  describe("formatFileSize", () => {
    it("formats KB and MB properly", () => {
      expect(formatFileSize(512 * 1024)).toBe("512.0 KB");
      expect(formatFileSize(5 * 1024 * 1024)).toBe("5.0 MB");
      expect(formatFileSize(15.75 * 1024 * 1024)).toBe("15.8 MB");
      expect(formatFileSize(0)).toBeUndefined();
      expect(formatFileSize(undefined)).toBeUndefined();
    });
  });
});

