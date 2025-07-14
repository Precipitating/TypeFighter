const fetchAmount : number = 100;
const timeoutLimitMs : number = 500;
const URL : string = `https://random-word-api.herokuapp.com/word?number=${fetchAmount}`;
const URL2 : string = `https://random-word-api.vercel.app/api?words=${fetchAmount}`;


export async function fetchWords(): Promise<string[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutLimitMs);

  try {
    const res = await fetch(URL, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    }

    console.error("First URL failed (non-ok), trying second...");
    return await trySecondUrl();
    
  } catch (error: any) {
    clearTimeout(timeout);
    console.error(`Error caught: ${error} trying second URL.`);
    return await trySecondUrl();


  }
}

async function trySecondUrl(): Promise<string[]> {
  const controller2 = new AbortController();
  const timeout2 = setTimeout(() => controller2.abort(), timeoutLimitMs);

  try {
    const res = await fetch(URL2, { signal: controller2.signal });
    clearTimeout(timeout2);

    if (!res.ok) {
      console.error("Second URL failed too");
      return [];
    }

    const data = await res.json();
    return Array.isArray(data) ? data : [];

  } catch (error: any) {
    clearTimeout(timeout2);

    if (error.name === 'AbortError') {
      console.error("Second fetch also timed out");
    } else {
      console.error("Second fetch error:", error);
    }

    return [];
  }
}

