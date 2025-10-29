/**
 * MicroPop.js
 * A small, accessible, dependency-free JS & CSS library
 * for managing popups including tooltips.
 * Version: 0.1.1
 * License: MIT
 */
const MicroPop = (() => {
  'use strict'

  // Store the popups initialized and the options
  const popups = {}
  const options = {
    identifier: 'data-micropop-id',
    debugMode: false,
    // Popup options
    openClass: 'is-open'
  }

  // Code for generating unique pop ids
  let _generatedIdCount = 0
  options.generateId = () => `micropop-${++_generatedIdCount}`

  /**
   * The Popup class
   * Stores the configurations and manages a single popup instance
   */
  class Popup {
    constructor ({
      popup,
      triggers = [],
      openClass = 'is-open'
    }) {
      // Make triggers an array
      this.triggers = Array.isArray(triggers) ? triggers : [triggers]

      // Determine the popup element
      if (!popup) throw new Error('[MicroPop] No popup was supplied to initialize the popup.')
      this.popup = typeof popup === 'string' ? document.getElementById(popup) : popup

      if (!this.popup) {
        throw new Error('[MicroPop] Could not find the popup element id:', popup || this.triggers[0])
      }

      // Save options
      this.options = { openClass }

      // Binds all methods to the instance
      this.show = this.show.bind(this)
      this.hide = this.hide.bind(this)
      this.toggle = this.toggle.bind(this)

      // Register triggers and initialize the popup
      this.triggerConfigs = triggers.map(trigger => {
        return {
          element: trigger
        }
      })
      this._init()
    }

    _init () {
      // Set aria attributes for accessibility
      this.popup.setAttribute('aria-haspopup', 'true')
      this.popup.setAttribute('aria-expanded', 'false')
      this.popup.setAttribute('aria-hidden', 'true')
    }

    toggle (event) {
      if (event) event.preventDefault()

      if (this.popup.getAttribute('aria-hidden') === 'true') {
        this.show()
      } else {
        this.hide()
      }
    }

    show () {
      if (this.popup.getAttribute('aria-hidden') === 'false') return // Already visible

      this.popup.setAttribute('aria-hidden', 'false')
      this.triggers[0].setAttribute('aria-expanded', 'true')
      this.popup.classList.add(this.options.openClass)
    }

    hide () {
      if (this.popup.getAttribute('aria-hidden') === 'true') return // Already hidden

      this.popup.setAttribute('aria-hidden', 'true')
      this.triggers[0].setAttribute('aria-expanded', 'false')
      this.popup.classList.remove(this.options.openClass)
    }
  }

  // Copied from micromodal-test - https://github.com/mike-vel/Micromodal-test/blob/75209e8a0c3d9040f2c5d96ee5431f1d1e380494/lib/src/index.js#L264
  const _getTargetId = (popup) => {
    if (typeof popup === 'string') return popup

    // If an HTML element is passed, try to derive the id or generate one
    if (popup instanceof HTMLElement) { // eslint-disable-line no-undef
      // We prefer the data-micropop-id attribute
      let targetId = popup.getAttribute(options.identifier)
      if (targetId) return targetId

      // If that doesn't exist, we try the id attribute
      if (popup.id) return popup.id

      // Otherwise, generate a new unique id
      targetId = options.generateId()
      popup.setAttribute(options.identifier, targetId)
      return targetId
    }

    // If neither a string or HTMLElement was passed, return null
    return null
  }

  const initPopup = (config) => {
    const popupConfigs = Object.assign({ openClass: options.openClass }, config)

    if (!popupConfigs.targetPopupId) {
      popupConfigs.targetPopupId = _getTargetId(popupConfigs.popup)
    }

    const targetId = popupConfigs.targetPopupId

    if (popups[targetId]) {
      if (options.debugMode) console.warn('[MicroPop] Popup is already initialized:', targetId)
      return popups[targetId]
    }
    popups[targetId] = new Popup(popupConfigs)

    // Set the identifier attribute to the passed element
    popups[targetId].popup.setAttribute(options.identifier, targetId)

    return popups[targetId]
  }

  const show = popup => {
    const targetId = _getTargetId(popup)

    if (popups[targetId]) {
      popups[targetId].show()
    } else {
      console.warn('[MicroPop]: The popup passed in show() is not initialized')
    }
  }

  const hide = popup => {
    const targetId = _getTargetId(popup)

    if (popups[targetId]) {
      popups[targetId].hide()
    } else {
      console.warn('[MicroPop]: The popup passed in hide() is not initialized')
    }
  }

  const toggle = popup => {
    const targetId = _getTargetId(popup)

    if (popups[targetId]) {
      popups[targetId].toggle()
    } else {
      console.warn('[MicroPop]: The popup passed in toggle() is not initialized')
    }
  }

  // Public APIs
  const exported = Popup
  Object.assign(exported, { initPopup, show, hide, toggle, options, popups })
  return exported
})()

export default MicroPop

if (typeof window !== 'undefined') {
  window.MicroPop = MicroPop
}
