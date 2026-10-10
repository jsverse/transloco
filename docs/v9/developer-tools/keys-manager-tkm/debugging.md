# Debugging

You can extend the keys manager default logs by setting the `DEBUG` environment variable:

```json
"scripts": {
  "i18n:extract": "DEBUG=tkm:config,tkm:paths transloco extract",
  "i18n:find": "DEBUG=* transloco find"
}
```

Supported namespaces: `tkm:*|config|paths|scopes|extraction`, setting `tkm:*` will print all the debugger logs.
