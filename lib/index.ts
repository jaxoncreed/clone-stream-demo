// eslint-disable-next-line @typescript-eslint/no-var-requires
const stream = require("stream");
import "cross-fetch/polyfill";

async function main() {
  const response = await fetch("https://example.com");
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const stream1 = response.body.pipe(new stream.PassThrough());
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const stream2 = response.body.pipe(new stream.PassThrough());

  stream1.on("data", (chunk: any) => {
    console.log("chunk 1");
    console.log(chunk.toString());
  });
  stream1.on("end", () => {
    console.log("Stream 1 Ended");
  });

  setTimeout(() => {
    stream2.on("data", (chunk: any) => {
      console.log("chunk 2");
      console.log(chunk.toString());
    });
    stream2.on("end", () => {
      console.log("Stream 2 Ended");
    });
  }, 5000);
}

main();
