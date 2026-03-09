/**
 * Placeholder API / backend logic for "איפה זה?"
 * Replace with Supabase/Firebase when ready.
 */

export type ItemStatus = "owned" | "loaned" | "sold" | "lost";

export interface SavedLocation {
  id: string;
  name: string;
  address?: string;
  lat?: number;
  lng?: number;
}

export interface Item {
  id: string;
  name: string;
  description?: string;
  category: string;
  locationId?: string;
  locationName?: string;
  gps?: { lat: number; lng: number };
  status: ItemStatus;
  imageUri?: string;
  createdAt: string;
  updatedAt: string;
  // Loan fields (when status === "loaned")
  borrowerName?: string;
  borrowerPhone?: string;
  loanDate?: string;
  expectedReturnDate?: string;
  // Lost fields (when status === 'lost')
  lastSeenWhere?: string;
}

export interface ParkingRecord {
  id: string;
  lat: number;
  lng: number;
  notes?: string;
  imageUri?: string;
  createdAt: string;
}

// In-memory store (replace with real DB)
let items: Item[] = [];
let parkings: ParkingRecord[] = [];
let savedLocations: SavedLocation[] = [
  { id: "1", name: "בית" },
  { id: "2", name: "עבודה" },
  { id: "3", name: "הורים" },
];

export const api = {
  getItems: async (): Promise<Item[]> => items,
  addItem: async (item: Omit<Item, "id" | "createdAt" | "updatedAt">): Promise<Item> => {
    const now = new Date().toISOString();
    const newItem: Item = {
      ...item,
      id: `item-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    items = [newItem, ...items];
    return newItem;
  },
  updateItem: async (id: string, updates: Partial<Item>): Promise<Item | null> => {
    const i = items.findIndex((x) => x.id === id);
    if (i === -1) return null;
    items[i] = { ...items[i], ...updates, updatedAt: new Date().toISOString() };
    return items[i];
  },
  deleteItem: async (id: string): Promise<boolean> => {
    const prev = items.length;
    items = items.filter((x) => x.id !== id);
    return items.length < prev;
  },
  getParkings: async (): Promise<ParkingRecord[]> => parkings,
  addParking: async (
    record: Omit<ParkingRecord, "id" | "createdAt">
  ): Promise<ParkingRecord> => {
    const newRecord: ParkingRecord = {
      ...record,
      id: `park-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    parkings = [newRecord, ...parkings];
    return newRecord;
  },
  deleteParking: async (id: string): Promise<boolean> => {
    const prev = parkings.length;
    parkings = parkings.filter((x) => x.id !== id);
    return parkings.length < prev;
  },
  getSavedLocations: async (): Promise<SavedLocation[]> => savedLocations,
  getActiveLoans: (): Item[] => items.filter((i) => i.status === "loaned"),
  getOverdueLoans: (): Item[] =>
    items.filter((i) => {
      if (i.status !== "loaned" || !i.expectedReturnDate) return false;
      return new Date(i.expectedReturnDate) < new Date();
    }),
};
