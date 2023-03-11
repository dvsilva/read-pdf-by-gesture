export default class PDF {
  #canvas = document.getElementById('the-canvas');
  #ctx = this.#canvas.getContext('2d');
  #pageNumSpan = document.getElementById('page_num');
  #pageCountSpan = document.getElementById('page_count');

  #pdfDoc = null;
  #pageNum = 3;
  #pageRendering = false;
  #pageNumPending = null;
  #scale = 1.5;

  static init(pdfDoc_) {
    const pdf = new PDF();
    pdf.#pdfDoc = pdfDoc_;
    pdf.#pageCountSpan.textContent = pdf.#pdfDoc.numPages;
    pdf.#renderPage(pdf.#pageNum); // Initial/first page rendering
    return pdf;
  }

  /**
   * Get page info from document, resize canvas accordingly, and render page.
   * @param num Page number.
   */
  async #renderPage(num) {
    this.#pageRendering = true;

    // Using promise to fetch the page
    var page = await this.#pdfDoc.getPage(num).then(function (page) {
      return page;
    });

    var viewport = page.getViewport({ scale: this.#scale });
    this.#canvas.height = viewport.height;
    this.#canvas.width = viewport.width;
    // canvas.height = window.screen.height;
    // canvas.width = window.screen.width;

    // Render PDF page into canvas context
    var renderContext = {
      canvasContext: this.#ctx,
      viewport: viewport,
    };
    var renderTask = page.render(renderContext);

    await renderTask.promise.then(function () {});

    this.#pageRendering = false;
    if (this.#pageNumPending !== null) {
      // New page rendering is pending
      this.#renderPage(this.#pageNumPending);
      this.#pageNumPending = null;
    }

    // Update page counters
    this.#pageNumSpan.textContent = num;
  }

  /**
   * If another page rendering in progress, waits until the rendering is
   * finised. Otherwise, executes rendering immediately.
   */
  #queueRenderPage(num) {
    if (this.#pageRendering) {
      this.#pageNumPending = num;
    } else {
      this.#renderPage(num);
    }
  }

  /**
   * Displays previous page.
   */
  onPrevPage() {
    if (this.#pageNum <= 1) {
      return;
    }
    this.#pageNum--;
    this.#queueRenderPage(this.#pageNum);
  }

  /**
   * Displays next page.
   */
  onNextPage() {
    if (this.#pageNum >= this.#pdfDoc.numPages) {
      return;
    }
    this.#pageNum++;
    this.#queueRenderPage(this.#pageNum);
  }
}
