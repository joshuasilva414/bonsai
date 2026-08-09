const legacyDisplayMath = /\\\[([\s\S]*?)\\\]/g;
const legacyInlineMath = /\\\(([^\n]*?)\\\)/g;
const bracketedMathLine = /^[\t ]*\[\s*([^\n]+?)\s*\][\t ]*$/gm;
const bracketedInlineMath = /\[\s*([^\n]+?)\s*\]/g;
const mathSyntax = /\\[A-Za-z]+|[_^](?:\{[^}]+\}|[A-Za-z0-9])/;

function inlineMath(expression: string) {
	return `$${expression.trim()}$`;
}

function displayMath(expression: string) {
	return `\n\n$$\n${expression.trim()}\n$$\n\n`;
}

/**
 * Converts common model-authored TeX delimiters to the dollar delimiters used
 * by remark-math. Bare square brackets are only treated as math when their
 * contents contain recognizable TeX syntax, so ordinary Markdown links and
 * prose remain untouched.
 */
export function normalizeMathDelimiters(markdown: string) {
	return markdown
		.replace(legacyDisplayMath, (_, expression: string) =>
			displayMath(expression),
		)
		.replace(legacyInlineMath, (_, expression: string) =>
			inlineMath(expression),
		)
		.replace(bracketedMathLine, (match, expression: string) =>
			mathSyntax.test(expression) ? displayMath(expression) : match,
		)
		.replace(bracketedInlineMath, (match, expression: string) =>
			mathSyntax.test(expression) ? inlineMath(expression) : match,
		);
}
