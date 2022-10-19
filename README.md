<a name="readme-top"></a>

<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="/">
    <img src="images/sandbox.jfif" alt="Logo" width="200" height="100">
  </a>
  <h3 align="center">Extract SandBox's Land transaction data deployed on Ethereum</h3>
</div>

<!-- TABLE OF CONTENTS -->
<details>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#system-requirements">System Requirements</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
  </ol>
</details>

<!-- ABOUT THE PROJECT -->

## About The Project

This is a command line application that extracts blockchain transaction data with the given token address.
Since the amount of transaction data is enormouse and scraping these data takes much time, I decided to write the code for building database.
After building database, we can extract relevant data to csv file based on our database.

This application is built with NodeJS, Alchemy APIs, and web.js and I used sqlite3 database for building database.

<!-- GETTING STARTED -->

## Getting Started

### System Requirements

- [NodeJS][node] v14 or greater
- [npm][npm] v6 or greater
- the .env file should include ALCHEMY_KEY, CRYPTOCOMPARE_KEY, TABLE_NAME items.

To verify things are set up
properly, you can run this:

```shell
node --version
npm --version
```

If you have trouble with any of these, learn more about the PATH environment variable and how to fix it.

### Installation

```js
npm install
```

### Building sqlite database (main.db)
```
node buildDB.js
```
Make sure you are in the extract-sandbox-data folder.
for example:

```
D:\sort_input\extract-sandbox-data>node buildDB.js
```
### Extracting CSV file
```
node index.js 'stDate' 'edDate' 'save.csv'
```
Make sure you are in the extract-sandbox-data folder.
for example:

```
D:\sort_input\extract-sandbox-data>node index.js "2019-01-01 00:00:00" "2020-02-10 00:00:00" "save.csv"
```
You can see save.csv in the extract-sandbox-data folder.

## Caution
- You can only extract data to csv file after buidling database.
- It will take some time out to build database.
- There might be some minor errors with ETH price because I used free API key.