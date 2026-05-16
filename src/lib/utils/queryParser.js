const TOKEN_PATTERN = /^(tag|priority|is|due|category|sort):(.+)$/i;

/**
 * Parse search text into structured tokens and plain text.
 * Returns { tokens: [{ key, value }], plainText: string }
 *
 * @param {string} text
 * @returns {{ tokens: Array<{key:string, value:string}>, plainText: string }}
 */
export function parseQuery(text) {
	if (!text || typeof text !== 'string') {
		return { tokens: [], plainText: '' };
	}

	const tokens = [];
	const remaining = [];
	const parts = text.trim().split(/\s+/);

	for (const part of parts) {
		if (!part) continue;
		const match = part.match(TOKEN_PATTERN);
		if (match) {
			tokens.push({ key: match[1].toLowerCase(), value: match[2].trim() });
		} else {
			remaining.push(part);
		}
	}

	return {
		tokens,
		plainText: remaining.join(' ').trim()
	};
}

/**
 * Serialize query parts back into a single search string.
 *
 * @param {Array<{key:string, value:string}>} tokens
 * @param {string} [plainText='']
 * @returns {string}
 */
export function stringifyQuery(tokens, plainText = '') {
	const tokenText = (tokens || [])
		.filter((t) => t && t.key && t.value)
		.map((t) => `${t.key}:${t.value}`)
		.join(' ')
		.trim();
	const text = (plainText || '').trim();
	return [tokenText, text].filter(Boolean).join(' ').trim();
}
