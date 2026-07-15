// XSS sanitization layer — strips any markup/scripts from user text.
// Defence-in-depth: React escapes on render and we never use dangerouslySetInnerHTML,
// but user text also flows to the LLM, localStorage, and server files.

import xss, { IFilterXSSOptions } from 'xss'

const xssOptions: IFilterXSSOptions = {
  whiteList: {},            // no HTML tags allowed at all
  stripIgnoreTag: true,     // strip unknown tags instead of escaping
  stripIgnoreTagBody: ['script', 'style'],
}

// Control characters except \n and \t
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g

export const sanitize = (input: string): string => {
  if (!input || typeof input !== 'string') return ''
  return xss(input.trim(), xssOptions).replace(CONTROL_CHARS, '')
}

/** Sanitize every string value in an object (shallow + arrays + nested objects). */
export const sanitizeObject = <T extends object>(obj: T): T => {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      out[key] = sanitize(value)
    } else if (Array.isArray(value)) {
      out[key] = value.map(item => (typeof item === 'string' ? sanitize(item) : item))
    } else if (value !== null && typeof value === 'object') {
      out[key] = sanitizeObject(value as Record<string, unknown>)
    } else {
      out[key] = value
    }
  }
  return out as T
}
