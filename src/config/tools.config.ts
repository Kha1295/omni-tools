export interface ToolFAQ {
  question: string;
  answer: string;
}

export interface ToolMetadata {
  id: string;
  name: string;
  slug: string;
  category: "finance" | "convert" | "dev" | "math" | "text";
  categoryName: string;
  shortDesc: string;
  fullDesc: string;
  icon: string; // Lucide icon name
  badge?: string;
  isPopular?: boolean;
  isNew?: boolean;
  tags: string[];
  features: string[];
  formulaTitle?: string;
  formulaContent?: string;
  formulaExample?: string;
  faqs: ToolFAQ[];
  seo: {
    title: string;
    description: string;
    keywords: string[];
  };
}

export interface CategoryMetadata {
  id: "finance" | "convert" | "dev" | "math" | "text";
  name: string;
  description: string;
  icon: string;
  color: string;
}

export const CATEGORIES: CategoryMetadata[] = [
  {
    id: "finance",
    name: "Tài Chính & Đầu Tư",
    description: "Công cụ tính lãi suất, lãi kép, chia hóa đơn, lịch trả nợ chuẩn xác tuyệt đối",
    icon: "Coins",
    color: "from-emerald-500 to-teal-700",
  },
  {
    id: "convert",
    name: "Chuyển Đổi Đơn Vị",
    description: "Quy đổi tiền tệ, tỷ giá, dung lượng, độ dài, cân nặng và nhiệt độ nhanh chóng",
    icon: "ArrowLeftRight",
    color: "from-blue-500 to-indigo-700",
  },
  {
    id: "dev",
    name: "Lập Trình & Mã Hóa",
    description: "Bộ công cụ cho lập trình viên: Format JSON, Base64, Hash, UUID, Regex",
    icon: "Code2",
    color: "from-purple-500 to-violet-700",
  },
  {
    id: "math",
    name: "Toán Học & Xác Suất",
    description: "Tính phần trăm, ma trận, thống kê, ước tính xác suất client-side",
    icon: "Calculator",
    color: "from-amber-500 to-orange-700",
  },
  {
    id: "text",
    name: "Văn Bản & Nội Dung",
    description: "Đếm từ, chuyển đổi chữ hoa/thường, xóa ký tự thừa, diff text",
    icon: "FileText",
    color: "from-rose-500 to-pink-700",
  },
];

