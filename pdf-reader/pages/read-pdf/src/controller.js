import PDF from '../../../lib/shared/pdf.js';

export default class Controller {
  #view;
  #camera;
  #pdf;
  #worker;
  #blinkCounter = 0;
  constructor({ view, worker, camera }) {
    this.#view = view;
    this.#camera = camera;
    this.#worker = this.#configureWorker(worker);

    this.#view.configureOnBtnClick(this.onBtnStart.bind(this));
    this.#view.configureUpload(this.onFileUploaded.bind(this));

    this.#view.configureOnPrevPageBtnClick(this.onBtnPrevPage.bind(this));
    this.#view.configureOnNextPageBtnClick(this.onBtnNextPage.bind(this));
  }

  static async initialize(deps) {
    const controller = new Controller(deps);
    controller.log('not yet detecting eye blink! click in the button to start');
    return controller.init();
  }

  #configureWorker(worker) {
    let ready = false;
    worker.onmessage = ({ data }) => {
      if ('READY' === data) {
        console.log('worker is ready!');
        this.#view.enableButton();
        ready = true;
        return;
      }
      const blinked = data.blinked;
      this.#blinkCounter += blinked;

      if (this.#blinkCounter >= 2) {
        this.#pdf.onNextPage();
        this.#blinkCounter = 0;
      }
      console.log('blinked', blinked);
    };

    return {
      send(msg) {
        if (!ready) return;
        worker.postMessage(msg);
      },
    };
  }
  async init() {
    console.log('init!!');
  }

  loop() {
    const video = this.#camera.video;
    const img = this.#view.getVideoFrame(video);
    this.#worker.send(img);
    this.log(`detecting eye blink...`);
    setTimeout(() => this.loop(), 100);
  }
  log(text) {
    const times = `      - blinked times: ${this.#blinkCounter}`;
    this.#view.log(`status: ${text}`.concat(this.#blinkCounter ? times : ''));
  }

  onBtnStart() {
    this.log('initializing detection...');
    this.#blinkCounter = 0;
    this.loop();
  }

  async #loadNewDocument(result) {
    var arrayBuffer = result;
    var pdfData = new Uint8Array(arrayBuffer);

    var loadingTask = pdfjsLib.getDocument({ data: pdfData });

    var pdfDoc_ = await loadingTask.promise.then(function (pdfDoc_) {
      return pdfDoc_;
    });

    this.#pdf = PDF.init(pdfDoc_);
  }

  onFileUploaded(e) {
    var file = e.target.files[0];
    if (file.type != 'application/pdf') {
      console.error(file.name, 'is not a pdf file.');
      return;
    }

    var fileReader = new FileReader();

    fileReader.addEventListener('load', (e) => {
      this.#loadNewDocument(e.target.result);
    });

    fileReader.readAsArrayBuffer(file);
  }

  onBtnPrevPage() {
    this.#pdf.onPrevPage();
  }

  onBtnNextPage() {
    this.#pdf.onNextPage();
  }
}
