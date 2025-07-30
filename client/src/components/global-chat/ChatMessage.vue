<template>
<div
class="message-wrapper"
:class="{ 'pinned-vip': isVipPinned, 'pinned-admin': isAdminPinned }"
>
<img
:src="message.author.avatarUrl || '/perfildefault.jpg'"
class="author-avatar"
@click="handleAvatarClick"
/>
<div class="message-content">
<div class="message-header">
<span class="author-name">{{ message.author.fullName }}</span>
<span v-if="isVipPinned" class="pin-badge vip" title="Mensaje VIP"
>⭐</span
>
<span
v-if="isAdminPinned"
class="pin-badge admin"
title="Mensaje fijado por Admin"
>📌</span
>
<span class="timestamp">{{ formattedTimestamp }}</span>
<div class="message-actions">
<div class="action-button-wrapper">
<button ref="reactButtonRef" @click.stop="toggleQuickSelector" title="Reaccionar">
<svg
xmlns="http://www.w3.org/2000/svg"
width="16"
height="16"
viewBox="0 0 24 24"
fill="none"
stroke="currentColor"
stroke-width="2"
stroke-linecap="round"
stroke-linejoin="round"
>
<circle cx="12" cy="12" r="10"></circle>
<path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
<line x1="9" y1="9" x2="9.01" y2="9"></line>
<line x1="15" y1="9" x2="15.01" y2="9"></line>
</svg>
</button>
</div>
<button @click="handleReply" title="Responder">↪️</button>
<template v-if="authStore.isAdmin">
<button @click="handleAdminDelete" title="Borrar mensaje">
🗑️
</button>
<button
@click="handleAdminPin"
:title="message.is_pinned ? 'Desfijar' : 'Fijar'"
>
📌
</button>
</template>
</div>
</div>
<Teleport to="body">
<div ref="pickerContainerRef" :style="pickerStyle" class="picker-teleported-container">
<QuickEmojiSelector
v-if="showQuickSelector"
@select="onEmojiSelect"
@open-full-picker="handleOpenFullPicker"
@close="showQuickSelector = false"
/>
<EmojiPicker
v-if="showFullPicker"
:native="true"
:display-recent="true"
@select="onEmojiSelect"
/>
</div>
</Teleport>
<div v-if="parentMessage" class="reply-context">
Respondiendo a
<strong>{{ parentMessage.author.fullName }}</strong
>: <span class="reply-text">{{ parentMessage.content }}</span>
</div>
<div class="message-body">
<p>{{ message.content }}</p>
</div>
<div
v-if="message.reactions && message.reactions.length > 0"
class="reactions-container"
>
<div
v-for="(group, emoji) in groupedReactions"
:key="emoji"
class="reaction-pill"
:class="{ 'reacted-by-me': group.reactedByMe }"
@click="handleReaction(emoji as string)"
>
{{ emoji }} {{ group.count }}
</div>
</div>
</div>
</div>
</template>

<script setup lang="ts">
import { computed, type PropType, ref } from 'vue'
import {
useGlobalChatStore,
type GlobalChatMessage,
} from '../../stores/globalChatStore'
import { useAuthStore } from '../../stores/authStore'
import { useImageStore } from '../../stores/imageStore'
import EmojiPicker from 'vue3-emoji-picker'
import 'vue3-emoji-picker/css'
import { useClickOutside } from '../../composables/useClickOutside'
import QuickEmojiSelector from './QuickEmojiSelector.vue'

const props = defineProps({
message: {
type: Object as PropType<GlobalChatMessage>,
required: true,
},
})

const chatStore = useGlobalChatStore()
const authStore = useAuthStore()
const imageStore = useImageStore()

const showQuickSelector = ref(false)
const showFullPicker = ref(false)

const reactButtonRef = ref<HTMLElement>()
const pickerContainerRef = ref<HTMLElement>() 
const pickerStyle = ref({})

useClickOutside(pickerContainerRef, () => {
showQuickSelector.value = false
showFullPicker.value = false
}, reactButtonRef);

const calculatePickerPosition = () => {
if (!reactButtonRef.value) return;
const rect = reactButtonRef.value.getBoundingClientRect();
pickerStyle.value = {
position: 'fixed',
top: `${rect.top - 8}px`, 
left: `${rect.left + rect.width / 2}px`,
transform: 'translate(-50%, -100%)',
};
};

const isVipPinned = computed(
() => props.message.is_pinned && props.message.pinned_until,
)
const isAdminPinned = computed(
() => props.message.is_pinned && !props.message.pinned_until,
)
const parentMessage = computed(() => {
if (!props.message.parent_message_id) return null
return chatStore.messages.find(
(m) => m.message_id === props.message.parent_message_id,
)
})
const groupedReactions = computed(() => {
if (!props.message.reactions) return {}
return props.message.reactions.reduce(
(acc, reaction) => {
if (!acc[reaction.emoji]) {
acc[reaction.emoji] = { count: 0, userIds: [], reactedByMe: false }
}
acc[reaction.emoji].count++
acc[reaction.emoji].userIds.push(reaction.user_id)
if (reaction.user_id === authStore.user?.id) {
acc[reaction.emoji].reactedByMe = true
}
return acc
},
{} as Record<
string,
{ count: number; userIds: string[]; reactedByMe: boolean }
>,
)
})
const handleAvatarClick = () => {
if (!props.message.author.avatarUrl) return
const imageToShow = {
imageUrl: props.message.author.avatarUrl,
description: `Avatar de ${props.message.author.fullName}`,
id: 0,
trackId: null,
}
imageStore.openLightbox([imageToShow], 0)
}
const handleReaction = (emoji: string) => {
chatStore.toggleReaction(props.message.message_id, emoji)
}

