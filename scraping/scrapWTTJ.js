const puppeteer = require("puppeteer");
const moment = require("moment");
const { sendEmail } = require("../sendEmail");
const WTTJ_URL =
  "https://www.welcometothejungle.com/en/jobs?refinementList%5Boffices.country_code%5D%5B%5D=FR&refinementList%5Bcontract_type%5D%5B%5D=full_time&refinementList%5Bcontract_type%5D%5B%5D=internship&refinementList%5Bcontract_type%5D%5B%5D=part_time&refinementList%5Bcontract_type%5D%5B%5D=freelance&query=javascript%20developer&page=1&aroundQuery=France&sortBy=mostRecent";

const scrapWTTJ = async () => {
  try {
    var browser = await puppeteer.launch({ headless: "new" });
    console.log("Browser created");
    const page = await browser.newPage();
    console.log("Page created");
    await page.setRequestInterception(true);
    page.on("request", request => {
      const type = request.resourceType();
      //   console.log("Request url: %s\nRequest type: %s", url, type);

      if (["stylesheet", "image", "font"].includes(type)) {
        request.abort();
        return;
      }
      request.continue();
    });

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

    // console.log(jobList);
    for (const job of jobList) {
      await page.goto(job.url, { waitUntil: "networkidle0" });
      try {
        const skillButton = page.$(".sc-bOhtcR.gEkFOx");
        if (skillButton) await page.click(".sc-bOhtcR.gEkFOx");
      } catch {}
      const data = await page.evaluate(() => {
        const requiredSkills = [
          ...document.querySelectorAll(".sc-bOhtcR.kOIrWV"),
        ].map(el => el.textContent.trim());
        const companyEl = document.querySelector("a.sc-emIrwa.Trejm");
        const company = {
          name: companyEl?.textContent?.trim(),
          url: companyEl?.href,
        };
        return { requiredSkills, company };
      });
      job.data = data;
    }
    await sendEmail({ payload: jobList, to: "anaismoutarlier@gmail.com" });
  } catch (error) {
    console.error(error);
  } finally {
    await browser.close();
    console.log("Browser closed.");
  }
};

module.exports = { scrapWTTJ };
