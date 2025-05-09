import { BaseTracer } from '@langchain/core/tracers/base';
import { LLMResult } from '@langchain/core/outputs';
import type { ISupplyDataFunctions } from 'n8n-workflow';

// Define a simplified Run interface that mimics LangChain's Run type
interface Run {
  id: string;
  name?: string;
  run_id?: string;
  runId?: string;
  [key: string]: any;
}

/**
 * Custom tracer for n8n LLM integration that handles logging LLM calls, inputs, and responses
 */
export class N8nLlmTracing extends BaseTracer {
	constructor(context: ISupplyDataFunctions) {
		super();
		// Store context if needed for future use
	}

	// Add unique name for the tracer
	get name(): string {
		return 'n8n_llm_tracing';
	}

	// Required abstract method to persist runs
	protected async persistRun(run: Run): Promise<void> {
		// Implementation not needed for n8n tracing
	}

	// Handle different types of tracing events
	protected async _handleLLMStart(run: any): Promise<void> {
		// Log LLM start event
		console.debug(`LLM started: ${run.name}`);
	}

	protected async _handleLLMEnd(run: any, response: LLMResult): Promise<void> {
		// Log LLM response token usage if available
		if (response.llmOutput?.tokenUsage) {
			const { tokenUsage } = response.llmOutput;
			console.debug('LLM token usage:', {
				prompt: tokenUsage.promptTokens,
				completion: tokenUsage.completionTokens,
				total: tokenUsage.totalTokens,
			});
		}
	}

	protected async _handleLLMError(run: any, error: Error): Promise<void> {
		// Log LLM errors
		console.error(`LLM error: ${error.message}`);
	}

	// Implement other required methods
	protected async _handleChainStart(run: any): Promise<void> {
		console.debug(`Chain started: ${run.name}`);
	}

	protected async _handleChainEnd(run: any, output: Record<string, any>): Promise<void> {
		console.debug(`Chain ended: ${run.name}`);
	}

	protected async _handleChainError(run: any, error: Error): Promise<void> {
		console.error(`Chain error: ${error.message}`);
	}

	protected async _handleToolStart(run: any): Promise<void> {
		console.debug(`Tool started: ${run.name}`);
	}

	protected async _handleToolEnd(run: any, output: string): Promise<void> {
		console.debug(`Tool ended: ${run.name}`);
	}

	protected async _handleToolError(run: any, error: Error): Promise<void> {
		console.error(`Tool error: ${error.message}`);
	}

	protected async _handleAgentAction(run: any): Promise<void> {
		console.debug(`Agent action: ${run.runId || run.id}`);
	}

	protected async _handleText(run: any, text: string): Promise<void> {
		// Handle text generation
		console.debug(`Text generated: ${text.substring(0, 50)}...`);
	}

	protected async _handleRetrieverStart(run: any): Promise<void> {
		console.debug(`Retriever started: ${run.name}`);
	}

	protected async _handleRetrieverEnd(run: any, documents: any[]): Promise<void> {
		console.debug(`Retriever ended: ${run.name} - ${documents.length} documents retrieved`);
	}

	protected async _handleRetrieverError(run: any, error: Error): Promise<void> {
		console.error(`Retriever error: ${error.message}`);
	}
}
