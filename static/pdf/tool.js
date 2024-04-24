const {
    PDFDocument, StandardFonts, rgb, reduceRotation,
    adjustDimsForRotation, rotateInPlace, componentsToColor,
    widgetFontSize, fieldFontSize, widgetColor,
    fieldColor, setFillingColor, setFontAndSize,
    lineSplit, cleanText, TextAlignment, drawTextField,
    degrees
} = PDFLib;

// const{fontkit} = 'https://cdn.skypack.dev/@pdf-lib/fontkit';

pdfFileForView = "FormBenhAn.pdf";

async function customDownload(data, url, filename) {
    // nothing here because not using in here
}

var viewerTag = null;
var firstPageTag = null;
var secondPageTag = null;
var pdfPageWidth = 0;
var pdfPageHeight = 0;
var prePosPdfX = 0;
var prePosPdfY = 0;
var inToolEnviroment = true;

const pageEventClickListener = async (pagename, event, rect) => {
    if (!inToolEnviroment) {
        return;
    }
    const { clientX, clientY } = event;
    const { x, y, width, height } = rect;
    //console.log("width = %f, height = %f", width, height);
    let avgScale = ((width / pdfPageWidth) + (height / pdfPageHeight)) / 2;
    //console.log("pagename = %s, clientX = %f, clientY = %f, x = %f, y = %f, avgScale = %f", pagename, clientX, clientY, x, y, avgScale);
    let posViewX = clientX - x;
    let posViewY = clientY - y;
    let posPdfX = posViewX / avgScale;
    let posPdfY = posViewY / avgScale;
    posPdfY = pdfPageHeight - posPdfY;

    //console.log("posViewX: %f, posViewY: %f, posPdfX: %f, posPdfY: %f", posViewX, posViewY, posPdfX, posPdfY);
    let dX = posPdfX - prePosPdfX;
    let dY = posPdfY - prePosPdfY;
    console.log("X = %f, Y = %f, width = %f, height = %f", prePosPdfX, prePosPdfY, dX, dY);
    // coding continue
    prePosPdfX = posPdfX;
    prePosPdfY = posPdfY;
}

const viewerEventClickListener = async (e) => {
    console.log("debug - a click in viewer area");
    if ((firstPageTag == null || secondPageTag == null) && viewerTag != null) {
        const pages = viewerTag.getElementsByClassName("page");
        console.log("debug - number page: " + pages.length);
        if (pages.length >= 2) {
            firstPageTag = pages[0];
            secondPageTag = pages[1];
            firstPageTag.addEventListener("click", (e) => {
                let textLayers = firstPageTag.getElementsByClassName("textLayer");
                if (textLayers != undefined && textLayers.length > 0) {
                    let textLayer = textLayers[0];
                    let textRect = textLayer.getBoundingClientRect();
                    pageEventClickListener("first page", e, textRect);
                }
            });
            secondPageTag.addEventListener("click", (e) => {
                let textLayers = secondPageTag.getElementsByClassName("textLayer");
                if (textLayers != undefined && textLayers.length > 0) {
                    let textLayer = textLayers[0];
                    let textRect = textLayer.getBoundingClientRect();
                    pageEventClickListener("second page", e, textRect);
                }
            });
        }
        viewerTag.removeEventListener("click", viewerEventClickListener, true);
    }
}
async function addTextFieldToForm(fieldName, x, y, width, height, page, form, pdfFont, fontSize = TEXT_FIELD_FONTSIZE_DEFAULT, maxLength = TEXT_FIELD_MAXLENGTH_DEFAULT){
    var textField = form.createTextField(fieldName);
    textField.setMaxLength(maxLength);
    textField.setText("");
    textField.updateAppearances(pdfFont);
    textField.addToPage(page, {
        x: x,
        y: y,
        width: width,
        height: height,
        textColor: rgb(0, 0, 0),
        backgroundColor: rgb(1, 1, 1),
        borderColor: rgb(0, 0, 0),
        borderWidth: 1,
        rotate: degrees(0),
        font: pdfFont,
    });
    textField.setFontSize(fontSize);
    textField.defaultUpdateAppearances(pdfFont);
}

async function addAnnotationToFirstPage(page, form, pdfFont) {
    addTextFieldToForm(HOSPITAL, 145, 785, 180, 20, page, form, pdfFont);
    addTextFieldToForm(DD, 112, 767, 16, 20, page, form, pdfFont);
    addTextFieldToForm(MM, 153, 767, 16, 20, page, form, pdfFont);
    addTextFieldToForm(YYYY, 190, 767, 28, 20, page, form, pdfFont);
    addTextFieldToForm(NAME, 170, 710, 124, 20, page, form, pdfFont);
    addTextFieldToForm(BIRTHDAY, 406, 710, 124, 20, page, form, pdfFont);
    addTextFieldToForm(ADDRESS, 142, 680, 394, 20, page, form, pdfFont);
    addTextFieldToForm(PHONE, 142, 648, 394, 20, page, form, pdfFont);
}

async function addAnnotationToSecondPage(page, form, pdfFont) {
    const { width, height } = page.getSize();
    const fontSize = 14;
    const txt = "This is content of second page !!!";
    page.drawText(txt, {
        x: 50,
        y: height - 1.2 * fontSize,
        size: fontSize,
        font: pdfFont,
        color: rgb(0.5, 0.5, 0),
    });
    //form.flatten();
}

async function createFileWithAddFields() {
    const uri = "../static/" + pdfFileForView;
    console.log("uri: " + uri);
    const existingPdfBytes = await fetch(uri).then((res) =>
        res.arrayBuffer()
    );

    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    
    const url = '../static/arial.ttf';
    const fontBytes = await fetch(url).then((res) => res.arrayBuffer());
    
    pdfDoc.registerFontkit(fontkit);

    const customFont = await pdfDoc.embedFont(fontBytes);

    const pages = pdfDoc.getPages();

    const firstPage = pages[0];
    const secondPage = pages[1];

    const form = pdfDoc.getForm();
    //const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    await addAnnotationToFirstPage(firstPage, form, customFont);
    await addAnnotationToSecondPage(secondPage, form, customFont);
    pdfDoc.setProducer(PRODUCER_VALUE);
    pdfDoc.setCreator(CREATOR_VALUE);
    pdfDoc.setAuthor(AUTHOR_VALUE);
    const pdfBytes = await pdfDoc.save();
    download(pdfBytes, PDF_FILE_NAME_DOWNLOAD, "application/pdf");
}

window.onload = function () {
    viewerTag = document.getElementById("viewer");
    if (viewerTag != undefined) {
        viewerTag.addEventListener("click", viewerEventClickListener, true);
    }
    // tao thanh doc ben phia tay phai de chua cac option tool
    const divPdfTools = document.createElement("div");
    divPdfTools.style.margin = "5px";
    divPdfTools.style.position = "absolute";
    divPdfTools.style.alignItems = "flex-end";
    divPdfTools.style.right = "5px";
    divPdfTools.style.top = "25px";
    divPdfTools.style.flexDirection = "column";
    // var outerContainerDiv = document.getElementById("outerContainer");
    document.body.appendChild(divPdfTools);

    const buttonCreateFile = document.createElement("button");
    buttonCreateFile.addEventListener("click", createFileWithAddFields);
    buttonCreateFile.innerHTML = "Create File";
    divPdfTools.appendChild(buttonCreateFile);
};