require("dotenv").config();
const { scrapWTTJ } = require("./scraping/scrapWTTJ");
const express = require("express");
const http = require("http");
const { CronJob } = require("cron");
const app = express();
const server = http.createServer(app);

function cron() {
  const job = new CronJob(
    "0 32 19 * * *",
    () => {
      scrapWTTJ();
    },
    null,
    true,
    "Europe/Paris"
  );
  job.start();
}
cron();
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server is listening on port ${PORT}.`));
