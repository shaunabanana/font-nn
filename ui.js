class ImageCell {

    constructor (id) {
        this.id = id;
        this.element = createDiv();
        this.imgElement = createImg('', '');
        this.matrix = generateMatrix(64, 64, 0);

        this.element.addClass('img-element');
        let del = createDiv();
        del.html('delete');
        del.addClass('delete');
        this.element.child(this.imgElement);
        this.element.child(del);

        select('.img-list').child(this.element);

        this.element.mousePressed(function () {
            this.element.remove();
            samples.splice(this.id, 1);
            if (samples.length == 0) {
                select('.tip').show();
            } else {
                for (var i in samples) {
                    samples[i].id = i;
                }
            }
        }.bind(this));
    }

    setMatrix(mat) {
        this.matrix = mat;
        this.canvas = createGraphics(64, 64);
        this.image = createImage(64, 64);
        this.image.loadPixels();
        for (let i = 0; i < this.image.width; i++) {
            for (let j = 0; j < this.image.height; j++) {
                this.image.set(j, i, color(255 * (1 - mat[i][j])));
            }
        }
        this.image.updatePixels();
        this.canvas.image(this.image, 0, 0);
        this.imgElement.attribute('src', this.canvas.canvas.toDataURL());
        this.image = null;
        this.canvas.remove();
        this.canvas = null;
    }

}


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