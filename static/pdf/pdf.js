const {
  PDFDocument, StandardFonts, rgb, reduceRotation,
  adjustDimsForRotation, rotateInPlace, componentsToColor,
  widgetFontSize, fieldFontSize, widgetColor,
  fieldColor, setFillingColor, setFontAndSize,
  lineSplit, cleanText, TextAlignment, drawTextField,
  degrees
} = PDFLib;


pdfFileForView = "FormBenhAn_Form.pdf";


async function collectAllText(pdfDocument) {
  const texts = [];
  const buffer = [];
  console.log("numPage: ", pdfDocument.numPages);

  for (let pageNum = 1, pagesCount = pdfDocument.numPages; pageNum <= pagesCount; ++pageNum) {
    buffer.length = 0;
    const page = await pdfDocument.getPage(pageNum);
    const {
      items
    } = await page.getTextContent();
    for (const item of items) {
      if (item.str) {
        buffer.push(item.str);
      }
      if (item.hasEOL) {
        buffer.push("\n");
      }
    }
    texts.push(buffer.join(""));
  }

  return texts.join("\n");
}

async function drawTextFromStorage(dataEle, pages, customFont) {
  let page = pages[dataEle.pageIndex];
  let text = dataEle.value;
  let x = dataEle.rect[0];
  let y = dataEle.rect[1];
  let width = dataEle.rect[2] - dataEle.rect[0];
  let height = dataEle.rect[3] - dataEle.rect[1];
  let fontSize = dataEle.fontSize;
  width = Math.max(width, customFont.widthOfTextAtSize(text, fontSize));
  height = Math.max(height, customFont.heightAtSize(fontSize));
  page.drawText(text, {
    x: x,
    y: y + 3,
    font: customFont,
    size: fontSize
  });
  // page.drawRectangle({
  //   x: x,
  //   y: y,
  //   width: width,
  //   height: height,
  //   borderWidth: 0.5,
  //   borderColor: rgb(0,0,0)
  // });
}
const patternForPhone = /^[0]?[123456789]\d{8,13}$/;
async function isCorrectPhone(phone) {
  if (phone == undefined || phone == null || phone.length < 9 || phone.length > 13) return false;
  return patternForPhone.test(phone);
}

async function customDownload(data, pdfDocument = null) {
  const pdfDoc = await PDFDocument.load(data);
  const uriArialTTF = '../static/arial.ttf';
  const fontBytes = await fetch(uriArialTTF).then((res) => res.arrayBuffer());
  pdfDoc.registerFontkit(fontkit);
  const customFont = await pdfDoc.embedFont(fontBytes);
  var info = {}
  var form = pdfDoc.getForm();
  const pages = pdfDoc.getPages();
  var filenameDownload = "";
  for (let element in dataElementStorage) {
    let removeField = form.getFields().find(x => x.getName() == element);
    form.removeField(removeField);
    drawTextFromStorage(dataElementStorage[element], pages, customFont);
    info[element] = dataElementStorage[element].value;
    if (element == PHONE) {
      filenameDownload = dataElementStorage[element].value;
    }
  }

  form.updateFieldAppearances(customFont);
  form.flatten({ updateFieldAppearances: false });
  console.log("filename download: " + filenameDownload);

  if (filenameDownload == "" || !isCorrectPhone(filenameDownload)) {
    return;
  }
  // Gửi dữ liệu bằng Axios
  let response = await axios({
    method: 'post',
    url: "/pdf/api",
    data: info,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
    withCredentials: true
  });
  console.log(response.data);
  if (response.data.code == 0) {
    const matches = document.querySelectorAll('input[data-element-id]');
    for (let idx in matches) {
      let match = matches[idx];
      match.value = "";
    }
    pdfDoc.save().then(pdfBytes => {
      download(pdfBytes, filenameDownload + ".pdf", "application/pdf");
    });
  }
}

window.onload = function () {
  viewerTag = document.getElementById("viewer");
  if (viewerTag != undefined) {
    // go to here
  }
};