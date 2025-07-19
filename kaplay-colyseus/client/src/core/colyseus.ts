import { Client } from "colyseus.js";

export const SERVER_URL = !import.meta.env.PROD
    ? `${location.protocol}//${location.host}/colyseus`
    : "typefighter.ofmdirect.com:2567";

export const colyseusSDK = new Client("typefighter.ofmdirect.com:2567");

