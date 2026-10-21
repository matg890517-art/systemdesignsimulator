import { describe, expect, it } from 'vitest'
import { conservationHolds } from './conservation.ts'
import { chainTopology, edge, generator, worker, workloadAt } from './fixtures.ts'
import { runFluid } from './run.ts'

describe('J1 flow conservation, fluid', () => {
  it('holds the identity offered = admitted + rejected + network drop', () => {
    expect(
      conservationHolds({
        offered: 200,
        admitted: 160,
        rejected: 40,
        networkDrop: 0,
      }),
    ).toBe(true)
  })

  it('holds at every tick for a stable worker pool', () => {
    const result = runFluid(chainTopology(), workloadAt(150))
    const last = result.steps.at(-1)
    if (!last) throw new Error('no steps')
    const pool = last.components.pool.read
    expect(pool.admitted).toBeCloseTo(150, 9)
    expect(pool.rejected).toBeCloseTo(0, 9)
    expect(pool.completed).toBeCloseTo(150, 9)
    expect(pool.backlog).toBeLessThan(1)
  })

  it('puts 84 AKS transcode slots near 95% at 2 uploads/s', () => {
    const servers = 84
    const serviceMs = 40_000
    const result = runFluid(
      {
        components: [
          generator('uploaders'),
          worker('aks', { servers, serviceMs, queue: 200 }),
        ],
        edges: [edge('up-aks', 'uploaders', 'aks')],
      },
      {
        durationSec: 8,
        dtSec: 0.1,
        seed: 4821,
        offered: { uploaders: { read: 2 } },
      },
    )
    const last = result.steps.at(-1)
    if (!last) throw new Error('no steps')
    const mu = servers / (serviceMs / 1000)
    expect(last.components.aks.read.completed / mu).toBeCloseTo(2 / mu, 6)
    expect(2 / mu).toBeCloseTo(0.952, 3)
  })

  it('drops AKS utilization toward 83% when slots rise from 84 to 97', () => {
    const serviceMs = 40_000
    const offered = 2
    const raised = 97
    const result = runFluid(
      {
        components: [
          generator('uploaders'),
          worker('aks', { servers: raised, serviceMs, queue: 200 }),
        ],
        edges: [edge('up-aks', 'uploaders', 'aks')],
      },
      {
        durationSec: 8,
        dtSec: 0.1,
        seed: 4821,
        offered: { uploaders: { read: offered } },
      },
    )
    const last = result.steps.at(-1)
    if (!last) throw new Error('no steps')
    const mu = raised / (serviceMs / 1000)
    expect(last.components.aks.read.completed / mu).toBeCloseTo(offered / mu, 6)
    expect(offered / mu).toBeCloseTo(0.825, 3)
  })

  it('fills the queue then rejects the surplus at 200 rps', () => {
    const result = runFluid(chainTopology(), workloadAt(200, { durationSec: 2 }))
    const last = result.steps.at(-1)
    if (!last) throw new Error('no steps')
    const pool = last.components.pool.read
    expect(pool.admitted).toBeCloseTo(160, 6)
    expect(pool.rejected).toBeCloseTo(40, 6)
    expect(pool.backlog).toBeCloseTo(50, 6)
  })
})
