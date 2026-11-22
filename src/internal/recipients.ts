/** Copies readonly recipient arrays into the mutable arrays provider SDKs expect. */
export const recipients = (
  value: string | ReadonlyArray<string> | undefined,
): string | Array<string> | undefined =>
  typeof value === "string" || value === undefined ? value : [...value];

/** Normalizes recipients to an array, for SDKs that only accept lists. */
export const recipientList = (
  value: string | ReadonlyArray<string> | undefined,
): Array<string> | undefined =>
  value === undefined ? undefined : typeof value === "string" ? [value] : [...value];
