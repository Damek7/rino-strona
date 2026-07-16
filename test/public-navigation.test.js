const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const { setMenuOpen, initNavigation } = require('../public-navigation')

function fakeElement(initialAttributes = {}) {
  const attributes = { ...initialAttributes }
  const classes = new Set()
  const listeners = {}

  return {
    listeners,
    classList: {
      toggle(name, force) {
        if (force) classes.add(name)
        else classes.delete(name)
      },
      contains(name) {
        return classes.has(name)
      },
    },
    getAttribute(name) {
      return attributes[name] ?? null
    },
    setAttribute(name, value) {
      attributes[name] = value
    },
    addEventListener(name, listener) {
      listeners[name] = listener
    },
  }
}

test('setMenuOpen synchronizes menu class and expanded state', () => {
  const toggle = fakeElement({ 'aria-expanded': 'false' })
  const menu = fakeElement()

  setMenuOpen(toggle, menu, true)
  assert.equal(toggle.getAttribute('aria-expanded'), 'true')
  assert.equal(menu.classList.contains('menu-open'), true)

  setMenuOpen(toggle, menu, false)
  assert.equal(toggle.getAttribute('aria-expanded'), 'false')
  assert.equal(menu.classList.contains('menu-open'), false)
})

test('initNavigation toggles the menu and closes it after choosing a link', () => {
  const toggle = fakeElement({ 'aria-expanded': 'false' })
  const menu = fakeElement()
  const navigation = {
    querySelector(selector) {
      return selector === '.mobile-menu-button' ? toggle : menu
    },
  }
  const documentRoot = {
    querySelector(selector) {
      return selector === '.public-navigation' ? navigation : null
    },
  }

  initNavigation(documentRoot)
  toggle.listeners.click()
  assert.equal(toggle.getAttribute('aria-expanded'), 'true')
  assert.equal(menu.classList.contains('menu-open'), true)

  menu.listeners.click({ target: { closest: selector => selector === 'a' ? {} : null } })
  assert.equal(toggle.getAttribute('aria-expanded'), 'false')
  assert.equal(menu.classList.contains('menu-open'), false)
})

test('navigation stylesheet is self-contained and reserves subpage space', () => {
  const css = fs.readFileSync(path.join(__dirname, '..', 'navigation.css'), 'utf8')
  assert.match(css, /\.site-nav\.liquid-glass-nav\s*\{[^}]*margin:\s*0;/s)
  assert.match(css, /\.liquid-glass-nav \.site-logo\s*\{[^}]*display:\s*flex;/s)
  assert.match(css, /\.liquid-glass-nav \.mobile-menu-button\s*\{[^}]*display:\s*none;/s)
  assert.match(css, /\.liquid-glass-nav \.nav-mobile-cta\s*\{[^}]*display:\s*none;/s)
  assert.match(css, /\.public-subpage \.nav-shell\s*\{[^}]*height:\s*78px;[^}]*margin-bottom:\s*0;/s)
  assert.match(css, /@media\s*\(max-width:\s*820px\)[\s\S]*?\.public-subpage \.nav-shell\s*\{[^}]*height:\s*68px;/)
})
