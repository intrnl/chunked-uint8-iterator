/**
 * Creates a chunked iterator from Uint8Array iterables
 * @param {Iterable<Uint8Array> | AsyncIterable<Uint8Array>} iterable
 * @param {number} desiredSize
 * @returns {AsyncIterableIterator<Uint8Array, null>}
 */
function chunked (iterable, desiredSize = 512) {
	let iterator = Symbol.asyncIterator in iterable
		? iterable[Symbol.asyncIterator]()
		: iterable[Symbol.iterator]();

	let pages = [];
	let buffer = new Uint8Array(0);

	let ptr = 0;
	let size = 0;

	return {
		[Symbol.asyncIterator] () {
			return this;
		},

		async next () {
			while (size < desiredSize) {
				let result = await iterator.next();

				if (result.done) {
					break;
				}

				let chunk = result.value;
				let length = chunk.byteLength;

				size += length;
				pages.push(chunk);
			}

			if (size < 1) {
				return { done: true, value: null };
			}

			if (size < desiredSize) {
				let copy = buffer.subarray(ptr, ptr + size);
				size = 0;

				return { done: false, value: copy };
			}

			let block = new Uint8Array(desiredSize);
			let unwritten = desiredSize;

			while (unwritten) {
				let remaining = buffer.byteLength - ptr;
				let written = Math.min(unwritten, remaining);

				block.set(buffer.subarray(ptr, ptr + written), desiredSize - unwritten);

				ptr += written;
				unwritten -= written;
				size -= written;

				if (ptr >= buffer.byteLength) {
					buffer = pages.shift();
					ptr = 0;
				}
			}

			return { done: false, value: block };
		},
		return (value) {
			if ('return' in iterator) {
				iterator.return(value);
			}
		},
		throw (err) {
			if ('throw' in iterator) {
				iterator.throw(err);
			}
		},
	};
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
