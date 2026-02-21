/**
 * @thesenses/core (ESM wrapper)
 * Provides ESM exports for frontend bundlers while keeping CJS for Node.
 */
import cjs from './index.cjs';

export const calculateArchetype = cjs.calculateArchetype;
export const getInsights = cjs.getInsights;
export const ARCHETYPES = cjs.ARCHETYPES;

export const getTrustColor = cjs.getTrustColor;
export const getTrustBgColor = cjs.getTrustBgColor;
export const isTrustVerified = cjs.isTrustVerified;
export const TRUST_THRESHOLDS = cjs.TRUST_THRESHOLDS;
export const TERMS = cjs.TERMS;

export const testMachine = cjs.testMachine;
export const evaluationSchema = cjs.evaluationSchema;
export const jobProfiles = cjs.jobProfiles;

export default cjs;
