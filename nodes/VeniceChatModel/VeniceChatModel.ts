import {
  BaseChatModel,
  BaseChatModelParams,
} from "@langchain/core/language_models/chat_models";
import {
  AIMessage,
  BaseMessage,
  MessageType,
} from "@langchain/core/messages";
import { CallbackManagerForLLMRun } from "@langchain/core/callbacks/manager";
import { ChatResult } from "@langchain/core/outputs";
import { getEnvironmentVariable } from "@langchain/core/utils/env";

/**
 * Input to Venice AI's chat completion API
 */
export interface VeniceChatInput extends BaseChatModelParams {
  /**
   * Venice API key
   */
  apiKey?: string;
  /**
   * The model name to use.
   * @default "llama-3.3-70b"
   */
  modelName: string;
  /**
   * The temperature to use for sampling.
   * @default 0.15
   */
  temperature?: number;
  /**
   * The maximum number of tokens to generate.
   * @default 1024
   */
  maxTokens?: number;
  /**
   * Top-p sampling.
   * @default 0.9
   */
  topP?: number;
  /**
   * The frequency penalty to apply to token selection.
   * @default 0
   */
  frequencyPenalty?: number;
  /**
   * The presence penalty to apply to token selection.
   * @default 0
   */
  presencePenalty?: number;
  /**
   * Number of completions to generate.
   * @default 1
   */
  n?: number;
  /**
   * Stop sequences to use for stopping generation.
   */
  stop?: string[] | string;
  /**
   * Random seed for reproducible outputs.
   * @default 42
   */
  seed?: number;
  /**
   * Streaming flag.
   * @default false
   */
  streaming?: boolean;
  /**
   * The maximum number of retries to make.
   * @default 2
   */
  maxRetries?: number;
  /**
   * The base URL to use.
   * @default "https://api.venice.ai/api/v1"
   */
  baseUrl?: string;
  /**
   * Venice-specific parameters
   */
  repetitionPenalty?: number;
  topK?: number;
  minP?: number;
  maxTemp?: number;
  minTemp?: number;
  veniceParameters?: {
    characterSlug?: string;
    enableWebSearch?: 'auto' | 'on' | 'off';
    includeVeniceSystemPrompt?: boolean;
  };
  responseFormat?: {
    type?: string;
    jsonSchema?: string | Record<string, unknown>;
  };
}

/**
 * Wrapper around Venice AI's chat completion API
 */
export class ChatVenice extends BaseChatModel {
  apiKey: string;
  modelName: string;
  temperature: number;
  maxTokens?: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
  n: number;
  stop?: string[] | string;
  seed?: number;
  streaming: boolean;
  maxRetries: number;
  baseUrl: string;
  
  // Venice-specific parameters
  repetitionPenalty?: number;
  topK?: number;
  minP?: number;
  maxTemp?: number;
  minTemp?: number;
  veniceParameters?: {
    characterSlug?: string;
    enableWebSearch?: 'auto' | 'on' | 'off';
    includeVeniceSystemPrompt?: boolean;
  };
  responseFormat?: {
    type?: string;
    jsonSchema?: string | Record<string, unknown>;
  };

  constructor(fields?: Partial<VeniceChatInput>) {
    super(fields ?? {});
    
    this.apiKey = fields?.apiKey ?? getEnvironmentVariable("VENICE_API_KEY") ?? "";
    if (!this.apiKey) {
      throw new Error("Venice API key is required");
    }
    
    this.modelName = fields?.modelName ?? "llama-3.3-70b";
    this.temperature = fields?.temperature ?? 0.15;
    this.maxTokens = fields?.maxTokens ?? 1024;
    this.topP = fields?.topP ?? 0.9;
    this.frequencyPenalty = fields?.frequencyPenalty ?? 0;
    this.presencePenalty = fields?.presencePenalty ?? 0;
    this.n = fields?.n ?? 1;
    this.stop = fields?.stop;
    this.seed = fields?.seed;
    this.streaming = fields?.streaming ?? false;
    this.maxRetries = fields?.maxRetries ?? 2;
    this.baseUrl = fields?.baseUrl ?? "https://api.venice.ai/api/v1";
    
    // Venice-specific parameters
    this.repetitionPenalty = fields?.repetitionPenalty;
    this.topK = fields?.topK;
    this.minP = fields?.minP;
    this.maxTemp = fields?.maxTemp;
    this.minTemp = fields?.minTemp;
    this.veniceParameters = fields?.veniceParameters;
    this.responseFormat = fields?.responseFormat;
  }

