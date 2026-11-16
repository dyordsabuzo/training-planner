import { FOCUS } from "../others/AgendaRow";

// Shared by the auth panel's tabs and forms, so every control has the same
// height and pill shape.
const PILL = `min-h-11 w-full rounded-full px-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${FOCUS}`;
export const PRIMARY_BUTTON = `${PILL} bg-primary text-white hover:bg-primary-700 shadow-sm shadow-primary/30`;
export const TEXT_LINK = `min-h-11 text-xs font-semibold text-primary hover:underline hover:text-primary-700 rounded ${FOCUS}`;

// A faint outline on the text fields (Input's own border is transparent until
// focused); focus and error states keep their own colours.
export const FIELD = "[&_input:not(:focus)]:border-gray-200 dark:[&_input:not(:focus)]:border-gray-700";
