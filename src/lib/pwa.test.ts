// @ts-ignore vitest types are not installed in the app tsconfig
import { describe, expect, test, vi } from 'vitest';
vi.mock('virtual:pwa-register', () => ({ registerSW: vi.fn() }));
import { isPreviewHost } from './pwa';

describe('isPreviewHost', () => {
  test.each([
    ['id-preview--5c8a459b-7d28-4dfa-9803-ad1b0d7e7fb7.lovable.app', true],
    ['abc.lovableproject.com', true], ['localhost', true], ['127.0.0.1', true],
    ['intern.puravidafoodbar.nl', false], ['pura-stock-sync.lovable.app', false],
    ['id-preview-2--project.lovable.app', true], ['preview--project.gpt-eng.com', true],
    ['project--project-dev.lovable.app', true], ['lovableproject.com', true],
    ['abc.lovableproject-dev.com', true], ['beta.lovable.dev', true],
    ['preview-v2--shop.example.com', false],
  ])('%s: %s', (host: string, verwacht: boolean) => {
    expect(isPreviewHost(host)).toBe(verwacht);
  });
});