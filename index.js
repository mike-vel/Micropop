/**
 * MicroPop.js
 * A small, accessible, dependency-free JS & CSS library
 * for managing popups including tooltips.
 * Version: 0.2.0 - auto-generate popups based on triggers
 * License: MIT
 */
const MicroPop = (() => {
  'use strict'

  // Store the popups initialized and the options
  const popups = {}
  const options = {
    openTrigger: 'data-micropop-trigger',
    identifier: 'data-micropop-id',
    libraryAttribute: 'data-micropop',
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
      openClass = 'is-open',
      role = null
    }) {
      let derivedRole = null

      // Make triggers an array
      this.triggers = Array.isArray(triggers) ? triggers : [triggers]

      // Determine the popup element
      if (!popup) {
        if (!this.triggers.length) {
          throw new Error('[MicroPop] No popup or trigger were supplied to initialize the popup.')
        }
        // If no popup is passed, derive it from the trigger
        derivedRole = role || this.triggers[0].getAttribute(options.openTrigger).split(' ')[0]
        if (!derivedRole) {
          throw new Error('[MicroPop] No role could be derived from the trigger element.')
        }
        const attrName = options.libraryAttribute + '-' + derivedRole
        const idFromTrigger = this.triggers[0].getAttribute(attrName)
        if (!idFromTrigger) {
          throw new Error('[MicroPop] No popup id could be derived from the trigger element.')
        }
        this.popup = document.getElementById(idFromTrigger)
      } else {
        this.popup = typeof popup === 'string' ? document.getElementById(popup) : popup
      }

      // Save options
      this.options = { openClass, role }

      // Binds all methods to the instance
      this.show = this.show.bind(this)
      this.hide = this.hide.bind(this)
      this.toggle = this.toggle.bind(this)

      // Register triggers and initialize the popup
      this.triggerConfigs = this.triggers.map(trigger => {
        return {
          element: trigger,
          role: role || derivedRole
        }
      })
      this._init()
    }

    _init () {
      // Set aria attributes for accessibility
      this.popup.setAttribute('aria-haspopup', 'true')
      this.popup.setAttribute('aria-expanded', 'false')
      this.popup.setAttribute('aria-hidden', 'true')

      // Attach appropriate role and event listeners to triggers
      this.triggerConfigs.forEach(triggerConfig => {
        const trigger = triggerConfig.element
        const role = triggerConfig.role

        if (role === 'tooltip') {
          // elements that have tooltips
          this.popup.setAttribute('role', 'tooltip')

          trigger.addEventListener('mouseenter', this.show)
          trigger.addEventListener('focus', this.show)
          trigger.addEventListener('mouseleave', this.hide)
          trigger.addEventListener('blur', this.hide)
        } else if (role === 'dialog') {
          // elements that toggle popups
          this.popup.setAttribute('role', 'dialog')

          trigger.addEventListener('click', this.toggle)
        }
      })
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

  const init = config => {
    // Modifies the global options
    Object.assign(options, config)

    // Identifies all of the open triggers in the document
    const triggers = document.querySelectorAll(`[${options.openTrigger}]`)

    // Initialize 1 popup instance per trigger
    triggers.forEach(trigger => {
      const attributesToCheck = trigger.getAttribute(options.openTrigger).split(' ')

      attributesToCheck.forEach(attr => {
        const targetId = trigger.getAttribute(options.libraryAttribute + '-' + attr)
        if (!targetId) return

        initPopup({
          popup: targetId,
          triggers: trigger,
          role: attr
        })
      })
    })
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
      console.warn('[MicroPop] The popup passed in show() is not initialized')
    }
  }

  const hide = popup => {
    const targetId = _getTargetId(popup)

    if (popups[targetId]) {
      popups[targetId].hide()
    } else {
      console.warn('[MicroPop] The popup passed in hide() is not initialized')
    }
  }

  const toggle = popup => {
    const targetId = _getTargetId(popup)

    if (popups[targetId]) {
      popups[targetId].toggle()
    } else {
      console.warn('[MicroPop] The popup passed in toggle() is not initialized')
    }
  }

  // Public APIs
  const exported = Popup
  Object.assign(exported, { init, initPopup, show, hide, toggle, options, popups })
  return exported
})()

/*
export default MicroPop

if (typeof window !== 'undefined') {
  window.MicroPop = MicroPop
}
*/
