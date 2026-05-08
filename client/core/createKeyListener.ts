import { KeyCode } from "@shared/types/keyCodeTypes";

export type KeyListenerEventType = "keydown" | "keyup";

export type KeyListenerEvent = {
  type: KeyListenerEventType;
  keyCode: KeyCode;
};

export type KeyListenerHandler = (key: KeyCode) => void;

export type KeyListener = {
  onDown: (handler: KeyListenerHandler) => () => void;
  onUp: (handler: KeyListenerHandler) => () => void;
};

const getKeyCodes = (): number[] => {
  const codes = new Set<number>();
  for (const value of Object.values(KeyCode)) {
    if (typeof value === "number") codes.add(value);
  }
  return [...codes];
};

export const createKeyListener = (): KeyListener => {
  const subscriptionsDown = new Set<KeyListenerHandler>();
  const subscriptionsUp = new Set<KeyListenerHandler>();

  const emit = (type: KeyListenerEventType, keyCode: KeyCode) => {
    if (type === "keydown")
      subscriptionsDown.forEach((handler) => void handler(keyCode));
    else if (type === "keyup")
      subscriptionsUp.forEach((handler) => void handler(keyCode));
  };

  for (const keyCode of getKeyCodes()) {
    mp.keys.bind(keyCode, true, () => emit("keydown", keyCode));
    mp.keys.bind(keyCode, false, () => emit("keyup", keyCode));
  }

  return {
    onDown: (handler) => {
      subscriptionsDown.add(handler);
      return () => subscriptionsDown.delete(handler);
    },
    onUp: (handler) => {
      subscriptionsUp.add(handler);
      return () => subscriptionsUp.delete(handler);
    },
  };
};
