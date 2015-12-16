import util from "util";
import RawJs from "raw.js";

var reddit = new RawJs(process.env.USER_AGENT || "illfixthatlink-bot:1 (/u/illfixthatlink)");
const AUTH = {
  username: process.env.BOT_USERNAME,
  password: process.env.BOT_PASSWORD
};

// Regex used to match bad links
const BAD_LINK_RE = /^https?:\/\/www\.np\.reddit/i;

// Time to chill between requests
const CHILL_DELAY = 8000;

// Passed to `util.format` to generate the comment. Use %s as placeholder
// for the fixed link.
const COMMENT_TEMPLATE = `
Fixed link: %s

^(I'm a bot)
`;

// Options for listing submissions. See the documentation in the
// following link for more details:
// https://www.reddit.com/r/rawjs/wiki/documentation/methods#wiki_listing_request
const LISTING_OPTIONS = {
  r: process.env.BOT_SUBREDDIT || "all",
  limit: 10
};

// Performs a simple replace on the url to fix it -- the first argument is greedy
// on purpose to reduce the risk of replacing more than we should in the unlikely
// event the url contains np.reddit in any other part of the string.
const fixLink = (url) => {
  return url.replace("www.np.reddit.com", "np.reddit.com");
};

// Returns true if the given post is actionable (has a bad link)
const filterActionablePosts = (post) => {
  return (
    !post.data.is_self &&
    post.data.url &&
    !!post.data.url.match(BAD_LINK_RE)
  );
};

const processActionablePosts = (posts) => {
  posts.forEach((post) => {
    var parentId = post.data.id;
    var fixedLink = fixLink(post.data.url);

    // Send the comment, and hide the item:
    // NOTE: Both these requests are sent one after the other - if you're processing
    // a lot of posts you need to rate limit this appropriately.
    reddit.comment(parentId, util.format(COMMENT_TEMPLATE, fixedLink), () => {
      console.log("[%s] >> [%s]", parentId, fixedLink);
      reddit.hide(post.data.name);
    });
  });
};

// Monitors reddit for new submissions
const monitorPosts = (beforeId) => {
  var paginatedListingOptions = Object.assign({},
    LISTING_OPTIONS,
    { before: beforeId }
  );

  reddit.new(paginatedListingOptions, (err, response) => {
    var firstId;

    if (!err) {
      processActionablePosts(response.children.filter(filterActionablePosts));

      var firstChild = response.children[0];
      firstId = firstChild && firstChild.data.id;
    }

    setTimeout(monitorPosts.bind(null, firstId), CHILL_DELAY);
  });
};

reddit.setupOAuth2(
  process.env.BOT_ID,
  process.env.BOT_SECRET,
  process.env.BOT_REDIRECT_URL
);

reddit.auth(AUTH, (err, response) => {
  if (err) {
    console.log("Failed to authenticate: %s", err);
    process.exit(1);
  }

  monitorPosts();
});
