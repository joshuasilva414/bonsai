export type IndexForArray<T extends readonly unknown[]> =
	Exclude<keyof T, keyof unknown[]> extends infer K
		? K extends `${number}`
			? K extends `${infer N extends number}`
				? N
				: never
			: never
		: never;
