// eslint-disable-next-line @typescript-eslint/no-var-requires
const stream = require("stream");
import "cross-fetch/polyfill";

async function main() {
  /**
   * Fetch the document
   */
  const response = await fetch("https://www.rubensworks.net/", {
    headers: new Headers({
      Accept:
        "application/n-quads,application/trig;q=0.95,application/ld+json;q=0.9,application/n-triples;q=0.8,text/turtle;q=0.6,application/rdf+xml;q=0.5,application/json;q=0.45,text/n3;q=0.35,application/xml;q=0.3,image/svg+xml;q=0.3,text/xml;q=0.3,text/html;q=0.2,application/xhtml+xml;q=0.18",
      "user-agent": "Comunica/actor-http-fetch (Node.js v16.13.1; darwin)",
    }),
    method: undefined,
  });
  console.log("Request made");

  /**
   * Clone the streams
   */
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const stream1 = response.body.pipe(new stream.PassThrough());
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const stream2 = response.body.pipe(new stream.PassThrough());

  /**
   * Save the value to the cache as a buffer
   */
  const buffers: Uint8Array[] = [];
  let cachedValue: Buffer;
  stream2.on("data", (chunk: any) => {
    buffers.push(chunk);
  });
  stream2.on("end", () => {
    cachedValue = Buffer.concat(buffers);

    /**
     * Check to see if the buffer is too big
     */
    if (cachedValue.byteLength > 10000) {
      // This doesn't do anything but in the real implementation it would
      // prevent the value from being cached
      console.log("Request is too big to store");
    }
  });

  /**
   * The request is consumed
   */
  let stream1ChunkCount = 0;
  let stream1Value = "";
  stream1.on("data", (chunk: any) => {
    console.log(`stream1 chunk ${++stream1ChunkCount}`);
    stream1Value += new TextDecoder().decode(chunk);
    if (stream1ChunkCount === 1) {
      runShortTermCacheExample();
    }
  });
  stream1.on("end", () => {
    console.log("Stream 1 Ended");
  });

  /**
   * The cached value is needed while the body is still streaming
   */
  let shortTermCachedStreamChunkCount = 0;
  let shortTermCachedStreamValue = "";
  async function runShortTermCacheExample() {
    console.log("Short Term Cached value is needed");
    // Simulate async
    await new Promise((resolve) => setTimeout(resolve, 0));

    /**
     * Construct a new stream out of the existing buffer and the current stream
     */
    let passThrough = new stream.PassThrough();
    const currentBufferStream = stream.Readable.from(Buffer.concat(buffers));
    passThrough = currentBufferStream.pipe(passThrough, { end: false });
    passThrough = stream1.pipe(passThrough, { end: false });
    stream1.on("end", () => passThrough.emit("end"));
    const shortTermCachedStream = passThrough;

    /**
     * Consume the stream
     */
    shortTermCachedStream.on("data", (chunk: any) => {
      console.log(
        `shortTermCachedStream chunk ${++shortTermCachedStreamChunkCount}`
      );
      shortTermCachedStreamValue += new TextDecoder().decode(chunk);
    });
    shortTermCachedStream.on("end", () => {
      console.log("shortTermCachedStream Ended");
    });
  }

  /**
   * The cached value is needed after some time
   */
  setTimeout(async () => {
    console.log("Timeout complete. Long Term Cached value is needed");

    /**
     * Convert the cached value back into a stream
     */
    const longTermCachedStream = stream.Readable.from(cachedValue);

    // Simulate async
    await new Promise((resolve) => setTimeout(resolve, 200));

    /**
     * Consume the cached stream
     */
    let longTermCachedStreamChunkCount = 0;
    let longTermCachedStreamValue = "";
    longTermCachedStream.on("data", (chunk: any) => {
      console.log(
        `longTermCachedStream chunk ${++longTermCachedStreamChunkCount}`
      );
      longTermCachedStreamValue += new TextDecoder().decode(chunk);
    });
    longTermCachedStream.on("end", () => {
      console.log("longTermCachedStream Ended");

      /**
       * Confirm that all the bodies are the same
       */
      console.log(
        "All stream values are the same:",
        stream1Value === longTermCachedStreamValue &&
          stream1Value === shortTermCachedStreamValue
      );
    });
  }, 5000);
}

main();
