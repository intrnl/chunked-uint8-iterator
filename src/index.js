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

			// we won't have the desired size if we break away from the loop above,
			// and we don't want to pad this, so declare the appropriate amount.
			let unwritten = size < desiredSize ? length : desiredSize;
			let block = new Uint8Array(unwritten);

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
