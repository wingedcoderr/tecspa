import adapterStatic from "@sveltejs/adapter-static";
import adapterVercel from "@sveltejs/adapter-vercel";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import process from "node:process";

const isTauriBuild = Boolean(process.env.TAURI_ENV_PLATFORM);

const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: isTauriBuild
			? adapterStatic({ fallback: "index.html" })
			: adapterVercel(),
	},
};

export default config;