  _llmType() {
    return "venice";
  }

  /**
   * Get the identifying parameters for this LLM.
   */
  get identifyingParams() {
    return {
      model_name: this.modelName,
      temperature: this.temperature,
      max_tokens: this.maxTokens,
      top_p: this.topP,
      frequency_penalty: this.frequencyPenalty,
      presence_penalty: this.presencePenalty,
      n: this.n,
    };
  }

  /**
   * Convert messages to the format expected by the Venice API.
   */
  private messagesToVeniceFormat(messages: BaseMessage[]) {
    return messages.map((message) => {
      const role = messageTypeToVeniceRole(message._getType());
      const content = typeof message.content === "string" ? message.content : JSON.stringify(message.content);
      return { role, content };
    });
  }

  /**
   * Call the Venice API with chat messages.
   */
  async _generate(
    messages: BaseMessage[],
    options?: this["ParsedCallOptions"],
    runManager?: CallbackManagerForLLMRun
  ): Promise<ChatResult> {
    const messageList = this.messagesToVeniceFormat(messages);
    
    const params: Record<string, any> = {
      model: this.modelName,
      messages: messageList,
      temperature: this.temperature,
      max_tokens: this.maxTokens,
      top_p: this.topP,
      frequency_penalty: this.frequencyPenalty,
      presence_penalty: this.presencePenalty,
      n: this.n,
      stream: this.streaming,
    };
    
    // Add stop sequences if provided
    if (this.stop) params.stop = this.stop;
    
    // Add seed if provided
    if (this.seed !== undefined) params.seed = this.seed;
    
    // Add Venice-specific parameters
    if (this.repetitionPenalty !== undefined) params.repetition_penalty = this.repetitionPenalty;
    if (this.topK !== undefined) params.top_k = this.topK;
    if (this.minP !== undefined) params.min_p = this.minP;
    if (this.maxTemp !== undefined) params.max_temp = this.maxTemp;
    if (this.minTemp !== undefined) params.min_temp = this.minTemp;
    
    // Add venice_parameters if provided
    if (this.veniceParameters) {
      params.venice_parameters = {};
      if (this.veniceParameters.characterSlug) {
        params.venice_parameters.character_slug = this.veniceParameters.characterSlug;
      }
      if (this.veniceParameters.enableWebSearch) {
        params.venice_parameters.enable_web_search = this.veniceParameters.enableWebSearch;
      }
      if (this.veniceParameters.includeVeniceSystemPrompt !== undefined) {
        params.venice_parameters.include_venice_system_prompt = this.veniceParameters.includeVeniceSystemPrompt;
      }
    }
    
    // Add response_format if provided
    if (this.responseFormat && this.responseFormat.type) {
      params.response_format = { type: this.responseFormat.type };
      if (this.responseFormat.type === 'json_schema' && this.responseFormat.jsonSchema) {
        params.response_format.json_schema = 
          typeof this.responseFormat.jsonSchema === 'string' 
            ? JSON.parse(this.responseFormat.jsonSchema) 
            : this.responseFormat.jsonSchema;
      }
    }

    // Send the API request
    try {
      // Streaming not supported in this implementation yet
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(params),
      });
      
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Venice API returned an error: ${text}`);
      }
      
      const json = await response.json() as any;
      
      const generations = (json.choices || []).map((choice: any) => ({
        text: choice.message?.content || "",
        message: new AIMessage(choice.message?.content || ""),
        generationInfo: {
          finishReason: choice.finish_reason,
          model: json.model,
          ...choice,
        },
      }));
      
      return {
        generations,
        llmOutput: {
          model: json.model,
          usage: json.usage,
          id: json.id,
          created: json.created,
        },
      };
      
    } catch (error) {
      // Retry logic would be implemented here based on maxRetries
      console.error("Error calling Venice API:", error);
      throw error;
    }
  }

  /**
   * Get the token count for a list of messages.
   * Not implemented for Venice at this time.
   */
  async getNumTokensFromMessages(messages: BaseMessage[]): Promise<number> {
    // This is a placeholder. Venice doesn't provide a specific token counting endpoint.
    // A rough estimation would be implemented here in a production environment.
    throw new Error("getNumTokensFromMessages not implemented for Venice");
  }
}

/**
 * Convert a LangChain message type to a Venice API role.
 */
function messageTypeToVeniceRole(type: MessageType): string {
  switch (type) {
    case "system":
      return "system";
    case "human":
      return "user";
    case "ai":
      return "assistant";
    default:
      // For custom message types, fallback to user
      return "user";
  }
}
