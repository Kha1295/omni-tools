export interface GuestToolLogItem {
  id: string;
  toolId: string;
  title: string;
  inputData: Record<string, unknown>;
  resultData: Record<string, unknown>;
  createdAt: string;
}

const STORAGE_KEY = "omni_guest_tool_history";
const MAX_GUEST_ITEMS = 50;

export function getGuestHistory(): GuestToolLogItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.warn("Could not read guest history from localStorage:", err);
    return [];
  }
}

export function saveGuestHistoryItem(
  data: Omit<GuestToolLogItem, "id" | "createdAt">
): GuestToolLogItem {
  const newItem: GuestToolLogItem = {
    ...data,
    id: `guest_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
  };

  if (typeof window !== "undefined") {
    try {
      const items = getGuestHistory();
      // Thêm vào đầu danh sách, giới hạn MAX_GUEST_ITEMS
      const updated = [newItem, ...items.filter((i) => i.id !== newItem.id)].slice(
        0,
        MAX_GUEST_ITEMS
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent("omni:guest-history-updated"));
    } catch (err) {
      console.warn("Failed to write guest history to localStorage:", err);
    }
  }

  return newItem;
}

export function removeGuestHistoryItem(id: string): void {
  if (typeof window === "undefined") return;
  try {
    const items = getGuestHistory();
    const updated = items.filter((i) => i.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("omni:guest-history-updated"));
  } catch (err) {
    console.warn("Failed to remove item from guest history:", err);
  }
}

export function clearGuestHistory(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent("omni:guest-history-updated"));
  } catch (err) {
    console.warn("Failed to clear guest history:", err);
  }
}
