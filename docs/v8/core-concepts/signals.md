---
description: A list of the Transloco Signal-based API methods and their usages
icon: traffic-light-stop
---

# Signals

## `translateSignal`

Gets the translated value of a key as a Signal.

```typescript
import { translateSignal } from '@jsverse/transloco';

// Basic usage
text = translateSignal('hello');

// Translating multiple keys
textList = translateSignal(['green', 'blue']);

// With parameters
textVar = translateSignal('hello', { variable: 'world' });

// With specific language
textSpanish = translateSignal('hello', { variable: 'world' }, 'es');

// With scope
textTodosScope = translateSignal('hello', { variable: 'world' }, { scope: 'todos' });

// With dynamic signals
dynamicKey = signal('hello');
dynamicParam = signal({ variable: 'world' });
text = translateSignal(this.dynamicKey, this.dynamicParam);
```

## `translateObjectSignal`

Gets the translated object of a key as a Signal.

```typescript
import { translateObjectSignal } from '@jsverse/transloco';

// Basic usage
object = translateObjectSignal('nested.object');
title = object().title;

// With dynamic signals
dynamicKey = signal('nested.object');
dynamicParam = signal({ variable: 'world' });
object = translateObjectSignal(this.dynamicKey, this.dynamicParam);
```

## Integration with Angular Dependency Injection

Both `translateSignal` and `translateObjectSignal` integrate with Angular's dependency injection system. They can be called within an injection context or with an explicitly provided injector.

When no injector is provided, the functions automatically assert that they are being called within an injection context and use the current injector.
