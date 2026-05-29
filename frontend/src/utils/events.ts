// Minimal app-wide event bus so any write (create/delete from any screen or the
// global "+" modal) can notify every data hook to refetch. Keeps the UI in sync
// without a heavy global-state library.

type Listener = () => void;

const listeners = new Set<Listener>();

/** Subscribe to data-changed events. Returns an unsubscribe function. */
export function onDataChanged(listener: Listener): () => void {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

/** Notify all subscribers that server data changed and should be refetched. */
export function emitDataChanged(): void {
    listeners.forEach((l) => l());
}