export const TOOLS_CONFIG: ToolMetadata[] = [
  {
    id: "interest-rate",
    name: "Tính Lãi Suất & Lãi Kép",
    slug: "/finance/interest-rate",
    category: "finance",
    categoryName: "Tài Chính & Đầu Tư",
    shortDesc: "Tính toán chính xác tiền gửi tiết kiệm, lãi kép định kỳ và lịch tích lũy tài sản dài hạn",
    fullDesc: "Công cụ mô phỏng tăng trưởng tài chính và lãi kép với độ chính xác cao bằng Decimal.js, hỗ trợ các kỳ hạn tháng, quý, năm kèm biểu đồ phân tích trực quan.",
    icon: "TrendingUp",
    badge: "Phổ biến",
    isPopular: true,
    tags: ["Lãi kép", "Tiết kiệm", "Đầu tư", "Decimal.js", "Biểu đồ trực quan"],
    features: [
      "Tính toán client-side 100% bảo mật dữ liệu cá nhân",
      "Xử lý số thực chính xác tuyệt đối không bị sai số dấu phẩy động",
      "Biểu đồ trực quan phân tích gốc vs lãi theo từng năm",
      "Bảng phân kỳ lịch trả nợ/tích lũy chi tiết",
      "Tùy chọn đóng góp thêm định kỳ mỗi tháng/năm"
    ],
    formulaTitle: "Công Thức Tính Lãi Kép Chuẩn Quốc Tế",
    formulaContent: "A = P * (1 + r/n)^(n*t) + PMT * [((1 + r/n)^(n*t) - 1) / (r/n)]",
    formulaExample: "Ví dụ: Gốc 100.000.000 ₫, lãi suất 8%/năm, góp thêm 2.000.000 ₫/tháng trong 10 năm. Sau 10 năm tổng tài sản sẽ đạt xấp xỉ 579.800.000 ₫ (gốc 340 triệu, tiền lãi 239.8 triệu).",
    faqs: [
      {
        question: "Lãi kép là gì và tại sao được gọi là 'kỳ quan thứ 8'?",
        answer: "Lãi kép (Compound Interest) là quá trình tiền lãi sinh ra được cộng dồn vào gốc ban đầu để tiếp tục sinh lãi cho các kỳ tiếp theo. Qua thời gian dài, hiệu ứng tuyết lăn sẽ giúp tài sản tăng trưởng theo hàm số mũ."
      },
      {
        question: "Công cụ này có an toàn với thông tin tài chính của tôi không?",
        answer: "Hoàn toàn an toàn 100%. Toàn bộ thuật toán tính toán được thực thi trực tiếp trên trình duyệt của bạn (Client-side) qua thư viện Decimal.js, không có bất kỳ dữ liệu nào được gửi về máy chủ."
      },
      {
        question: "Tần suất ghép lãi (hàng tháng, hàng quý, hàng năm) ảnh hưởng thế nào?",
        answer: "Tần suất ghép lãi càng dày (ví dụ ghép lãi hàng tháng so với hàng năm), số tiền lãi thực nhận sẽ càng cao hơn do lãi sinh ra được tái đầu tư sớm hơn."
      }
    ],
    seo: {
      title: "Công Cụ Tính Lãi Kép & Lãi Suất Tiết Kiệm Chuẩn Xác | Omni Tools",
      description: "Tính lãi kép, lãi suất ngân hàng, kế hoạch đầu tư định kỳ miễn phí và chính xác 100%. Xem biểu đồ tăng trưởng tài sản và bảng lịch phân kỳ chi tiết.",
      keywords: ["tính lãi kép", "công cụ tính lãi suất", "compound interest calculator", "tính tiền gửi tiết kiệm", "kế hoạch tài chính"]
    }
  },
  {
    id: "bill-split",
    name: "Chia Tiền Hóa Đơn & Tip (Bill Split)",
    slug: "/finance/bill-split",
    category: "finance",
    categoryName: "Tài Chính & Đầu Tư",
    shortDesc: "Chia tiền ăn uống, tiền phòng, tiền tip và thuế phí dịch vụ công bằng cho từng thành viên",
    fullDesc: "Công cụ chia hóa đơn thông minh giúp tính toán số tiền mỗi người cần trả chính xác đến từng đồng, hỗ trợ tính tiền tip, thuế VAT và phí phục vụ kèm biểu đồ tròn.",
    icon: "Receipt",
    badge: "Mới",
    isPopular: true,
    tags: ["Chia hóa đơn", "Tip calculator", "Đi ăn nhóm", "Quản lý chi tiêu"],
    features: [
      "Chia đều hoặc chia theo phần tiền riêng biệt từng người",
      "Tự động tính thuế VAT (8%, 10%) và phí dịch vụ",
      "Tùy chọn tiền Tip linh hoạt theo phần trăm hoặc số tiền cố định",
      "Biểu đồ tròn trực quan hóa tỷ trọng chi tiêu",
      "Hỗ trợ copy bảng chia tiền gửi nhanh qua Zalo, Messenger, Telegram"
    ],
    formulaTitle: "Công Thức Phân Bổ Hóa Đơn & Thuế Phí",
    formulaContent: "Tổng = Tiền món + (Tiền món * Thuế%) + (Tiền món * Tip%) + Phí khác. Tiền mỗi người = Tổng / Số người.",
    formulaExample: "Ví dụ: Hóa đơn 1.200.000 ₫ cho nhóm 4 người, VAT 10% (120.000 ₫), Tip 5% (60.000 ₫). Tổng hóa đơn 1.380.000 ₫ => Mỗi người thanh toán chính xác 345.000 ₫.",
    faqs: [
      {
        question: "Làm sao để chia khi có người gọi món đắt hơn hoặc không uống rượu bia?",
        answer: "Bạn có thể sử dụng chế độ 'Chia theo từng người' trong công cụ để nhập số tiền riêng cho từng thành viên, hệ thống sẽ tự phân bổ thuế và tip theo tỷ lệ tiền món của từng người."
      },
      {
        question: "Hệ thống có làm tròn số tiền lẻ để dễ chuyển khoản không?",
        answer: "Có! Bạn có thể bật tính năng làm tròn đến hàng nghìn (1.000 ₫) hoặc mười nghìn (10.000 ₫) để thuận tiện quét mã QR chuyển khoản."
      }
    ],
    seo: {
      title: "Công Cụ Chia Tiền Hóa Đơn & Tiền Tip Nhanh Chóng | Omni Tools",
      description: "Chia tiền ăn uống, cafe, du lịch nhóm chính xác và minh bạch. Tự động tính VAT, Tip và sao chép danh sách chuyển khoản tiện lợi.",
      keywords: ["chia tiền hóa đơn", "bill split calculator", "tính tiền tip", "chia tiền đi ăn", "chia bill nhóm"]
    }
  },
  {
    id: "currency-converter",
    name: "Quy Đổi Tiền Tệ & Ngoại Tệ",
    slug: "/convert/currency",
    category: "convert",
    categoryName: "Chuyển Đổi Đơn Vị",
    shortDesc: "Chuyển đổi tỷ giá giữa VND, USD, EUR, JPY, GBP, KRW và hơn 30 loại ngoại tệ chính xác",
    fullDesc: "Tra cứu và quy đổi tỷ giá tiền tệ quốc tế nhanh chóng, hỗ trợ tính toán hai chiều với tỷ giá tham khảo và biên độ chênh lệch ngân hàng.",
    icon: "ArrowLeftRight",
    badge: "Hữu ích",
    isPopular: false,
    tags: ["Tỷ giá ngoại tệ", "VND to USD", "Đổi tiền", "Quy đổi nhanh"],
    features: [
      "Hỗ trợ hơn 30 đơn vị tiền tệ phổ biến nhất thế giới",
      "Tính toán client-side tức thì khi thay đổi số lượng",
      "Chuyển đổi đảo chiều nhanh chóng chỉ bằng 1 nút bấm",
      "Bảng quy đổi các mốc tiền thông dụng (1, 5, 10, 50, 100, 1000)"
    ],
    formulaTitle: "Công Thức Quy Đổi Tỷ Giá",
    formulaContent: "Số tiền đích = Số tiền nguồn * (Tỷ giá đích / Tỷ giá nguồn)",
    formulaExample: "Ví dụ: 100 USD với tỷ giá 25.400 VND/USD = 2.540.000 VND.",
    faqs: [
      {
        question: "Tỷ giá được cập nhật theo nguồn nào?",
        answer: "Tỷ giá tham chiếu dựa trên tỷ giá thị trường liên ngân hàng quốc tế chuẩn, phù hợp cho việc ước lượng chi phí du lịch, mua sắm và giao dịch."
      }
    ],
    seo: {
      title: "Chuyển Đổi Ngoại Tệ & Tỷ Giá Tiền Tệ Online | Omni Tools",
      description: "Quy đổi tỷ giá USD, EUR, JPY, KRW sang VND và ngược lại chính xác tức thì. Bảng tra cứu tỷ giá ngoại tệ tiện lợi.",
      keywords: ["chuyển đổi tiền tệ", "tỷ giá usd vnd", "đổi ngoại tệ", "currency converter"]
    }
  }
];

export function getToolBySlug(slug: string): ToolMetadata | undefined {
  return TOOLS_CONFIG.find((t) => t.slug === slug);
}

export function getToolsByCategory(categoryId: string): ToolMetadata[] {
  return TOOLS_CONFIG.filter((t) => t.category === categoryId);
}

export function searchTools(query: string): ToolMetadata[] {
  const q = query.toLowerCase().trim();
  if (!q) return TOOLS_CONFIG;
  return TOOLS_CONFIG.filter(
    (t) =>
      t.name.toLowerCase().includes(q) ||
      t.shortDesc.toLowerCase().includes(q) ||
      t.categoryName.toLowerCase().includes(q) ||
      t.tags.some((tag) => tag.toLowerCase().includes(q))
  );
}
