"use client";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import FeedItem from "@/components/ui/feed-item";
import {
  SettingsIcon,
  LucideHome,
  LucidePlus,
  LoaderCircle,
} from "lucide-react";
import { History } from "lucide-react";

export default function Home() {
  const [feedsJSON, setFeedsJSON] = useState([]);
  const [feedsURLs, setFeedsURLs] = useState([]);
  const [newFeedURL, setNewFeedURL] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selector, setSelector] = useState("all_posts");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pwaCardShowing, setPwaCardShowing] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [rules, setRules] = useState([]);
  const [rendered, setRendered] = useState(false);
  const [feeds, setFeeds] = useState([]);
  const [readHistory, setReadHistory] = useState(null);

  async function parseRSSFeed(xmlString, url) {
    let feed = {};
    let feedItems = [];
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlString, "application/xml");

      let feedTitle = xmlDoc.querySelector("title")
        ? xmlDoc.querySelector("title").textContent
        : "";

      let feedIcon = xmlDoc.querySelector("link")
        ? `https://logo.clearbit.com/${encodeURIComponent(
            xmlDoc.querySelector("link").getAttribute("href").split("/")[2]
          )}`
        : `https://logo.clearbit.com/${encodeURIComponent(url.split("/")[2])}`;
      feed.title = feedTitle;
      feed.feedURL = url;
      feed.icon = feedIcon;
      feed.type = "feeds";

      let items =
        xmlDoc.querySelectorAll("item, entry") ||
        xmlDoc
          .querySelector("rss")
          .querySelector("channel")
          .querySelectorAll("item, entry");
      setFeeds((prev) => [
        ...prev,
        {
          title: feedTitle,
          feedURL: url,
          icon: feedIcon,
          type: "feeds",
        },
      ]);
      items.forEach((item) => {
        const title = item.querySelector("title")
          ? item.querySelector("title").textContent
          : "";
        const linkElement = item.querySelector("link");
        const content =
          item.getElementsByTagName("content:encoded")[0] ||
          item.querySelector("content") ||
          "";
        const link = linkElement
          ? linkElement.getAttribute("href") || linkElement.textContent
          : "#";
        const description = item.querySelector("description, summary")
          ? item.querySelector("description, summary").textContent
          : "";
        let placeholder = document.createElement("div");
        let potentialImage;

        if (content.innerHTML) {
          placeholder.innerHTML = decodeHtmlEntities(content.innerHTML);
          potentialImage =
            item
              .getElementsByTagName("media:thumbnail")[0]
              ?.getAttribute("url") ||
            item
              .getElementsByTagName("media:content")[0]
              ?.getAttribute("url") ||
            (placeholder.querySelector("img")
              ? placeholder.querySelector("img").src
              : `https://logo.clearbit.com/${new URL(link).hostname}`);
        } else {
          placeholder.innerHTML =
            description ||
            new Date(
              item.querySelector("pubDate, published")
                ? item.querySelector("pubDate, published").textContent
                : ""
            ).toDateString();
          potentialImage =
            item
              .getElementsByTagName("media:thumbnail")[0]
              ?.getAttribute("url") ||
            `https://logo.clearbit.com/${new URL(link).hostname}`;
        }

        let pubDate = item.querySelector("pubDate, published")
          ? item.querySelector("pubDate, published").textContent
          : "";
        let dateObj = new Date(pubDate);
        if (isNaN(dateObj.getTime())) dateObj = new Date();

        let authorElement = item.querySelector("author");
        let dcCreatorElement = item.getElementsByTagName("dc:creator")[0];
        let author = authorElement
          ? authorElement.textContent ||
            authorElement.querySelector("name")?.textContent ||
            ""
          : dcCreatorElement
          ? dcCreatorElement.textContent
          : "";
        feedItems.push({
          title: title,
          link: link,
          description: placeholder.innerText,
          pubDate: dateObj.toISOString(),
          image: potentialImage,
          author: author,
          feedURL: url,
        });
      });
    } catch (error) {
      console.error("Error parsing RSS feed:", error);
    }
    feed.items = feedItems;
    return feed;
  }

  function decodeHtmlEntities(str) {
    const entities = {
      "&lt;": "<",
      "&gt;": ">",
      "&amp;": "&",
      "&quot;": '"',
      "&#39;": "'",
    };
    return str.replace(
      /&(lt|gt|amp|quot|#39);/g,
      (match, p1) => entities[match] || match
    );
  }

  async function fetchFeeds(urls) {
    try {
      fetch("/api/fetchFeeds", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ urls: urls }),
      })
        .then((response) => response.json())
        .then(async (data) => {
          for (let i = 0; i < data.length; i++) {
            let xml = data[i].xml;
            if (xml != null) {
              let feed = await parseRSSFeed(xml, data[i].url);
              setFeedsJSON((prev) => [...prev, feed]);
            }
          }
        });
    } catch (error) {
      console.error("Error fetching or parsing feed:", error);
    }
  }

  function timeDifference(current, previous) {
    var msPerMinute = 60 * 1000;
    var msPerHour = msPerMinute * 60;
    var msPerDay = msPerHour * 24;
    var msPerMonth = msPerDay * 30;
    var msPerYear = msPerDay * 365;

    var elapsed = current - previous;

    if (elapsed < msPerMinute) {
      return Math.round(elapsed / 1000) + " seconds ago";
    } else if (elapsed < msPerHour) {
      return Math.round(elapsed / msPerMinute) + " minutes ago";
    } else if (elapsed < msPerDay) {
      return Math.round(elapsed / msPerHour) + " hours ago";
    } else if (elapsed < msPerMonth) {
      return "approximately " + Math.round(elapsed / msPerDay) + " days ago";
    } else if (elapsed < msPerYear) {
      return (
        "approximately " + Math.round(elapsed / msPerMonth) + " months ago"
      );
    } else {
      return "approximately " + Math.round(elapsed / msPerYear) + " years ago";
    }
  }

  function decodeHtmlEntities(str) {
    const entities = {
      "&lt;": "<",
      "&gt;": ">",
      "&amp;": "&",
      "&quot;": '"',
      "&#39;": "'",
    };

    return str.replace(
      /&(lt|gt|amp|quot|#39);/g,
      (match, p1) => entities[match] || match
    );
  }

  const handleAddFeed = () => {
    let validatedFeedURL = newFeedURL.trim();
    if (!validatedFeedURL.startsWith("http")) {
      validatedFeedURL = "https://" + validatedFeedURL;
    }
    if (feedsURLs.includes(validatedFeedURL)) {
      alert("This feed URL already exists.");
      return;
    }
    setFeedsURLs((prev) => {
      const updatedFeeds = [...prev, validatedFeedURL];
      localStorage.setItem("savedFeeds", JSON.stringify(updatedFeeds));
      return updatedFeeds;
    });
    setNewFeedURL("");
    setDialogOpen(false);
    window.location.reload();
  };
  useEffect(() => {
    setRendered(true);
    if (!localStorage.getItem("onboardingCompleted")) {
      window.location.href = "/onboarding";
    }
    const handleBeforeInstallPrompt = (e) => {
      if (localStorage.getItem("pwaCardDismissed") == "true") return;
      e.preventDefault();
      setPwaCardShowing(true);
      setDeferredPrompt(e);
    };
    const savedFeeds = localStorage.getItem("savedFeeds");
    if (savedFeeds) {
      const savedFeedsArray = JSON.parse(savedFeeds);
      setFeedsURLs(savedFeedsArray);
      fetchFeeds(savedFeedsArray);

      let readHistory = JSON.parse(localStorage.getItem("readHistory"));
      if (readHistory) {
        setReadHistory(readHistory);
        let newFeed = {
          title: "History",
          type: "articles",
          feedURL: "history",
          icon: "https://logo.clearbit.com/feedbomb.app",
          items: [],
        };
        for (let i = 0; i < readHistory.length; i++) {
          let item = readHistory[i];
          item["feedURL"] = "history";
          newFeed.items.push(item);

          if (i == readHistory.length - 1) {
            setFeedsJSON((prev) => [...prev, newFeed]);
            setFeeds((prev) => [...prev, newFeed]);
          }
        }
      }
    } else {
      localStorage.setItem("savedFeeds", JSON.stringify([]));
    }
    const savedRules = localStorage.getItem("filters");
    if (savedRules) {
      const savedRulesArray = JSON.parse(savedRules);
      setRules(savedRulesArray);
    } else {
      localStorage.setItem("filters", JSON.stringify([]));
      setRules([]);
    }
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => {
      setFeedsJSON([]);
      setFeeds([]);
      setFeedsURLs([]);
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, []);

  function checkArticle(title, author) {
    let isValid = true;

    rules.forEach((rule) => {
      const lowerTitle = title.toLowerCase();
      const lowerValue = rule.value.toLowerCase();
      const lowerAuthor = author.toLowerCase();

      if (rule.rule === "title-contains" && lowerTitle.includes(lowerValue)) {
        isValid = false;
      }

      if (
        rule.rule === "title-starts-with" &&
        lowerTitle.startsWith(lowerValue)
      ) {
        isValid = false;
      }

      if (rule.rule === "title-ends-with" && lowerTitle.endsWith(lowerValue)) {
        isValid = false;
      }

      if (rule.rule === "author-is" && lowerAuthor.includes(lowerValue)) {
        isValid = false;
      }
    });

    return isValid;
  }

  const handleAddToHomeScreen = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the A2HS prompt: ${outcome}`);

    setDeferredPrompt(null);
  };

  const dismissPwaCard = async () => {
    localStorage.setItem("pwaCardDismissed", true);
    setPwaCardShowing(false);
  };

  const allItems = feedsJSON
    .flatMap((feed) => feed.items)
    .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
  console.log(allItems);

  console.log(readHistory);
  return (
    <>
      <div
        className={
          "fixed inset-0 grid grid-rows-[50px_calc(100vh_-_50px)] h-full w-full" +
          (sidebarOpen ? " sidebar-open" : "")
        }
      >
        <header className="p-4 flex justify-between gap-4 items-center select-none">
          <div className="flex gap-4 items-center">
            <button onClick={() => setSidebarOpen(!sidebarOpen)}>
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
                className="cursor-pointer"
              >
                <path
                  d="M5.474 19h13.052c.834 0 1.455-.202 1.863-.605.407-.403.611-1.008.611-1.815V7.42c0-.807-.204-1.412-.611-1.815C19.98 5.202 19.36 5 18.526 5H5.474c-.821 0-1.439.202-1.853.605C3.207 6.008 3 6.613 3 7.42v9.16c0 .807.207 1.412.621 1.815.414.403 1.032.605 1.853.605Zm.02-1.392c-.35 0-.62-.091-.81-.274-.191-.182-.287-.456-.287-.821V7.487c0-.359.096-.63.287-.816.19-.186.46-.279.81-.279h13.012c.35 0 .62.093.81.279.191.185.287.457.287.816v9.026c0 .365-.096.639-.287.821-.19.183-.46.274-.81.274H5.494Zm3.377.268h1.368V6.152H8.87v11.724ZM7.415 9.178a.45.45 0 0 0 .33-.149c.097-.1.146-.21.146-.331a.433.433 0 0 0-.146-.322.465.465 0 0 0-.33-.14H5.882a.465.465 0 0 0-.33.14.433.433 0 0 0-.146.322c0 .121.049.232.146.331a.45.45 0 0 0 .33.149h1.533Zm0 1.92a.457.457 0 0 0 .33-.144.459.459 0 0 0 .146-.336.433.433 0 0 0-.146-.321.465.465 0 0 0-.33-.14H5.882a.465.465 0 0 0-.33.14.433.433 0 0 0-.146.321c0 .128.049.24.146.336a.457.457 0 0 0 .33.144h1.533Zm0 1.92a.465.465 0 0 0 .33-.138.443.443 0 0 0 .146-.332.433.433 0 0 0-.146-.321.465.465 0 0 0-.33-.14H5.882a.465.465 0 0 0-.33.14.433.433 0 0 0-.146.321c0 .128.049.239.146.332.097.092.207.139.33.139h1.533Z"
                  fill="currentColor"
                ></path>
              </svg>
            </button>
            <span>
              {selector == "all_posts"
                ? "Home"
                : feedsJSON[currentIndex].title.split(" - ")[0]}
            </span>
          </div>
          <a href="/settings" className="text-white">
            <SettingsIcon />
          </a>
        </header>
        <div
          className={
            "grid grid-rows-1 h-full w-full grid-container " +
            (sidebarOpen
              ? "grid-cols-[244px_calc(100vw_-_244px)] "
              : "grid-cols-[0px_calc(100vw_-_0px)])")
          }
        >
          <aside
            className={"flex flex-col p-4 " + (sidebarOpen ? "" : "hidden")}
          >
            {sidebarOpen ? (
              <>
                <span className="text-gray-300">Feeds</span>
                <ul>
                  <FeedItem
                    className={
                      "flex gap-4 items-center cursor-pointer select-none hover:bg-[#FFFFFF14] active:bg-[#FFFFFF1A] p-2 rounded-lg w-full " +
                      (selector == "all_posts" ? " !bg-[#7C3AED]" : "")
                    }
                    selector={selector}
                    tabIndex={0}
                    onClick={() => {
                      setSelector("all_posts");
                      setCurrentIndex(0);
                    }}
                  >
                    <LucideHome className="w-6 h-6" />
                    <span>Home</span>
                  </FeedItem>
                  {feeds.map((feed, index) => {
                    if (feed.type == "feeds") {
                      console.log(feed);
                      return (
                        <FeedItem
                          key={index}
                          tabIndex={0}
                          selector={selector}
                          url={feed.feedURL}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            let confirmation = confirm(
                              "Are you sure you want to delete this feed?"
                            );
                            if (confirmation) {
                              setFeedsURLs((prev) => {
                                const updatedFeeds = prev.filter(
                                  (feedURL) => feedURL !== feed.feedURL
                                );
                                localStorage.setItem(
                                  "savedFeeds",
                                  JSON.stringify(updatedFeeds)
                                );
                                return updatedFeeds;
                              });
                              window.location.reload();
                            }
                          }}
                          onClick={() => {
                            setSelector(feed.feedURL);
                            setCurrentIndex(index);
                          }}
                        >
                          <img
                            src={feed.icon}
                            className="w-6 h-6 rounded-full"
                          />
                          <span className="textellipsis">
                            {feed.title.split(" - ")[0]}
                          </span>
                        </FeedItem>
                      );
                    }
                  })}
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <button
                        variant="outline"
                        className="flex gap-4 items-center cursor-pointer select-none hover:bg-[#FFFFFF14] active:bg-[#FFFFFF1A] p-2 rounded-lg w-full"
                      >
                        <LucidePlus className="w-6 h-6" />
                        <span>Add</span>
                      </button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Add New RSS Feed</DialogTitle>
                        <DialogDescription>
                          Enter the URL of the RSS feed you want to add.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="feedUrl" className="text-right">
                            Feed URL
                          </Label>
                          <Input
                            id="feedUrl"
                            value={newFeedURL}
                            onChange={(e) => setNewFeedURL(e.target.value)}
                            className="col-span-3"
                            placeholder="https://example.com/rss"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={handleAddFeed}>Add Feed</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </ul>
                <div className={readHistory ? "" : "hidden"}>
                  <span className="text-gray-300">Articles</span>
                  <ul>
                    <FeedItem
                      className={
                        "flex gap-4 items-center cursor-pointer select-none hover:bg-[#FFFFFF14] active:bg-[#FFFFFF1A] p-2 rounded-lg w-full " +
                        (selector == "history" ? " !bg-[#7C3AED]" : "")
                      }
                      selector="history"
                      tabIndex={0}
                      onClick={() => {
                        setSelector("history");
                        setCurrentIndex(0);
                      }}
                    >
                      <History className="w-6 h-6" />
                      History
                    </FeedItem>
                  </ul>
                </div>
              </>
            ) : null}
          </aside>
          <div className="p-4 pt-1 overflow-y-auto custom-scrollbar h-full main-content">
            {allItems.length > 0 ? (
              <>
                {pwaCardShowing ? (
                  <div className="p-3">
                    <div
                      className={
                        "bg-[#FFFFFF14] w-full rounded-lg flex justify-between items-center gap-2 p-3"
                      }
                    >
                      <b>Add Feedbomb as a shortcut</b>
                      <div className="flex gap-2">
                        <Button onClick={handleAddToHomeScreen}>
                          Add to Home Screen
                        </Button>
                        <Button variant="outline" onClick={dismissPwaCard}>
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : null}
                <ul>
                  {allItems
                    .filter((item) => {
                      if (
                        selector == "all_posts" &&
                        item.feedURL != "history"
                      ) {
                        let check = checkArticle(item.title, item.author);
                        console.log(check);
                        return check;
                      } else {
                        return (
                          item.feedURL === selector &&
                          checkArticle(item.title, item.author)
                        );
                      }
                    })
                    .map((item, index) => (
                      <div key={index} className="mb-4">
                        <a
                          href={"/read/" + btoa(item.link).replaceAll("/", "-")}
                          className="text-white grid grid-cols-[150px_calc(100%_-_150px)] gap-4 hover:bg-[#FFFFFF14] active:bg-[#FFFFFF1A] p-3 rounded-lg visited:text-[gray] "
                        >
                          <img
                            src={item.image}
                            loading="lazy"
                            className="w-[150px] rounded-lg"
                          />
                          <div className="right flex flex-col">
                            <span className="font-bold text-[16px]">
                              {item.title}
                            </span>
                            <span className="text-sm previewText">
                              by {item.author || item.creator} |{" "}
                              {timeDifference(
                                new Date(),
                                new Date(item.pubDate)
                              )}
                              <br />
                              <br />
                              {item.description}
                            </span>
                          </div>
                        </a>
                      </div>
                    ))}
                </ul>
              </>
            ) : feedsURLs.length === 0 && rendered ? (
              <div className="text-left p-3">
                <p className="text-gray-500">No feeds added yet</p>
              </div>
            ) : (
              <div className="flex justify-center items-center p-3">
                <LoaderCircle className="animate-spin" />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
