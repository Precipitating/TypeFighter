import { Client } from "colyseus.js";

// export const SERVER_URL = !import.meta.env.PROD
//     ? `${location.protocol}//${location.host}/colyseus`
//     : "typefighter.ofmdirect.com";

export const colyseusSDK = new Client("wss://typefighter.ofmdirect.com");

