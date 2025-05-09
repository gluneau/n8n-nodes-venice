import type { ISupplyDataFunctions } from 'n8n-workflow';

// Define the OnFailedAttemptHook type
type OnFailedAttemptHook = (error: Error & { code?: string; statusCode?: number }) => Promise<void>;

export function makeN8nLlmFailedAttemptHandler(context: ISupplyDataFunctions, extraHandler?: OnFailedAttemptHook) {
	return async function onFailedAttempt(error: Error & { code?: string; statusCode?: number }) {
		if (extraHandler) {
			await extraHandler(error);
		}

		if (error.statusCode === 401 || error.code === 'EUNAUTHORIZED') {
			// Handle 401 errors
			throw new Error(`Authorization error: Invalid API key or credentials. Check your settings and try again.`);
		}

		if (error.statusCode === 403 || error.code === 'EFORBIDDEN') {
			// Handle 403 errors
			throw new Error(`Access denied: You don't have permission to access this resource.`);
		}

		if (error.statusCode === 429 || error.code === 'ETOOMANY') {
			// Handle rate limit errors
			throw new Error(`Rate limit exceeded: Please try again later or check your rate limits.`);
		}

		// Log detailed error information
		console.error('Venice API error:', {
			message: error.message,
			code: error.code,
			statusCode: error.statusCode,
		});
	};
}
