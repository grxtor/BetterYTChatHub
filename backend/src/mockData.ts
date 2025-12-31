import type { ChatMessage } from '@shared/chat';
import EventEmitter from 'eventemitter3';
import crypto from 'crypto';

export function trimMessages(store: ChatMessage[], max = 200) {
    if (store.length > max) {
        store.splice(0, store.length - max);
    }
}

export function seedMockMessages(store: ChatMessage[], emitter: EventEmitter<{ update: (msg: ChatMessage | null) => void }>) {
    // Generate initial message
    const initialMsg = generateMockMessage();
    store.push(initialMsg);

    return setInterval(() => {
        const msg = generateMockMessage();
        store.push(msg);
        trimMessages(store);
    }, 2000); // Every 2 seconds
}

function generateMockMessage(): ChatMessage {
    const types = ['normal', 'normal', 'normal', 'member', 'superchat'];
    const type = types[Math.floor(Math.random() * types.length)];

    // Use publishedAt instead of timestamp
    const base: ChatMessage = {
        id: crypto.randomUUID(),
        author: getRandomName(),
        authorPhoto: `https://ui-avatars.com/api/?name=${Math.random()}&background=random`,
        text: getRandomText(),
        publishedAt: new Date().toISOString(),
        isModerator: false,
        isVerified: false
    };

    if (type === 'member') {
        base.isMember = true;
        base.membershipLevel = 'Gold Member';
        base.text = 'Just joined the membership!';
        base.runs = [{ text: 'Just joined the membership!' }];
    } else if (type === 'superchat') {
        base.superChat = {
            amount: '$10.00',
            currency: 'USD',
            color: '#FF0000',
            stickerUrl: Math.random() > 0.5 ? 'https://lh3.googleusercontent.com/sticker' : undefined
        };
        base.text = 'This is a super chat message!';
        base.runs = [{ text: 'This is a super chat message!' }];
    } else {
        base.runs = [{ text: base.text || '' }];
    }

    return base;
}

function getRandomName() {
    const names = ['Alice', 'Bob', 'Charlie', 'David', 'Eve', 'Frank', 'Grace', 'Heidi'];
    return names[Math.floor(Math.random() * names.length)];
}

function getRandomText() {
    const texts = [
        'Hello World!',
        'This is a great stream!',
        'Can you play that song again?',
        'PogChamp',
        'LUL',
        'So cool!',
        'Greetings from Germany',
        'How does this work?'
    ];
    return texts[Math.floor(Math.random() * texts.length)];
}
