// This plain class has no i18n-library import or usage, only a comment
// marker. It exercises the early-exit performance path in
// typescript/index.ts that skips AST parsing for such files, while still
// needing to extract keys from the comment marker below.
class PlainClass {
  /**
   * t(early.exit.comment.key)
   */
  method() {}
}
