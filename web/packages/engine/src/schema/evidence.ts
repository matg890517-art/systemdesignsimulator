import type { Confidence } from '../types.ts'

/** D22: Estimated < Vendor figure < Measured. Result badge is the weakest input. */
export type Evidence = 'estimated' | 'vendor' | 'measured'

const RANK: Record<Evidence, number> = {
  estimated: 0,
  vendor: 1,
  measured: 2,
}

export function evidenceFromConfidence(confidence: Confidence): Evidence {
  return confidence
}

export function weakestEvidence(...labels: Evidence[]): Evidence {
  let worst: Evidence = 'measured'
  for (const label of labels) {
    if (RANK[label] < RANK[worst]) worst = label
  }
  return labels.length ? worst : 'estimated'
}

export function canShowMeasured(inputs: Evidence[]): boolean {
  return inputs.length > 0 && inputs.every((label) => label === 'measured')
}
