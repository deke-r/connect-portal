const puppeteer = require('puppeteer-core');
const { JSDOM } = require('jsdom');
const { PDFDocument } = require('pdf-lib');

async function generatePDF(htmlContent) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    
    await page.setContent(htmlContent);


    const { width, height } = await page.evaluate(() => {
        const body = document.querySelector('body');
        return {
            width: body.scrollWidth,
            height: body.scrollHeight
        };
    });


    await page.setViewport({ width, height });


    const pdfBuffer = await page.pdf({ format: 'a4' });

    await browser.close();

    return pdfBuffer;
}

module.exports = generatePDF;
