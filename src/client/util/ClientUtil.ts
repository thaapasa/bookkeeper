export function stopEventPropagation(event: { stopPropagation?: () => void }): void {
  if (event?.stopPropagation) {
    event.stopPropagation();
  }
}

export function reloadApp() {
  location.reload();
}
