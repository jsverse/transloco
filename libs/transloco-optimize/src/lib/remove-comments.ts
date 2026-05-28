type Translation = Record<string, string>;

export function removeComments(
  translation: Translation,
  commentsKey = 'comment',
) {
  return Object.keys(translation).reduce((acc, key) => {
    if (!key.split('.').includes(commentsKey)) {
      acc[key] = translation[key];
    }

    return acc;
  }, {} as Translation);
}
