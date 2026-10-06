declare global {
	namespace App {
		interface Locals {
			account: { id: string; username: string } | null;
		}
	}
}

export {};
