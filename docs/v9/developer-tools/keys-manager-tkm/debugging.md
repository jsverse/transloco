# Debugging

You can extend the keys manager default logs by setting the `DEBUG` environment variable:

```json
"scripts": {
  "i18n:extract": "DEBUG=tkm:config,tkm:paths transloco-keys-manager extract",
  "i18n:find": "DEBUG=* transloco-keys-manager find"
}
```

Supported namespaces: `tkm:*|config|paths|scopes|extraction`, setting `tkm:*` will print all the debugger logs.
