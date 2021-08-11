// cookieExpiry: a month
export function cookiesStorage(cookieExpiry = 720) {
  return {
    getItem(key: string) {
      const name = encodeURIComponent(key);
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
