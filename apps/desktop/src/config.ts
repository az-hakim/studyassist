const DEFAULT_APP_URL = "https://www.studyassistant.in";

/** The site the desktop shell wraps. Override with STUDYASSISTANT_URL. */
export const APP_URL = process.env.STUDYASSISTANT_URL || DEFAULT_APP_URL;

/** Origin used to decide what stays inside the shell. */
export const APP_ORIGIN = new URL(APP_URL).origin;
