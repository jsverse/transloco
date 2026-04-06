import { removeComments } from './remove-comments';

describe('removeComments', () => {
  it(`GIVEN a translation with a top-level comment key
      WHEN removeComments is called
      THEN it should remove the comment key and keep others`, () => {
    const translation = {
      hello: 'world',
      comment: 'this is a comment',
    };

    expect(removeComments(translation)).toEqual({ hello: 'world' });
  });

  it(`GIVEN a translation with nested comment keys (e.g. features.comment.01)
      WHEN removeComments is called
      THEN it should remove all keys containing 'comment' as a path segment`, () => {
    const translation = {
      hello: 'world',
      'features.comment.01': '---',
      'features.comment.02': '--- Feature translations below ---',
      'features.comment.03': '---',
      'features.title': 'Features',
    };

    expect(removeComments(translation)).toEqual({
      hello: 'world',
      'features.title': 'Features',
    });
  });

  it(`GIVEN a translation with a custom comments key
      WHEN removeComments is called with that custom key
      THEN it should remove only keys containing that segment`, () => {
    const translation = {
      hello: 'world',
      'section.separator.01': '---',
      'section.title': 'My Section',
    };

    expect(removeComments(translation, 'separator')).toEqual({
      hello: 'world',
      'section.title': 'My Section',
    });
  });

  it(`GIVEN a translation with keys that contain the comments key as a substring (e.g. 'no-comment', 'commentary')
      WHEN removeComments is called
      THEN it should not remove those keys`, () => {
    const translation = {
      'no-comment': 'keep me',
      commentary: 'keep me too',
    };

    expect(removeComments(translation)).toEqual(translation);
  });

  it(`GIVEN a translation where every key is a comment
      WHEN removeComments is called
      THEN it should return an empty object`, () => {
    const translation = {
      comment: 'removed',
      'section.comment.01': 'removed',
    };

    expect(removeComments(translation)).toEqual({});
  });
});
