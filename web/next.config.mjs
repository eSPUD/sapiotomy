import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Pin the file-tracing root to this app so build/deploy don't walk up into
  // unrelated lockfiles (the repo has planning/ and literature_review/ siblings).
  outputFileTracingRoot: __dirname,
  // Route-level code splitting is on by default in the App Router; each page
  // ships only its own simulation code (see performance invariant in task_list.md).
};

export default nextConfig;
