import { PersistLangConfig } from './persist-lang.config';

export function cookiesStorage({ cookieExpiry, storageKey }: PersistLangConfig) {
  return {
    getItem(_) {
      const name = encodeURIComponent(storageKey);
      const regexp = new RegExp('(?:^' + name + '|;\\s*' + name + ')=(.*?)(?:;|$)', 'g');
      const result = regexp.exec(document.cookie);
      return result ? decodeURIComponent(result[1]) : null;
    },
    setItem(key: string, value: string) {
      const name = encodeURIComponent(key);
      const date = new Date();

      date.setTime(date.getTime() + cookieExpiry * 3600000);
      document.cookie = `${name}=${encodeURIComponent(value)};expires=${date.toUTCString()}`;
    },
    removeItem(key: string): void {}
  };
}
