// Vitest doesn't apply Next's bundler-side aliasing that makes the real "server-only"
// package a safe no-op on the server and a hard error on the client — so tests alias the
// import to this empty stub instead (see vitest.config.ts).
export {};
