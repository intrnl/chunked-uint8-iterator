/**
 * Creates a chunked iterator from Uint8Array iterables
 * @param {Iterable<Uint8Array> | AsyncIterable<Uint8Array>} iterable
 * @param {number} size
 * @returns {AsyncGenerator<Uint8Array, null>}
 */
async function* chunked (iterable, size = 512) {
	/** @type {Uint8Array[]} */
	let chunks = [];
	let bytes = 0;

	for await (let value of iterable) {
		bytes += value.byteLength;
		chunks.push(value);

		if (bytes >= size) {
			let buf = concat(bytes, chunks);
			let offset = 0;

			while (bytes >= size) {
				yield buf.slice(offset, offset + size);

				bytes -= size;
				offset += size;
			}

			chunks = [buf.slice(offset, buf.length)];
		}
	}

	if (bytes > 0) {
		yield concat(bytes, chunks);
	}

	return null;
}

export default chunked;

/**
 * @param {number} bytes
 * @param {Uint8Array[]} chunks
 * @returns {Uint8Array}
 */
export function concat (bytes, chunks) {
	let result = new Uint8Array(bytes);
	let offset = 0;

	for (let i = 0, l = chunks.length; i < l; i++) {
		let array = chunks[i];

		result.set(array, offset);
		offset += array.byteLength;
	}

	return result;
}

/**
 * Create an async iterable for a readable stream
 * @template T
 * @param {ReadableStream<T>} stream
 * @returns {AsyncIterableIterator<T>}
 */
export function createStreamIterator (stream) {
	// return if browser already supports async iterator in stream
	if (stream[Symbol.asyncIterator]) {
		return stream[Symbol.asyncIterator]();
	}

	/** @type {ReadableStreamDefaultReader<T> | undefined} */
	let reader;

	return {
		[Symbol.asyncIterator] () {
			return this;
		},
		next () {
			if (!reader) {
				reader = stream.getReader();
			}

			return reader.read();
		},
		return () {
			if (reader) {
				reader.releaseLock();
			}
		},
		throw () {
			if (reader) {
				reader.releaseLock();
			}
		},
	};
}
