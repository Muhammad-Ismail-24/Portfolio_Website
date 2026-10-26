/**
 * Contact details — one place to edit.
 * Used by the Contact section (and anything else that needs them).
 *
 * Any value left empty is hidden in the Contact section (nothing placeholder is shown).
 */

export const EMAIL = 'contact.muhammadismail01@gmail.com'

export const LINKEDIN_URL = 'https://www.linkedin.com/in/muhammad-ismail-a384b3240'

export const GITHUB_URL = 'https://github.com/Muhammad-Ismail-24'

/** true when a value has been filled in (not empty, not a TODO placeholder) */
export const isSet = (value) => !!value && !/TODO/i.test(value)
