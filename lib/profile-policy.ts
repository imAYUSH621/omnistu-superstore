import {z} from 'zod';
/** Only the owner display name is editable here, never role, email or ID. */
export const profileNameSchema=z.string().trim().min(3,'Name must be at least 3 characters').max(120,'Name must be at most 120 characters');
export function profileName(input:unknown){if(!input||typeof input!=='object')return null;const parsed=profileNameSchema.safeParse((input as Record<string,unknown>).name);return parsed.success?parsed.data:null}
