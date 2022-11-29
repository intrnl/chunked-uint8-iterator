# chunked-uint8-iterator

Create chunked iterator from Uint8Array iterables

```js
import { createReadStream } from 'node:fs';
import chunked from '@intrnl/chunked-uint8-iterator';

let stream = createReadStream('./archive.zip');

for (let values of chunked(stream)) {
  // ...
}
```

This will default to yielding 512 bytes of chunks at a time, you can configure
this by passing a number as the second argument.

```js
for (let values of chunked(stream, 1024)) {
  // ...
}
```

If the iterable ends with less than the given chunk size, it will yield the
remaining bytes as is without padding.

## Using web streams

Your web browser might not support using ReadableStream directly as an async
iterable, if that's the case, this library provides `createStreamIterator`
which you can pass directly into `chunked`.


```js
import chunked, { createStreamIterator } from '@intrnl/chunked-uint8-iterator';

let stream = file.stream();

for (let chunks of chunked(createStreamIterator(stream))) {
  // ...
}
```
