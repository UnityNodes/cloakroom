import type { ZamaSDKEvent } from "@zama-fhe/sdk";

type Listener = (event: ZamaSDKEvent) => void;

const listeners = new Set<Listener>();

export const sdkEventBus = {
  emit(event: ZamaSDKEvent) {
    for (const listener of listeners) {
      try {
        listener(event);
      } catch {
        void 0;
      }
    }
  },
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
