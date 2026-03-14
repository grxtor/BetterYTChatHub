import type { ChatMessage } from '@shared/chat';
import EventEmitter from 'eventemitter3';
import crypto from 'crypto';

const MAX_MESSAGES = 500;
const MAX_REGULAR_MESSAGES = 200;

export function trimMessages(store: ChatMessage[]) {
  // 1. Hard limit: Remove absolute oldest if we exceed MAX_MESSAGES
  if (store.length > MAX_MESSAGES) {
    store.splice(0, store.length - MAX_MESSAGES);
  }

  // 2. Soft limit for regular messages:
  // Amortize trimming by allowing it to go 50 over the limit before trimming down.
  const isRegular = (msg: ChatMessage) => !msg.superChat && !msg.membershipGift && !msg.membershipGiftPurchase;
  
  // Count current regular messages
  let regularIndices: number[] = [];
  for (let i = 0; i < store.length; i++) {
    if (isRegular(store[i])) {
      regularIndices.push(i);
    }
  }

  // Only trim when we are 50 messages OVER the limit
  if (regularIndices.length > MAX_REGULAR_MESSAGES + 50) {
    const toRemoveCount = regularIndices.length - MAX_REGULAR_MESSAGES;
    const indicesToRemove = new Set(regularIndices.slice(0, toRemoveCount));
    
    // Filter the store in-place to remove the oldest regular messages
    const kept = store.filter((_, index) => !indicesToRemove.has(index));
    store.length = 0;
    store.push(...kept);
  }
}
