# WHAT

A better way of making memes with `ao`.

## How to use this

Working with `ao` is an incredible amount of fun. So, first, put your play hat firmly on. Then:

```bash
git clone git@github.com:andytudhope/what.git
cd what
npm i
npm run start
```

That is all you need to get going with the front end.

If you make changes and would like to deploy them to Arweave, you'll need to generate a `wallet.json` file and fund it with some AR. You can generate a wallet file with:

```bash
node -e "require('arweave').init({}).wallets.generate().then(JSON.stringify).then(console.log.bind(console))" > wallet.json
```

## Structure

All the code for the frontend is in the `src/` directory and, because I am dirty hacker, I just put everything in HomePage.tsx. Good luck, ser.

The `process/` directory holds the two Lua files responsible for the WHAT process on `ao`. That's right, just 304 lines of easy-to-read code. No fancy smart contract frameworks to learn. No test networks to fork at specific block heights. Just a few Lua scripts, and we can get basically the same functionality for our WHAT memecoin as the entire MakerDAO system...

If you'd like to run the Lua files yourself, that's also easy enough.

Get `aos`, change into the directory where the Lua files live, and run `aos`:

```bash
npm i -g https://get_ao.g8way.io
cd what/process
aos
```

Then you can load the two files in the interactive console with this convenient command and you're away:

```bash
.load what.lua
.load propose-stake.lua
```

You can make any changes you like to those files, and re-run the load command to make your own unique logic. It won't interfere with mine. We all get to use the single system image, this unified computing environment, in our own way. Simply note your process ID when `aos` starts, replace that in the relevant places in the React App, and you should be good to go.

## More info

Sound too good to be true? I know...

You can [read the spec here](https://ao.arweave.dev/#/spec).