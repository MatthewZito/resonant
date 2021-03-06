import { effect, resonant } from '../src'

describe('effect controls', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('stops an active effect', () => {
    const mock = vi.fn()
    const r = resonant({ x: 1, y: 1 })

    const { stop } = effect(() => {
      r.x
      r.y
      mock()
    })

    r.x = 11

    expect(mock).toHaveBeenCalledTimes(2)

    stop()

    r.x = 22
    r.y = 22

    expect(mock).toHaveBeenCalledTimes(2)
  })

  it('starts an inactive effect', () => {
    const mock = vi.fn()
    const r = resonant({ x: 1, y: 1 })

    const { stop, start } = effect(() => {
      r.x
      r.y
      mock()
    })

    r.x = 11
    r.y = 11

    expect(mock).toHaveBeenCalledTimes(3)

    stop()

    r.x = 22
    r.y = 22

    expect(mock).toHaveBeenCalledTimes(3)

    start()

    expect(mock).toHaveBeenCalledTimes(4)

    r.x = 33
    r.y = 33

    expect(mock).toHaveBeenCalledTimes(6)
  })

  it("toggles an effect's active state", () => {
    let isActive = true

    const mock = vi.fn()
    const r = resonant({ x: 1, y: 1 })

    const { toggle } = effect(() => {
      r.x
      r.y
      mock()
    })

    r.x = 11
    r.y = 11

    expect(mock).toHaveBeenCalledTimes(3)

    isActive = toggle()
    expect(isActive).toBe(false)

    r.x = 22
    r.y = 22

    expect(mock).toHaveBeenCalledTimes(3)

    isActive = toggle()
    expect(isActive).toBe(true)

    r.x = 33
    r.y = 33

    expect(mock).toHaveBeenCalledTimes(6)
  })

  it('start and stop are each idempotent', () => {
    const mock = vi.fn()
    const r = resonant({ x: 1 })

    const { start, stop } = effect(() => {
      r.x
      mock()
    })

    expect(mock).toHaveBeenCalledTimes(1)

    r.x++
    expect(mock).toHaveBeenCalledTimes(2)

    start()
    expect(mock).toHaveBeenCalledTimes(2)

    r.x++
    expect(mock).toHaveBeenCalledTimes(3)

    stop()
    expect(mock).toHaveBeenCalledTimes(3)

    r.x++
    expect(mock).toHaveBeenCalledTimes(3)

    stop()
    expect(mock).toHaveBeenCalledTimes(3)

    r.x++
    expect(mock).toHaveBeenCalledTimes(3)
  })

  it('defers initial effect invocation to the `start` handler when passed opts.lazy', () => {
    const mock = vi.fn()
    const r = resonant({ x: 1, y: 1 })

    const { start, toggle } = effect(
      () => {
        r.x
        mock()
      },
      { lazy: true },
    )

    const update = () => {
      r.x++
    }

    const tests: [() => void, number][] = [
      // ON
      [start, 1],
      [update, 2],
      // OFF
      [toggle, 2],
      [update, 2],
      // ON
      [toggle, 3],
      [update, 4],
      // ON
      [start, 4],
      [update, 5],
    ]

    for (const [operation, invocations] of tests) {
      operation()
      expect(mock).toHaveBeenCalledTimes(invocations)
    }
  })
})
