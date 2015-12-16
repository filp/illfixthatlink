# illfixthatlink

Example of a really simple Reddit bot, using raw.js.

It watches new Reddit posts for submissions with no-participating links in
the wrong format:

Wrong format:  

`http://www.np.reddit.com/...`  

Correct format:  

`http://np.reddit.com/...`  

The wrong format leads to a certificate warning in modern browsers, since the SSL
certificate only applies to `*.reddit.com`, not `*.*.reddit.com`.

## Running the bot

```shell
git clone git@github.com:filp/illfixthatlink.git
cd illfixthatlink
npm install
npm start
```
