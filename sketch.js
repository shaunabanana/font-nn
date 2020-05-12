class Preview {
    constructor () {
        let size = select('#preview').size();
        this.width = size.width;
        this.height = size.height;
    }

    drawProgress(percent) {
        this.canvas = createGraphics(this.width, this.height);
        this.canvas.background(255);
        if (percent > 0.99) {
            this.canvas.fill(48, 53, 64);
            this.canvas.noStroke();
            this.canvas.textAlign(CENTER, CENTER);
            this.canvas.text('Neural network loaded!', this.width / 2, this.height / 2);
        } else {
            this.canvas.stroke(48, 53, 64);
            this.canvas.fill(200);
            this.canvas.strokeWeight(2);
            let length = this.width * 0.8;
            let height = 15;
            this.canvas.rect( (this.width - length) / 2, (this.height - height) / 2, length, height);
            this.canvas.fill(240, 208, 96);
            this.canvas.rect( (this.width - length) / 2, (this.height - height) / 2, length * percent, height);
            this.canvas.fill(48, 53, 64);
            this.canvas.noStroke();
            this.canvas.textAlign(CENTER, BOTTOM);
            this.canvas.text('Loading neural network...', this.width / 2, this.height / 2 - 15);
        }
        select('#preview').attribute('src', this.canvas.canvas.toDataURL());
        this.canvas.remove();
    }

    makeImage(mat) {
        let image = createImage(64, 64);
        image.loadPixels();
        for (let i = 0; i < image.width; i++) {
            for (let j = 0; j < image.height; j++) {
                image.set(j, i, color(255 * (1 - mat[i][j])));
            }
        }
        image.updatePixels();
        return image;
    }

    drawImages(images) {
        this.canvas = createGraphics(this.width, this.height);
        this.canvas.background(255);
        let size;
        if (this.width > this.height) {
            size = this.height / 2;
        } else {
            size = this.width / 2;
        }
        let image1 = this.makeImage(images[0])
        image1.resize(size, size);
        let image2 = this.makeImage(images[1])
        image2.resize(size, size);
        let image3 = this.makeImage(images[2])
        image3.resize(size, size);
        let image4 = this.makeImage(images[3])
        image4.resize(size, size);
        
        let offx = (this.width - size * 2) / 2;
        let offy = (this.height - size * 2) / 2;
        this.canvas.image(image1, offx, offy);
        this.canvas.image(image2, offx + size, offy);
        this.canvas.image(image3, offx, offy + size);
        this.canvas.image(image4, offx + size, offy + size);

        select('#preview').attribute('src', this.canvas.canvas.toDataURL());
        this.canvas.remove();
    }
}


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
}

function addExample() {
    let imageCell = new ImageCell(samples.length);
    let img = grid.getMatrix();
    imageCell.setMatrix(img);
    samples.push(imageCell);
    select('.tip').hide();
    generateFont();
}

function uploadImage(image) {
    if (image.type === 'image') {
        loadImage(image.data, function (img) {
            img.resize(64, 64);
            for (let i = 0; i < img.width; i++) {
                for (let j = 0; j < img.height; j++) {
                    let val = 1 - brightness(img.get(i, j));
                    grid.set(j, i, val);
                }
            }
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