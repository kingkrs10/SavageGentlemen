import { AiAssistantConfig } from "@shared/schema";

export interface AiMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AiResponse {
  message: string;
  tokenCount?: number;
  cost?: number;
  processingTime: number;
}

export interface AiProvider {
  name: string;
  sendMessage(messages: AiMessage[], config: AiAssistantConfig): Promise<AiResponse>;
  validateConfig(config: AiAssistantConfig): boolean;
}

// OpenAI Provider
export class OpenAIProvider implements AiProvider {
  name = 'openai';

  async sendMessage(messages: AiMessage[], config: AiAssistantConfig): Promise<AiResponse> {
    const startTime = Date.now();
    
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: config.model,
          messages: messages,
          temperature: parseFloat(config.temperature?.toString() || '0.7'),
          max_tokens: config.maxTokens,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const processingTime = Date.now() - startTime;

      return {
        message: data.choices[0].message.content,
        tokenCount: data.usage?.total_tokens,
        cost: this.calculateCost(data.usage?.total_tokens || 0, config.model),
        processingTime,
      };
    } catch (error) {
      console.error('OpenAI Provider Error:', error);
      throw error;
    }
  }

  validateConfig(config: AiAssistantConfig): boolean {
    return !!(config.apiKey && config.model && config.model.startsWith('gpt'));
  }

  private calculateCost(tokens: number, model: string): number {
    // Approximate costs per 1000 tokens (in cents)
    const costs: { [key: string]: number } = {
      'gpt-4': 6.0,
      'gpt-4-turbo': 3.0,
      'gpt-3.5-turbo': 0.2,
    };
    
    const costPer1000 = costs[model] || 1.0;
    return Math.round((tokens / 1000) * costPer1000);
  }
}

// Anthropic Provider
export class AnthropicProvider implements AiProvider {
  name = 'anthropic';

  async sendMessage(messages: AiMessage[], config: AiAssistantConfig): Promise<AiResponse> {
    const startTime = Date.now();
    
    try {
      // Convert messages to Anthropic format
      const systemMessage = messages.find(m => m.role === 'system')?.content || '';
      const userMessages = messages.filter(m => m.role !== 'system');

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': config.apiKey!,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: config.model,
          max_tokens: config.maxTokens,
          temperature: parseFloat(config.temperature?.toString() || '0.7'),
          system: systemMessage,
          messages: userMessages,
        }),
      });

      if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const processingTime = Date.now() - startTime;

      return {
        message: data.content[0].text,
        tokenCount: data.usage?.input_tokens + data.usage?.output_tokens,
        cost: this.calculateCost(data.usage?.input_tokens + data.usage?.output_tokens || 0, config.model),
        processingTime,
      };
    } catch (error) {
      console.error('Anthropic Provider Error:', error);
      throw error;
    }
  }

  validateConfig(config: AiAssistantConfig): boolean {
    return !!(config.apiKey && config.model && config.model.startsWith('claude'));
  }

  private calculateCost(tokens: number, model: string): number {
    // Approximate costs per 1000 tokens (in cents)
    const costs: { [key: string]: number } = {
      'claude-3-opus': 1.5,
      'claude-3-sonnet': 0.3,
      'claude-3-haiku': 0.025,
    };
    
    const costPer1000 = costs[model] || 0.3;
    return Math.round((tokens / 1000) * costPer1000);
  }
}

// Google Provider
export class GoogleProvider implements AiProvider {
  name = 'google';

  async sendMessage(messages: AiMessage[], config: AiAssistantConfig): Promise<AiResponse> {
    const startTime = Date.now();
    
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: messages.map(m => ({
            parts: [{ text: m.content }],
            role: m.role === 'assistant' ? 'model' : 'user',
          })),
          generationConfig: {
            temperature: parseFloat(config.temperature?.toString() || '0.7'),
            maxOutputTokens: config.maxTokens,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Google API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const processingTime = Date.now() - startTime;

      return {
        message: data.candidates[0].content.parts[0].text,
        tokenCount: data.usageMetadata?.totalTokenCount,
        cost: this.calculateCost(data.usageMetadata?.totalTokenCount || 0, config.model),
        processingTime,
      };
    } catch (error) {
      console.error('Google Provider Error:', error);
      throw error;
    }
  }

  validateConfig(config: AiAssistantConfig): boolean {
    return !!(config.apiKey && config.model && config.model.includes('gemini'));
  }

  private calculateCost(tokens: number, model: string): number {
    // Approximate costs per 1000 tokens (in cents)
    const costs: { [key: string]: number } = {
      'gemini-pro': 0.05,
      'gemini-pro-vision': 0.05,
    };
    
    const costPer1000 = costs[model] || 0.05;
    return Math.round((tokens / 1000) * costPer1000);
  }
}

// Custom Provider for self-hosted models
export class CustomProvider implements AiProvider {
  name = 'custom';

  async sendMessage(messages: AiMessage[], config: AiAssistantConfig): Promise<AiResponse> {
    const startTime = Date.now();
    
    try {
      const response = await fetch(config.customEndpoint!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(config.apiKey && { 'Authorization': `Bearer ${config.apiKey}` }),
        },
        body: JSON.stringify({
          model: config.model,
          messages: messages,
          temperature: parseFloat(config.temperature?.toString() || '0.7'),
          max_tokens: config.maxTokens,
        }),
      });

      if (!response.ok) {
        throw new Error(`Custom API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const processingTime = Date.now() - startTime;

      return {
        message: data.choices?.[0]?.message?.content || data.response || data.text,
        tokenCount: data.usage?.total_tokens,
        cost: 0, // Custom endpoints don't have standardized pricing
        processingTime,
      };
    } catch (error) {
      console.error('Custom Provider Error:', error);
      throw error;
    }
  }

  validateConfig(config: AiAssistantConfig): boolean {
    return !!(config.customEndpoint && config.model);
  }
}

// AI Service Manager
export class AiService {
  private providers: Map<string, AiProvider> = new Map();

  constructor() {
    this.providers.set('openai', new OpenAIProvider());
    this.providers.set('anthropic', new AnthropicProvider());
    this.providers.set('google', new GoogleProvider());
    this.providers.set('custom', new CustomProvider());
  }

  async sendMessage(messages: AiMessage[], config: AiAssistantConfig): Promise<AiResponse> {
    const provider = this.providers.get(config.provider);
    
    if (!provider) {
      throw new Error(`Unsupported AI provider: ${config.provider}`);
    }

    if (!provider.validateConfig(config)) {
      throw new Error(`Invalid configuration for provider: ${config.provider}`);
    }

    // Add system prompt if provided
    if (config.systemPrompt && !messages.find(m => m.role === 'system')) {
      messages.unshift({
        role: 'system',
        content: config.systemPrompt,
      });
    }

    return await provider.sendMessage(messages, config);
  }

  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  getProviderModels(provider: string): string[] {
    const models: { [key: string]: string[] } = {
      openai: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
      anthropic: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
      google: ['gemini-pro', 'gemini-pro-vision'],
      custom: ['custom-model'],
    };

    return models[provider] || [];
  }
}

export const aiService = new AiService();