"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const puppeteer_1 = __importDefault(require("puppeteer"));
const yargs_1 = __importDefault(require("yargs"));
const helpers_1 = require("yargs/helpers");
const fs = __importStar(require("fs"));
const path_1 = __importDefault(require("path"));
const http_1 = __importDefault(require("http"));
require("./lib/wasm_exec.js");
const puppeteer_screen_recorder_1 = require("puppeteer-screen-recorder");
const timer_1 = require("./utils/timer");
const string_1 = require("./utils/string");
const audio_1 = require("./utils/audio");
const Version = "1.0.0";
// Define the command
(0, yargs_1.default)((0, helpers_1.hideBin)(process.argv))
    .command('version', 'Check current version', () => { }, () => {
    console.log(`Cherry Studio Converter @${Version}`);
    process.exit(0);
})
    .command('do <csmp>', 'Convert a csmp file into mp4', (yargs) => {
    return yargs.positional('csmp', {
        describe: 'Path to csmp file',
        type: 'string'
    });
}, async (argv) => {
    if (!argv.csmp) {
        throw new Error("Invalid csmp file path");
    }
    try {
        console.log(`Reading ${argv.csmp}...`);
        const fileBuffer = await fs.promises.readFile(argv.csmp);
        const coWasmBuffer = await fs.promises.readFile(path_1.default.resolve("./lib/co.wasm"));
        const go = new Go();
        const module = await WebAssembly.compile(coWasmBuffer);
        const instance = await WebAssembly.instantiate(module, go.importObject);
        go.run(instance);
        await (0, timer_1.waitTil)(() => {
            return !!global.coLoadCSMPFile;
        });
        const result = global.coLoadCSMPFile(fileBuffer);
        console.log(`Converting ${argv.csmp}...`);
        const port = 8080; // You can choose a different port if needed
        const server = http_1.default.createServer((req, res) => {
            res.writeHead(200, {
                'Access-Control-Allow-Origin': '*', // Allow CORS from your origin
                'Access-Control-Allow-Methods': 'GET', // Adjust methods as needed (e.g., 'GET, POST')
                'Access-Control-Allow-Headers': 'Content-Type', // Adjust headers as needed
            });
            res.end(fileBuffer);
        });
        server.listen(port, () => { });
        const browser = await puppeteer_1.default.launch({
            headless: false,
            executablePath: `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`
        });
        const page = await browser.newPage();
        page.setDefaultTimeout(result.sessionInitFile.durationInSeconds * 1000 + 10000);
        await page.setViewport({
            width: 1280,
            height: 720,
            deviceScaleFactor: 1,
        });
        await page.goto(`http://localhost:3000/embed?src=http://localhost:${port}&control=none&muted=y`);
        await page.waitForSelector("[data-overall-ready=y]");
        const recorder = new puppeteer_screen_recorder_1.PuppeteerScreenRecorder(page, {
            fps: 60,
            videoFrame: { width: 1280, height: 720 },
            videoCrf: 1,
            videoBitrate: 5000000,
            aspectRatio: '16:9',
        });
        const tmpConvertedFile = `${argv.csmp}.${(0, string_1.generateRandomString)(5)}`;
        await recorder.start(tmpConvertedFile);
        await page.evaluate(() => {
            document.querySelector('[data-purpose=play-btn]').click();
        });
        await page.waitForSelector("[data-ended=y]");
        await recorder.stop();
        await browser.close();
        const outBuffer = await (0, audio_1.mergeAudiosIntoVideo)(await fs.promises.readFile(tmpConvertedFile), Object.keys(result.components)
            .map(componentName => ({
            content: new Uint8Array(result.components[componentName]),
            startFromSecond: result.sessionInitFile.timeline.find(c => c.componentName === componentName).startFromSecond
        })));
        const outFileName = `${argv.csmp}.mp4`;
        await fs.promises.writeFile(outFileName, outBuffer);
        process.exit(0);
    }
    catch (e) {
        if (e instanceof Error) {
            console.error(e.message);
        }
        else {
            console.error(e);
        }
        process.exit(1);
    }
})
    .demandCommand(1, 'You need at least one command before moving on')
    .help()
    .argv;
