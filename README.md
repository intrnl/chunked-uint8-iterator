# chunked-uint8-iterator

Create chunked iterator from Uint8Array readable streams

```js
import { createReadStream } from 'node:fs';
import chunked from '@intrnl/chunked-uint8-iterator';

let stream = createReadStream('./archive.zip');

for (let values of chunked(stream)) {
  // ...
}
```
