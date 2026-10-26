/**
 * Contact details — one place to edit.
 * Used by the Contact section (and anything else that needs them).
 *
 * TODO: fill in EMAIL, LINKEDIN_URL and RESUME_URL below. Until they are set,
 * the Contact section simply hides those rows (nothing placeholder is shown).
 */

// TODO_EMAIL: your real email address, e.g. 'name@domain.com'
export const EMAIL = ''

// TODO_LINKEDIN: your full LinkedIn profile URL, e.g. 'https://www.linkedin.com/in/your-handle'
export const LINKEDIN_URL = ''

export const GITHUB_URL = 'https://github.com/Muhammad-Ismail-24'

// TODO_RESUME: a link to your résumé — a hosted URL, or a file in /public like '/resume.pdf'
export const RESUME_URL = ''

// Shown in the Contact section ("Based in" and the live local-time row)
export const LOCAL_TZ = 'Asia/Karachi'
export const LOCAL_PLACE = 'Pakistan'
export const LOCAL_TZ_LABEL = 'PKT'
export const LOCAL_UTC_OFFSET = 'UTC+5'

/** true when a value has been filled in (not empty, not a TODO placeholder) */
export const isSet = (value) => !!value && !/TODO/i.test(value)
