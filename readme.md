CSS spies on us
===============

Slides for a talk about sicurity threats with CSS. 93 slides, about 30 minutes.

Originally conceived for the [2022 Italian CSS Day](https://2022.cssday.it/) (in Italian), Faenza, 2022-04-01.

Also presented at [Bologna Front End](https://bolognafrontend.it/) meetup (2022-05-20) and Google DevFest Modena 2025 (2025-10-04).

Built on top of [P-Slides](https://github.com/MaxArt2501/p-slides)!

## Building

Node.js 10.x is required (actually it could work in Node 8 - haven't checked).

To start the presentation in development mode:

1. Clone the repository;
2. `npm i`
3. `npm run serve`

Or `npm run build` to just build it, then serve `/public` with your HTTP server of choice.

## Demo

A little CSS exfiltration demo:
1. `node exfil.js`
2. open [exfil.html](./exfil.html) in your browser of choice (you can also use a HTTP server to serve it)
3. enjoy the horror!

## Tests

... what?
