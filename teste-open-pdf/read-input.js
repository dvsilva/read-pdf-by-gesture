document.querySelector('#pdf-upload').addEventListener('change', function (e) {
  var file = e.target.files[0];
  if (file.type != 'application/pdf') {
    console.error(file.name, 'is not a pdf file.');
    return;
  }

  var fileReader = new FileReader();

  fileReader.onload = function () {
    var typedarray = new Uint8Array(this.result);

    pdfjsLib.getDocument(typedarray).then(function (pdf) {
      // you can now use *pdf* here
      console.log('the pdf has ', pdf.numPages, 'page(s).');
      pdf.getPage(1).then(function (page) {
        // you can now use *page* here
        var viewport = page.getViewport(1);
        var canvas = document.createElement('canvas');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        page.render({
          canvasContext: canvas.getContext('2d'),
          viewport: viewport,
        });

        var div = document.createElement('div');
        div.innerHTML = canvas.toDataURL('image/jpeg', 0.8);
        document.body.appendChild(div);
      });
    });
  };

  fileReader.readAsArrayBuffer(file);
});