const toggleQuickSelector = () => {
if (!showQuickSelector.value) {
calculatePickerPosition();
}
showQuickSelector.value = !showQuickSelector.value
showFullPicker.value = false
}
const handleOpenFullPicker = () => {
calculatePickerPosition(); 
showQuickSelector.value = false
showFullPicker.value = true
}
const onEmojiSelect = (emoji: any) => {
const selectedEmoji = typeof emoji === 'string' ? emoji : emoji.i
handleReaction(selectedEmoji)
showQuickSelector.value = false
showFullPicker.value = false
}
const handleReply = () => {
chatStore.setReplyingTo(props.message)
}
const handleAdminDelete = () => {
if (confirm('¿Seguro que quieres borrar este mensaje?')) {
chatStore.adminDeleteMessage(props.message.message_id)
}
}
const handleAdminPin = () => {
chatStore.adminPinMessage(props.message.message_id, props.message.is_pinned)
}
const formattedTimestamp = computed(() => {
const messageDate = new Date(props.message.created_at)
const today = new Date()
const isToday =
messageDate.getFullYear() === today.getFullYear() &&
messageDate.getMonth() === today.getMonth() &&
messageDate.getDate() === today.getDate()
const timeString = messageDate.toLocaleTimeString('es-AR', {
hour: '2-digit',
minute: '2-digit',
})
if (isToday) {
return `hoy ${timeString}`
} else {
const dateString = messageDate.toLocaleDateString('es-AR', {
day: '2-digit',
month: '2-digit',
year: 'numeric',
})
return `${dateString} ${timeString}`
}
})
</script>

<style scoped>
.message-wrapper {
display: flex;
gap: 0.75rem;
position: relative;
}
.message-wrapper:hover .message-actions {
opacity: 1;
}
.pinned-vip {
background-color: rgba(234, 179, 8, 0.1);
border-left: 3px solid #eab308;
padding: 0.5rem;
margin: -0.5rem;
border-radius: 6px;
}
.pinned-admin {
background-color: rgba(52, 211, 153, 0.1);
border-left: 3px solid #34d399;
padding: 0.5rem;
margin: -0.5rem;
border-radius: 6px;
}
.author-avatar {
width: 36px;
height: 36px;
border-radius: 50%;
flex-shrink: 0;
margin-top: 2px;
object-fit: cover;
cursor: pointer;
transition:
transform 0.2s ease,
box-shadow 0.2s ease;
}
.author-avatar:hover {
transform: scale(1.1);
box-shadow: 0 0 8px rgba(255, 255, 255, 0.5);
}
.message-content {
flex-grow: 1;
}
.message-header {
display: flex;
align-items: center;
gap: 0.5rem;
position: relative;
}
.author-name {
font-weight: 600;
}
.timestamp {
font-size: 0.75rem;
color: #999;
}
.pin-badge {
font-size: 0.8rem;
}
.pin-badge.admin {
color: #34d399;
}
.pin-badge.vip {
color: #fbbf24;
}
.message-body p {
margin: 0.25rem 0 0 0;
white-space: pre-wrap;
word-break: break-word;
}
.message-actions {
position: absolute;
right: 0;
top: 50%;
transform: translateY(-50%);
display: flex;
gap: 0.2rem;
background-color: #3a414b;
padding: 0.15rem 0.4rem;
border-radius: 20px;
border: 1px solid #555;
opacity: 0;
pointer-events: none;
transition: opacity 0.2s ease-in-out;
}
.message-wrapper:hover .message-actions {
opacity: 1;
pointer-events: all;
}
.message-actions button {
background: none;
border: none;
cursor: pointer;
font-size: 0.9rem;
padding: 0.25rem;
line-height: 1;
color: #d1d5db;
}
.message-actions button:hover {
color: #fff;
}
.action-button-wrapper {
position: relative;
}
.picker-teleported-container {
position: fixed; 
z-index: 1100; 
}
.reactions-container {
display: flex;
gap: 0.25rem;
margin-top: 0.5rem;
flex-wrap: wrap;
}
.reaction-pill {
background-color: #3a414b;
border-radius: 10px;
padding: 0.1rem 0.5rem;
font-size: 0.8rem;
cursor: pointer;
border: 1px solid #555;
}
.reaction-pill.reacted-by-me {
background-color: #3b82f6;
border-color: #60a5fa;
color: white;
}
.reply-context {
background-color: rgba(0, 0, 0, 0.2);
padding: 0.25rem 0.5rem;
border-left: 2px solid #555;
font-size: 0.8rem;
margin-bottom: 0.25rem;
border-radius: 4px;
}
.reply-text {
opacity: 0.8;
white-space: nowrap;
overflow: hidden;
text-overflow: ellipsis;
max-width: 200px;
display: inline-block;
vertical-align: bottom;
}
</style>