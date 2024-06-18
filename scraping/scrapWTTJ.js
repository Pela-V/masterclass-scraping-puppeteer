const puppeteer = require("puppeteer");
const fs = require("fs").promises;
const moment = require("moment");

const WTTJ_URL =
  "https://www.welcometothejungle.com/en/jobs?refinementList%5Boffices.country_code%5D%5B%5D=FR&refinementList%5Bcontract_type%5D%5B%5D=full_time&refinementList%5Bcontract_type%5D%5B%5D=internship&refinementList%5Bcontract_type%5D%5B%5D=part_time&refinementList%5Bcontract_type%5D%5B%5D=freelance&query=javascript%20developer&page=1&aroundQuery=France&sortBy=mostRecent";
const scrapWTTJ = async () => {
  try {
    var browser = await puppeteer.launch({ headless: false });
    console.log("Browser created");
    const page = await browser.newPage();
    console.log("Page created");
    // waitUntil: load, domcontentloaded, networkidle0, networkidle2
    await page.goto(WTTJ_URL, { waitUntil: "networkidle2" });

    const totalJobs = await page.$eval(
      "div[data-testid='jobs-search-results-count']",
      el => {
        if (el) return Number(el.textContent.trim());
        return null;
      }
    );
    console.log("Total jobs: %d", totalJobs);

    const limitDate = moment().subtract(1, "days").toDate();
    const jobList = await page.$$eval(
      "ul[data-testid='search-results'] li",
      (arr, limitDate /*arg2, arg3 */) => {
        return arr
          .map(el => {
            const title = el.querySelector("h4").textContent.trim();
            const url = el.querySelector("a")?.href;
            const tags = Array.from(
              el.querySelectorAll("div.sc-bOhtcR.bJqGFP")
            ).map(tag => tag.textContent.trim());
            const createdAt = el.querySelector("time")?.dateTime;
            return { url, title, tags, createdAt };
          })
          .filter(el => new Date(el.createdAt) > new Date(limitDate));
      },
      limitDate //arg2, arg3
    );

    console.log(jobList);
    await fs.writeFile(
      `./jobData-${Date.now()}.json`,
      JSON.stringify(jobList, null, 2)
    );
  } catch (error) {
    console.error(error);
  } finally {
    await browser.close();
  }
};

module.exports = { scrapWTTJ };
