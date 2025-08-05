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
const isLoadingHistory = ref(false);
const hasMoreHistory = ref(true);
const isConnected = ref(false);
let realtimeChannel: RealtimeChannel | null = null;
const vipPinCooldownEndsAt = ref<number | null>(null);
let cooldownTimer: number | undefined;

const currentTime = ref(Date.now());
let timeInterval: number | undefined;

const authStore = useAuthStore();
const uiStore = useUiStore();

const isVipPinOnCooldown = computed(() => {
if (!vipPinCooldownEndsAt.value) return false;
return Date.now() < vipPinCooldownEndsAt.value;
});

const vipPinCooldownSeconds = computed(() => {
if (!isVipPinOnCooldown.value || !vipPinCooldownEndsAt.value) return 0;
return Math.ceil((vipPinCooldownEndsAt.value - Date.now()) / 1000);
});

const temporaryPinnedMessages = computed(() => {
const now = currentTime.value;
return messages.value
.filter(m => m.is_pinned && m.pinned_until && new Date(m.pinned_until).getTime() > now)
.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
.slice(0, 5);
});

const allSortedMessages = computed(() => {
return [...messages.value].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
});

async function fetchOlderMessages() {
if (isLoadingHistory.value || !hasMoreHistory.value) return;
isLoadingHistory.value = true;
try {
const oldestMessage = messages.value[0];
const cursor = oldestMessage ? oldestMessage.created_at : new Date().toISOString();
const olderMessages = await globalChatService.fetchHistory(50, cursor);
if (olderMessages.length > 0) {
messages.value = [...olderMessages, ...messages.value];
} else {
hasMoreHistory.value = false;
}
} catch (e) {
console.error("Error al cargar historial antiguo del chat", e);
} finally {
isLoadingHistory.value = false;
}
}

async function connect() {
if (isConnected.value || !authStore.isAuthenticated) return;
isLoadingHistory.value = true;
try {
const initialMessages = await globalChatService.fetchHistory();
messages.value = initialMessages;
if (initialMessages.length < 50) {
hasMoreHistory.value = false;
}
} catch (e) {
console.error("Error al cargar el historial del chat", e);
}
isLoadingHistory.value = false;
isConnected.value = true;
setupRealtime();

if (!timeInterval) {
timeInterval = window.setInterval(() => {
currentTime.value = Date.now();
}, 1000);
}
}

function setupRealtime() {
if (realtimeChannel) return;
realtimeChannel = supabase.channel("global_chat_realtime");
realtimeChannel
.on("broadcast", { event: "new_message" }, async (payload) => {
const newMessageId = payload.payload.id;
const existing = messages.value.find((m) => m.message_id === newMessageId);
if (existing) return;
const fullMessage = await globalChatService.fetchSingleMessage(newMessageId);
messages.value.push(fullMessage);
})
.on("postgres_changes", { event: "*", schema: "public", table: "global_chat_reactions" }, async (payload) => {
const record = (payload.new as any) || (payload.old as any);
if (!record?.message_id) return;
if (record.user_id === authStore.user?.id) return;
const messageIdToUpdate = record.message_id;
try {
const updatedMessage = await globalChatService.fetchSingleMessage(messageIdToUpdate);
if (updatedMessage) {
messages.value = messages.value.map((msg) => msg.message_id === messageIdToUpdate ? updatedMessage : msg);
}
} catch (error) {
console.error(`Error al refrescar mensaje ${messageIdToUpdate} tras reacción:`, error);
}
})
.subscribe((status, err) => {
if (status === "SUBSCRIBED") console.log("Canal Realtime conectado exitosamente!");
if (status === "CHANNEL_ERROR") console.error("Error en el canal de Realtime:", err);
});
}

function disconnect() {
if (realtimeChannel) {
supabase.removeChannel(realtimeChannel);
realtimeChannel = null;
}
isConnected.value = false;
messages.value = [];
hasMoreHistory.value = true;
if (cooldownTimer) clearTimeout(cooldownTimer);
vipPinCooldownEndsAt.value = null;

if (timeInterval) {
clearInterval(timeInterval);
timeInterval = undefined;
}
}

async function sendMessage(content: string, parentId: number | null, wantsToPin: boolean) {
try {
await globalChatService.postMessage(content, parentId, wantsToPin);
if (wantsToPin && authStore.user?.subscription_tier_id === 3 && !authStore.isAdmin) {
const cooldownDuration = 15000;
vipPinCooldownEndsAt.value = Date.now() + cooldownDuration;
cooldownTimer = window.setTimeout(() => {
vipPinCooldownEndsAt.value = null;
}, cooldownDuration);
}
cancelReply();
} catch (error: any) {
uiStore.showToast({ message: error.response?.data?.message || "No se pudo enviar el mensaje", color: "#EF4444" });
}
}

async function toggleReaction(messageId: number, emoji: string) {
if (!authStore.user) return;
const messageIndex = messages.value.findIndex((m) => m.message_id === messageId);
if (messageIndex === -1) return;
const message = messages.value[messageIndex];
if (!message.reactions) message.reactions = [];
const userId = authStore.user.id;
const existingReactionIndex = message.reactions.findIndex((r) => r.emoji === emoji && r.user_id === userId);
if (existingReactionIndex !== -1) {
message.reactions.splice(existingReactionIndex, 1);
} else {
message.reactions.push({ emoji, user_id: userId });
}
try {
await globalChatService.toggleReaction(messageId, emoji);
} catch (error) {
console.error("Falló la actualización optimista, revirtiendo:", error);
if (existingReactionIndex !== -1) {
message.reactions.push({ emoji, user_id: userId });
} else {
message.reactions = message.reactions.filter((r) => !(r.emoji === emoji && r.user_id === userId));
}
uiStore.showToast({ message: "No se pudo añadir la reacción", color: "#EF4444" });
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
uiStore.showToast({ message: "Error al borrar el mensaje", color: "#EF4444" });
}
}

async function adminPinMessage(messageId: number, unpin: boolean) {
try {
await adminService.pinGlobalMessage(messageId, unpin);
} catch (error) {
uiStore.showToast({ message: "Error al fijar el mensaje", color: "#EF4444" });
}
}

return {
messages,
isLoading: isLoadingHistory,
isConnected,
hasMoreHistory,
allSortedMessages,
temporaryPinnedMessages,
replyingToMessage,
isVipPinOnCooldown,
vipPinCooldownSeconds,
connect,
disconnect,
sendMessage,
toggleReaction,
setReplyingTo,
cancelReply,
adminDeleteMessage,
adminPinMessage,
fetchOlderMessages,
};
});