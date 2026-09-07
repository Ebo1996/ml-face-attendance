/**
 * mock/index.ts
 * =============
 * Barrel export for all mock data modules.
 *
 * Import pattern:
 *   import { MOCK_EMPLOYEES, MOCK_ADMIN_DASHBOARD } from '@/mock';
 *
 * NEVER import this barrel from production code paths.
 * These exports are for:
 *   - Development UI (when the backend is not running)
 *   - Unit / integration tests
 *   - Storybook stories
 */

export * from './employees';
export * from './attendance';
export * from './face';
