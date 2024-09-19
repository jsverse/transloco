import { PersistStorage } from './persist-lang.types';

const millisecondsInHour = 3_600_000;
const hoursInMonth = 720;

export function cookiesStorage(cookieExpiry = hoursInMonth): PersistStorage {
  return {
    getItem(key: string) {
      const name = encodeURIComponent(key);
      const regexp = new RegExp(
        '(?:^' + name + '|;\\s*' + name + ')=(.*?)(?:;|$)',
        'g',
      );
      const result = regexp.exec(document.cookie);

      return result ? decodeURIComponent(result[1]) : null;
    },
    setItem(key: string, value: string) {
      const name = encodeURIComponent(key);
      const date = new Date();
      date.setTime(date.getTime() + cookieExpiry * millisecondsInHour);
      document.cookie = `${name}=${encodeURIComponent(
        value,
      )};expires=${date.toUTCString()};path=/`;
    },
    // eslint-disable-next-line  @typescript-eslint/no-empty-function
    removeItem(): void {},
  };
}
