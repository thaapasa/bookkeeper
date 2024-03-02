import { timeout } from 'shared/time';

export async function navigateAndWait(navigate: () => void) {
  const location = window.location.href;
  navigate();
  // Wait for browser to finish navigation
  while (window.location.href === location) {
    await timeout(10);
  }
}
