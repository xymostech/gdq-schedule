const https = require("https");
const fs = require("fs");
const path = require("path");

const jsdom = require("jsdom");

https.get("https://gamesdonequick.com/schedule", res => {
    if (res.statusCode !== 200) {
        throw new Error("Failed to fetch schedule!");
    }

    res.setEncoding("utf8");
    let page = "";
    res.on("data", chunk => {
        page += chunk;
    });
    res.on("end", () => {
        const dom = new jsdom.JSDOM(page);
        const document = dom.window.document;

        const trs = Array.from(
            document
                .querySelector("#runTable")
                .querySelectorAll("tr:not(.day-split)"),
        );
        let runs = [];
        for (let i = 0; i < trs.length; i += 2) {
            runs.push([trs[i], trs[i + 1]]);
        }
        runs = runs.map(x => {
            const topRowInfo = x[0].querySelectorAll("td");
            const bottomRowInfo = x[1].querySelectorAll("td");
            const runPlatform = bottomRowInfo[1].textContent.split(" — ");
            return {
                time: topRowInfo[0].textContent.replace(/\s/g, ""),
                name: topRowInfo[1].textContent,
                runners: topRowInfo[2].textContent,
                setupLength: topRowInfo[3].textContent.replace(/\s/g, ""),
                duration: bottomRowInfo[0].textContent.replace(/\s/g, ""),
                runKind: runPlatform[0],
                platform: runPlatform[1],
                host: bottomRowInfo[2].textContent,
            };
        });

        const dataPath = path.join(__dirname, "..", "data", "schedule.json");
        const output = JSON.stringify(runs);
        fs.writeFileSync(dataPath, output);
        console.log(`Wrote ${output.length} bytes to ${dataPath}`);
    });
});
