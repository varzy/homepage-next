declare module 'heic-decode' {
  interface DecodedImage {
    width: number;
    height: number;
    data: Uint8ClampedArray;
  }

  function decode(options: { buffer: Uint8Array | ArrayBuffer }): Promise<DecodedImage>;
  export default decode;
}
