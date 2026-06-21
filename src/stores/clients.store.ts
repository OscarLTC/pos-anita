import { create } from "zustand";
import type { Client, CreateClientInput } from "@/types";
import { clientService } from "@/services/firestore/clients";

interface ClientsState {
  clients: Client[];
  is_loading: boolean;
  loadClients: (store_id: string) => Promise<void>;
  addClient: (store_id: string, input: CreateClientInput) => Promise<Client>;
  /** Refleja localmente un cambio de deuda ya persistido (positivo suma, negativo abona). */
  applyDebt: (client_id: string, amount: number) => void;
}

const sortByDebt = (a: Client, b: Client) => b.debt - a.debt || a.name.localeCompare(b.name);

export const useClientsStore = create<ClientsState>((set) => ({
  clients: [],
  is_loading: false,

  loadClients: async (store_id) => {
    set({ is_loading: true });
    try {
      const clients = await clientService.getAll(store_id);
      set({ clients, is_loading: false });
    } catch (error) {
      console.error("Error cargando clientes:", error);
      set({ is_loading: false });
    }
  },

  addClient: async (store_id, input) => {
    const client = await clientService.create(store_id, input);
    set((s) => ({ clients: [...s.clients, client].sort(sortByDebt) }));
    return client;
  },

  applyDebt: (client_id, amount) =>
    set((s) => ({
      clients: s.clients
        .map((c) => (c.id === client_id ? { ...c, debt: c.debt + amount } : c))
        .sort(sortByDebt),
    })),
}));
