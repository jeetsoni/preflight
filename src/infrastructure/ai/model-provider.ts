import { createProviderRegistry, type LanguageModel } from 'ai';
import { google } from '@ai-sdk/google';
import { anthropic } from '@ai-sdk/anthropic';

/**
 * The single place in the system that knows about concrete LLM providers.
 *
 * Everything else depends only on a `LanguageModel` handle, so switching the
 * provider or model is a configuration change (env vars) — never a code change
 * in the core. Adding a provider = register it here + set the env. This is the
 * mechanism behind "swap Gemini for Claude any time".
 */
const registry = createProviderRegistry({ google, anthropic });

export type ProviderId = 'google' | 'anthropic';

const DEFAULT_MODEL: Record<ProviderId, string> = {
  google: 'gemini-3.5-flash',
  anthropic: 'claude-sonnet-4-6',
};

export interface ModelConfig {
  readonly provider: ProviderId;
  readonly model: string;
}

/** Reads provider/model from the environment, falling back to sane defaults. */
export function resolveModelConfig(env: NodeJS.ProcessEnv = process.env): ModelConfig {
  const provider: ProviderId = env.AI_PROVIDER === 'anthropic' ? 'anthropic' : 'google';
  const model = env.AI_MODEL?.trim() || DEFAULT_MODEL[provider];
  return { provider, model };
}

export function getLanguageModel(cfg: ModelConfig = resolveModelConfig()): LanguageModel {
  // Registry ids take the form "provider:model", e.g. "google:gemini-2.5-flash".
  return registry.languageModel(`${cfg.provider}:${cfg.model}`);
}
