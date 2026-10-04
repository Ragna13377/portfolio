// Removing an item from the pending pool prevents duplicate active pickups.
export function takeRandomPending(pending: number[], random = Math.random) {
  if (!pending.length) return undefined;
  return pending.splice(Math.floor(random() * pending.length), 1)[0];
}
