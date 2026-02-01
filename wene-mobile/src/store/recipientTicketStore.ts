import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'wene:recipient_tickets';

export interface RecipientTicket {
  eventId: string;
  eventName: string;
  joinedAt: number;
}

interface RecipientTicketStore {
  tickets: RecipientTicket[];
  isLoading: boolean;
  loadTickets: () => Promise<void>;
  addTicket: (ticket: RecipientTicket) => Promise<void>;
  isJoined: (eventId: string) => boolean;
}

const loadFromStorage = async (): Promise<RecipientTicket[]> => {
  const value = await AsyncStorage.getItem(STORAGE_KEY);
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as RecipientTicket[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveToStorage = async (tickets: RecipientTicket[]): Promise<void> => {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
};

export const useRecipientTicketStore = create<RecipientTicketStore>((set, get) => ({
  tickets: [],
  isLoading: false,

  loadTickets: async () => {
    set({ isLoading: true });
    try {
      const tickets = await loadFromStorage();
      set({ tickets, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  addTicket: async (ticket: RecipientTicket) => {
    const { tickets } = get();
    if (tickets.some((t) => t.eventId === ticket.eventId)) return;
    const next = [...tickets, ticket];
    await saveToStorage(next);
    set({ tickets: next });
  },

  isJoined: (eventId: string) => {
    return get().tickets.some((t) => t.eventId === eventId);
  },
}));
