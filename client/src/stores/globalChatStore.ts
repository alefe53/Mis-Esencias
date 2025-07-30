import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { supabase } from "../services/supabaseClient";
import * as globalChatService from "../services/globalChatService";
import * as adminService from "../services/adminService";
import { useAuthStore } from "./authStore";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { useUiStore } from "./uiStore";

export interface ChatAuthor {
id: string;
fullName: string;
avatarUrl: string | null;
subscriptionTier: number;
}
export interface ChatReaction {
emoji: string;
user_id: string;
}
export interface GlobalChatMessage {
message_id: number;
content: string;
created_at: string;
is_pinned: boolean;
pinned_until: string | null;
parent_message_id: number | null;
author: ChatAuthor;
reactions: ChatReaction[] | null;
}

export const useGlobalChatStore = defineStore("globalChat", () => {
const messages = ref<GlobalChatMessage[]>([]);
const replyingToMessage = ref<GlobalChatMessage | null>(null);
const isLoading = ref(false);
const isConnected = ref(false);
let realtimeChannel: RealtimeChannel | null = null;

const authStore = useAuthStore();
const uiStore = useUiStore();

const sortedMessages = computed(() => {
return [...messages.value].sort(
(a, b) =>
new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
);
});

const pinnedMessages = computed(() => {
return sortedMessages.value
.filter((m) => m.is_pinned)
.sort((a, b) => {
if (a.is_pinned && !a.pinned_until && (!b.is_pinned || b.pinned_until))
return -1;
if (b.is_pinned && !b.pinned_until && (!a.is_pinned || a.pinned_until))
return 1;
return (
new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
);
});
});

const regularMessages = computed(() => {
return sortedMessages.value.filter((m) => !m.is_pinned);
});

async function connect() {
if (isConnected.value || !authStore.isAuthenticated) return;

isLoading.value = true;
try {
const initialMessages = await globalChatService.fetchHistory();
messages.value = initialMessages;
} catch (e) {
console.error("Error al cargar el historial del chat", e);
}
isLoading.value = false;
isConnected.value = true;

realtimeChannel = supabase.channel("global_chat_realtime");

realtimeChannel.on("broadcast", { event: "new_message" }, async (payload) => {
const newMessageId = payload.payload.id;
const existing = messages.value.find((m) => m.message_id === newMessageId);
if (existing) return;

const fullMessage = await globalChatService.fetchSingleMessage(newMessageId);
messages.value.push(fullMessage);
});

realtimeChannel.on(
'postgres_changes',
{
event: '*',
schema: 'public',
table: 'global_chat_reactions',
},
async (payload) => {
const record = (payload.new as any) || (payload.old as any);
if (!record?.message_id) return;

// No procesamos eventos causados por nosotros mismos, ya que usamos actualización optimista.
if (record.user_id === authStore.user?.id) return;

const messageIdToUpdate = record.message_id;
try {
const updatedMessage = await globalChatService.fetchSingleMessage(messageIdToUpdate);
// --- FORZAR REACTIVIDAD ---
// En lugar de mutar el array, creamos uno nuevo con .map()
// Esto garantiza que Vue detecte el cambio.
if (updatedMessage) {
messages.value = messages.value.map(msg =>
msg.message_id === messageIdToUpdate ? updatedMessage : msg
);
}
} catch (error) {
console.error(`Error al refrescar mensaje ${messageIdToUpdate} tras reacción:`, error);
}
}
);

realtimeChannel.subscribe((status, err) => {
if (status === 'SUBSCRIBED') {
console.log('Canal Realtime conectado exitosamente!');
}
if (status === 'CHANNEL_ERROR') {
console.error('Error en el canal de Realtime:', err);
}
});
}

function disconnect() {
if (realtimeChannel) {
supabase.removeChannel(realtimeChannel);
realtimeChannel = null;
isConnected.value = false;
messages.value = [];
}
}

async function sendMessage(content: string, parentId: number | null) {
try {
await globalChatService.postMessage(content, parentId);
cancelReply();
} catch (error: any) {
uiStore.showToast({
message: error.response?.data?.message || "No se pudo enviar el mensaje",
color: "#EF4444",
});
}
}

// --- FUNCIÓN MODIFICADA CON ACTUALIZACIÓN OPTIMISTA ---
async function toggleReaction(messageId: number, emoji: string) {
if (!authStore.user) return;

const messageIndex = messages.value.findIndex(m => m.message_id === messageId);
if (messageIndex === -1) return;

const message = messages.value[messageIndex];
if (!message.reactions) message.reactions = [];

const userId = authStore.user.id;
const existingReactionIndex = message.reactions.findIndex(
r => r.emoji === emoji && r.user_id === userId
);

// 1. Actualización Optimista (se ejecuta al instante en la UI)
if (existingReactionIndex !== -1) {
// Si ya reaccionó, la quitamos
message.reactions.splice(existingReactionIndex, 1);
} else {
// Si no, la agregamos
message.reactions.push({ emoji, user_id: userId });
}

// 2. Llamada a la API en segundo plano
try {
await globalChatService.toggleReaction(messageId, emoji);
// La llamada fue exitosa, no hacemos nada más.
} catch (error) {
// Si falla, revertimos el cambio en la UI y mostramos un error.
console.error("Falló la actualización optimista, revirtiendo:", error);
if (existingReactionIndex !== -1) {
// Si la quitamos, la volvemos a poner
message.reactions.push({ emoji, user_id: userId });
} else {
// Si la agregamos, la quitamos
message.reactions = message.reactions.filter(r => !(r.emoji === emoji && r.user_id === userId));
}
uiStore.showToast({
message: "No se pudo añadir la reacción",
color: "#EF4444",
});
}
}

function setReplyingTo(message: GlobalChatMessage | null) {
replyingToMessage.value = message;
}

function cancelReply() {
replyingToMessage.value = null;
}

async function adminDeleteMessage(messageId: number) {
try {
await adminService.deleteGlobalMessage(messageId);
} catch (error) {
uiStore.showToast({
message: "Error al borrar el mensaje",
color: "#EF4444",
});
}
}
async function adminPinMessage(messageId: number, unpin: boolean) {
try {
await adminService.pinGlobalMessage(messageId, unpin);
} catch (error) {
uiStore.showToast({
message: "Error al fijar el mensaje",
color: "#EF4444",
});
}
}

return {
messages,
isLoading,
isConnected,
regularMessages,
pinnedMessages,
replyingToMessage,
connect,
disconnect,
sendMessage,
toggleReaction,
setReplyingTo,
cancelReply,
adminDeleteMessage,
adminPinMessage,
};
});