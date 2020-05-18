function setup() {
    canvas = createCanvas(64 * 7, 64 * 7);
    select('.editor').child(canvas);
    cursorMode = 'draw';
    previewMode = 'uppercase';

    preview = new Preview();

    grid = new Grid(0, 0, 7);
    samples = [];

    select('.pen').mousePressed(function () {
        select('.pen').addClass('active');
        select('.erasor').removeClass('active');
        cursorMode = 'draw' 
    });
    select('.erasor').mousePressed(function () { 
        select('.pen').removeClass('active');
        select('.erasor').addClass('active');
        cursorMode = 'erase' 
    });
    select('.clear').mousePressed(function () {
        grid.setMatrix(generateMatrix(64, 64, 0));
    });
    select('.add').mousePressed(addExample);
    let upload = createFileInput(uploadImage);
    upload.id('file-upload');
    select('.upload').child(upload);
    select('.preview-mode').changed(function() {
        previewMode = select('.preview-mode').value();
        generateFont();
    });

    select('.generate').mousePressed(generateFont);

    select('.download').mousePressed(function () {
        downloadURI(preview.dataURL, 'font.png');
    });
}

function downloadURI(uri, name) {
    var link = document.createElement("a");
    link.download = name;
    link.href = uri;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    delete link;
}

function addExample() {
    let imageCell = new ImageCell(samples.length);
    let img = grid.getMatrix();
    imageCell.setMatrix(img);
    samples.push(imageCell);
    select('.tip').hide();
}

function uploadImage(image) {
    if (image.type === 'image') {
        loadImage(image.data, function (img) {
            img.resize(64, 64);
            let mat = generateMatrix(64, 64, 0);
            for (let i = 0; i < img.width; i++) {
                for (let j = 0; j < img.height; j++) {
                    mat[j][i] = brightness(img.get(i, j));
                }
            }
            grid.setMatrix(normalizeMatrix(mat));
        });
    }
}

function imageFromTensor(rows, cols, tensor) {
    const matrix = [];
    for (let row = 0; row < rows; row++) {
        matrix.push([]);
        for (let col = 0; col < cols; col++) {
            matrix[row].push(tensor.get(0, row, col));
        }
    }
    return matrix
}

function generateFont() {
    if (samples.length == 0) return;
    let style = new Tensor(1, 64).fill(0);
    for (var i in samples) {
        let img = Tensor.fromArray(samples[i].matrix).unsqueeze(0);
        style = style.add(vae.encode(img).mu);
    }
    style = style.div(samples.length);

    let chars;
    if (previewMode == 'uppercase') {
        chars = [
            onehot(2, 62),
            onehot(4, 62),
            onehot(19, 62),
            onehot(20, 62),
        ];
    } else if (previewMode == 'lowercase') {
        chars = [
            onehot(2 + 26, 62),
            onehot(4 + 26, 62),
            onehot(19 + 26, 62),
            onehot(20 + 26, 62),
        ];
    } else if (previewMode == 'symbols') {
        chars = [
            onehot(54, 62),
            onehot(57, 62),
            onehot(59, 62),
            onehot(61, 62),
        ];
    }
    let images = [];
    chars.forEach(function(char) {
        z = Tensor.fromArray([[...style.T].concat(char)]);
        images.push(
            imageFromTensor(64, 64, vae.decode(z))
        );
    })
    
    preview.drawImages(images);
}

function draw() {

    if (!loader.finished || !focused) preview.drawProgress(loader.percent);

    grid.draw();
}

function mousePressed() {
    grid.brush();
}

function mouseMoved() {
    grid.brush();
}

function mouseDragged() {
    grid.brush();
}