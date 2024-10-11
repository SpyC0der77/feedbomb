import jschardet from "jschardet";
import iconv from "iconv-lite";

let cache = {};

export async function POST(req) {
  const { urls } = await req.json();
  const responses = [];

  if (!urls) {
    return new Response("Request missing required parameter 'urls'.", {
      status: 400,
    });
  }

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    try {
      if (url.endsWith("/api/fetchFeed")) {
        return new Response("You can't recursively call this endpoint.", {
          status: 400,
        });
      }
      async function handleUsingNetwork() {
        const response = await fetch(url);

        if (!response.ok) {
          responses.push({
            url: url,
            xml: null,
          });
        } else {
          const buffer = await response.arrayBuffer();

          const detectedEncoding = jschardet.detect(Buffer.from(buffer));
          let encoding = detectedEncoding.encoding || "utf-8";

          const decodedText = iconv.decode(Buffer.from(buffer), encoding);

          cache[url] = {
            url: url,
            xml: decodedText,
            expire: Date.now() + 300000,
          };

          return responses.push({
            url: url,
            xml: decodedText,
          });
        }
      }
      if (!cache[url]) {
        await handleUsingNetwork();
        if (i === urls.length - 1) {
          return new Response(JSON.stringify(responses), {
            headers: {
              "Content-Type": "application/json",
            },
          });
        }
      } else {
        if (cache[url].expire < Date.now()) {
          await handleUsingNetwork();
          if (i === urls.length - 1) {
            return new Response(JSON.stringify(responses), {
              headers: {
                "Content-Type": "application/json",
              },
            });
          }
        } else {
          responses.push({
            url: url,
            xml: cache[url].xml,
          });

          if (i === urls.length - 1) {
            return new Response(JSON.stringify(responses), {
              headers: {
                "Content-Type": "application/json",
              },
            });
          }
        }
      }
    } catch (error) {
      console.error("There was an error while fetching this feed: ", error);
      return new Response("There was an error while fetching this feed", {
        status: 500,
      });
    }
  }
}