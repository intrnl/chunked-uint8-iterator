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

## Working with Web Streams

Unfortunately browsers hasn't implemented using ReadableStream directly as an
async iterator, in the meantime, you could use this to convert them into one.

```js
function createStreamIterator (stream) {
  // return if browser already supports async iterator in stream
  if (Symbol.asyncIterator in stream) {
    return stream[Symbol.asyncIterator]();
  }

  let reader = stream.getReader();

  return {
    [Symbol.asyncIterator] () {
      return this;
    },
    next () {
      return reader.read();
    },
    return () {
      reader.releaseLock();
    },
    throw () {
      reader.releaseLock();
    },
  };
}
```
