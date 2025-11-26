
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { expect, afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";

// Add jest-dom matchers
expect.extend(matchers);

// Cleanup DOM after each test
afterEach(() => {
  cleanup();
});


/* --------------------------------------------------
   GLOBAL FIREBASE MOCKS (declared BEFORE vi.mock)
-------------------------------------------------- */
//----------------------------------------------------------
// FIREBASE AUTH MOCK
//----------------------------------------------------------


export const mockAuth = {
  _user: null,
  currentUser() {
    return this._user;
  },
  _setUser(u: any) {
    this._user = u;
  },
};

export const mockCreateUserWithEmailAndPassword = vi.fn(async (_, email) => {
  mockAuth._setUser({
    uid: "u_" + email,
    email,
    displayName: "Mock User",
  });
  mockOnAuthStateChangedCallback?.(mockAuth._user);
  return { user: mockAuth._user };
});

export const mockSignInWithEmailAndPassword = vi.fn(async (_, email) => {
  // Simulate FAILED login
  if (email.includes("wrong")) {
    const error: any = new Error("Invalid credentials");
    error.code = "auth/invalid-credential";
    throw error;
  }

  // Simulate SUCCESS login
  mockAuth._setUser({
    uid: "u_" + email,
    email,
    displayName: "Mock User",
  });

  mockOnAuthStateChangedCallback?.(mockAuth._user);
  return { user: mockAuth._user };
});

export const mockUpdateProfile = vi.fn(async (user, data) => {
  Object.assign(user, data);
  return Promise.resolve();
});

let mockOnAuthStateChangedCallback: any = null;

export const mockOnAuthStateChanged = vi.fn((_auth, cb) => {
  mockOnAuthStateChangedCallback = cb;
  if (mockAuth._user) cb(mockAuth._user);
  return () => { };
});

export const mockSignOut = vi.fn(async () => {
  mockAuth._setUser(null);
  mockOnAuthStateChangedCallback?.(null);
});

vi.mock("firebase/auth", () => ({
  getAuth: () => mockAuth,
  onAuthStateChanged: mockOnAuthStateChanged,
  signInWithEmailAndPassword: mockSignInWithEmailAndPassword,
  createUserWithEmailAndPassword: mockCreateUserWithEmailAndPassword,
  updateProfile: mockUpdateProfile,
  signOut: mockSignOut,
}));

//----------------------------------------------------------
// FIRESTORE MOCKS
//----------------------------------------------------------

export const mockCollectionRef = { _type: "collectionRef" };
export const mockDocRef = { _type: "docRef" };
export const mockQueryRef = { _type: "queryRef" };

export const mockCollection = vi.fn(() => mockCollectionRef);
export const mockDoc = vi.fn(() => mockDocRef);
export const mockQuery = vi.fn(() => mockQueryRef);
export const mockOrderBy = vi.fn(() => ({ _type: "orderBy" }));

export const mockSetDoc = vi.fn(async () => { });
export const mockGetDoc = vi.fn(async () => ({
  exists: () => true,
  data: () => ({ onboardingComplete: false }),
}));

export const mockAddDoc = vi.fn(async () => ({ id: "rec1" }));
export const mockOnSnapshot = vi.fn((_q, cb) => {
  cb({
    forEach: (_fn: any) => { },
  });
  return () => { };
});

vi.mock("firebase/firestore", () => ({
  collection: mockCollection,
  doc: mockDoc,
  query: mockQuery,
  orderBy: mockOrderBy,
  setDoc: mockSetDoc,
  getDoc: mockGetDoc,
  addDoc: mockAddDoc,
  onSnapshot: mockOnSnapshot,

  // ← add this so Vitest stops complaining
  serverTimestamp: vi.fn(() => ({ _serverTimestamp: true })),

  Timestamp: {
    now: () => new Date(),
    fromDate: (d: any) => ({ toDate: () => d }),
  },
}));

/* --------------------------------------------------
   vi.mock CALL — after all mocks above are declared
-------------------------------------------------- */
vi.mock("@/lib/firebase", () => ({
  auth: mockAuth,
  db: {},

  createUserWithEmailAndPassword: mockCreateUserWithEmailAndPassword,
  signInWithEmailAndPassword: mockSignInWithEmailAndPassword,
  onAuthStateChanged: mockOnAuthStateChanged,
  signOut: mockSignOut,

  collection: mockCollection,
  query: mockQuery,
  setDoc: mockSetDoc,
  addDoc: mockAddDoc,
  getDoc: mockGetDoc,
  onSnapshot: mockOnSnapshot,
}));




/* --------------------------------------------------
   Browser API mocks
-------------------------------------------------- */

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// IntersectionObserver mock
class MockIntersectionObserver {
  disconnect() { }
  observe() { }
  unobserve() { }
  takeRecords() {
    return [];
  }
}

(globalThis as any).IntersectionObserver = MockIntersectionObserver;
