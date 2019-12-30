const https = require("https");
const fs = require("fs");
const path = require("path");
const moment = require("moment");
const readline = require("readline");

const jsdom = require("jsdom");

function prompt(question, cb) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    rl.question(question, answer => {
        cb(answer);
        rl.close();
    });
}

const runProperties = [
    'time',
    'name',
    'runners',
    'setupLength',
    'duration',
    'runKind',
    'platform',
    'host',
];

// Returns a list of properties that are different between a and b ([] if none)
function diffRuns(runA, runB) {
    return runProperties.filter(prop => runA[prop].trim() !== runB[prop].trim());
}

function findShortestDiff(startRuns, endRuns) {
    const paths = Array.from({length: startRuns.length + 1}).map(() =>
        Array.from({length: endRuns.length + 1}).map(() => ({})));

    const ADD_REMOVE_COST = (runProperties.length - 1) / 2;

    function getCost(i, j) {
        if (i < 0 || j < 0) {
            return Infinity;
        }
        return paths[i][j].cost;
    }

    for (let i = 0; i < startRuns.length + 1; i++) {
        for (let j = 0; j < endRuns.length + 1; j++) {
            if (i === 0 && j === 0) {
                paths[i][j] = {
                    cost: 0,
                    transition: "START",
                };
                continue;
            }
            const diffs = i > 0 && j > 0 && diffRuns(startRuns[i - 1], endRuns[j - 1]);

            const addCost = getCost(i, j - 1) + ADD_REMOVE_COST;
            const removeCost = getCost(i - 1, j) + ADD_REMOVE_COST;
            const replaceCost = getCost(i - 1, j - 1) + (diffs ? diffs.length : Infinity);

            if (addCost < removeCost && addCost < replaceCost) {
                paths[i][j] = {
                    cost: addCost,
                    transition: "ADD",
                    new: endRuns[j - 1],
                };
            } else if (removeCost < addCost && removeCost < replaceCost) {
                paths[i][j] = {
                    cost: removeCost,
                    transition: "REMOVE",
                    old: startRuns[i - 1],
                };
            } else {
                paths[i][j] = {
                    cost: replaceCost,
                    transition: "REPLACE",
                    old: startRuns[i - 1],
                    new: endRuns[j - 1],
                    diffs,
                };
            }
        }
    }

    let searchI = startRuns.length;
    let searchJ = endRuns.length;
    const bestPath = [];
    while (paths[searchI][searchJ].transition !== "START") {
        const elem = paths[searchI][searchJ];
        bestPath.unshift(elem);

        if (elem.transition === "ADD") {
            searchJ -= 1;
        } else if (elem.transition === "REMOVE") {
            searchI -= 1;
        } else {
            searchI -= 1;
            searchJ -= 1;
        }
    }

    return bestPath;
}

function* zip(a, b) {
    for (let i = 0; i < a.length && i < b.length; i++) {
        yield [a[i], b[i]];
    }
}

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

        const output = JSON.stringify(runs);

        const backupDataPath = path.join(__dirname, "..", "data-backup", `schedule-${moment().format("YYYY-MM-DD_HH:mm")}.json`);
        fs.writeFileSync(backupDataPath, output);

        const dataPath = path.join(__dirname, "..", "data", "schedule.json");
        const previousRuns = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

        let hadChanges = false;
        for (const [newRun, oldRun] of zip(runs, previousRuns)) {
            const changedProps = diffRuns(newRun, oldRun);

            if (changedProps.length > 0) {
                hadChanges = true;
            }
        }

        if (hadChanges) {
            const diffs = findShortestDiff(previousRuns, runs);

            let timeChanges = 0;
            for (const diff of diffs) {
                if (diff.transition === "REPLACE" && diff.diffs.length === 0) {
                    continue;
                }

                if (
                    diff.transition === "REPLACE" &&
                    diff.diffs.length === 1 &&
                    diff.diffs[0] === "time"
                ) {
                    timeChanges += 1;
                    continue;
                }

                if (timeChanges > 0) {
                    console.log(`(Start time changed for ${timeChanges} runs...)`);
                    console.log('');
                    timeChanges = 0;
                }

                if (diff.transition === "ADD") {
                    console.log(`Run added: ${diff.new.name}`);
                    console.log('');
                } else if (diff.transition === "REMOVE") {
                    console.log(`Run removed: ${diff.old.name}`);
                    console.log('');
                } else if (diff.transition === "REPLACE") {
                    console.log(`Run changed: ${diff.new.name}`);
                    diff.diffs.forEach(propName => {
                        console.log(`${propName}: ${diff.old[propName]} -> ${diff.new[propName]}`);
                    });
                    console.log('');
                }
            }

            if (timeChanges > 0) {
                console.log(`(Start time changed for ${timeChanges} runs...)`);
                console.log('');
                timeChanges = 0;
            }

            prompt('Changes were made. Save? (Y/n) ', answer => {
                if (answer.trim() === '' || answer.trim().toLowerCase() === 'y') {
                    fs.writeFileSync(dataPath, output);
                    console.log(`Wrote ${output.length} bytes to ${dataPath} and ${backupDataPath}`);
                } else {
                    console.log(`Wrote ${output.length} bytes to ${backupDataPath}`);
                }
            });
        } else {
            console.log("Nothing changed.");
            console.log(`Wrote ${output.length} bytes to ${backupDataPath}`);
        }
    });
});
