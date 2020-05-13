function setup() {
    canvas = createCanvas(64 * 7, 64 * 7);
    select('.editor').child(canvas);
    cursorMode = 'draw';
    previewMode = 'uppercase';

    preview = new Preview();
    nn = new FontVAE();
    nn.loadFiles();

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

function generateFont() {
    if (!nn.finished || samples.length == 0) return;
    let styles = [];
    for (var i in samples) {
        let img = samples[i].matrix;
        styles.push(nn.encode(img));
    }
    let style = averageMatrices(styles);

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
        z = [[...style[0]].concat(char)];
        images.push(nn.decode(z));
    })
    preview.drawImages(images);
}

function draw() {
    background(255);

    grid.draw();

    if (!nn.finished) {
        nn.draw();
    }
}