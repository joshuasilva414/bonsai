import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export type IndexForArray<T extends readonly unknown[]> =
	Exclude<keyof T, keyof unknown[]> extends infer K
		? K extends `${number}`
			? K extends `${infer N extends number}`
				? N
				: never
			: never
		: never;
