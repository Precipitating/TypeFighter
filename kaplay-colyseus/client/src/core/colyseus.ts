import { Client } from "colyseus.js";

//export const SERVER_URL = `${location.protocol}//${location.host}/colyseus`


export const colyseusSDK = new Client("wss://typefighter.ofmdirect.com");
//export const colyseusSDK = new Client(SERVER_URL);

