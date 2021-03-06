import { cleanup } from './scheduler'
import { effectStack } from './state'

import type { EffectFunction } from './effect'

/**
 * Remove all effect dependencies if active, then stop the effect
 * @param effect
 *
 * @internal
 */
export function stop(effect: EffectFunction) {
  if (effect.active) {
    cleanup(effect)
  }

  effect.active = false
}

/**
 * Start an inactive effect
 * @param effect
 *
 * @internal
 */
export function start(effect: EffectFunction) {
  if (!effect.active) {
    effect.active = true

    run(effect)
  }
}

/**
 * Push the given effect onto the stack, run it, then pop it off
 * @param effect
 *
 * @internal
 */
export function run(effect: EffectFunction) {
  if (!effect.active) {
    return
  }

  if (!effectStack.includes(effect)) {
    cleanup(effect)

    // using try / catch here allows us to both return the effect handler's return value
    // and subsequently pop it off the stack
    try {
      effectStack.push(effect)

      effect.handler()

      return
    } finally {
      effectStack.pop()
    }
  }
}
