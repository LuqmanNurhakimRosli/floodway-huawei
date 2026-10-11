// The operator write token, for servers that set VISION_WRITE_TOKEN. It lives in memory only: never in localStorage,
// never in a VITE_ variable, never in the bundle. A reload clears it. This is not user accounts; it only stops
// anonymous writes (add/remove cameras, Telegram relay, AI check) on a deployed demo.
let writeToken = '';

export const setWriteToken = (token: string): void => {
  writeToken = token.trim();
};
export const hasWriteToken = (): boolean => writeToken !== '';
export const authHeaders = (): Record<string, string> => (writeToken ? { Authorization: `Bearer ${writeToken}` } : {});

export const NEEDS_TOKEN_MESSAGE = 'This server only accepts changes from an operator. Enter the operator token under Profile, Operator access.';
