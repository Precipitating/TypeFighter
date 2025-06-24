import { useState, useEffect } from "react";

const URL = "https://random-word-api.herokuapp.com/word";

export async function fetchWord(): Promise<string> {
    const res = await fetch(URL);
    const data = await res.json();

    return data[0];
}
