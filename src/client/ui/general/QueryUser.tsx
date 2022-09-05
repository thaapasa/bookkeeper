/**
 * Requests a string value from the user
 * @return the string value, or undefined if user cancelled the request
 */
export async function requestStringValue(
  header: string,
  description: string,
  defaultValue?: string
): Promise<string | undefined> {
  // TODO: Implement nicer UI
  const val = window.prompt(`${header}: ${description}`, defaultValue);
  return val ?? undefined;
}
