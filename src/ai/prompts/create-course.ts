export function createCoursePrompt(
	strings: TemplateStringsArray,
	...values: unknown[]
) {
	const description = strings.reduce(
		(result, string, index) =>
			`${result}${string}${index < values.length ? String(values[index]) : ""}`,
		"",
	);

	return `
Create a comprehensive curriculum outline for a course with the following description:

${description.trim()}
`.trim();
}
