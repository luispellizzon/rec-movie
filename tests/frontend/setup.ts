import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers)

// Cleanup after each test
afterEach(() => {
    cleanup()
})

// Mock Firebase
vi.mock('./firebase/config', () => ({
    auth: {
        currentUser: null,
        signInWithEmailAndPassword: vi.fn(),
        createUserWithEmailAndPassword: vi.fn(),
        signOut: vi.fn(),
        onAuthStateChanged: vi.fn(),
    },
    db: {
        collection: vi.fn(),
        doc: vi.fn(),
        getDoc: vi.fn(),
        setDoc: vi.fn(),
        updateDoc: vi.fn(),
        deleteDoc: vi.fn(),
    },
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
})

// setup.ts
class MockIntersectionObserver {
    constructor() { }
    disconnect() { }
    observe() { }
    unobserve() { }
    takeRecords() {
        return [];
    }
}

(globalThis as any).IntersectionObserver = MockIntersectionObserver;
