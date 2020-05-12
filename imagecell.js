class ImageCell {

    constructor (id) {
        this.id = id;
        this.image = createImage(64, 64);
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
            samples.splice(id, 1);
            if (samples.length == 0) {
                select('.tip').show();
            } else {
                generateFont();
            }
        }.bind(this));
    }

    setMatrix(mat) {
        this.matrix = mat;
        this.canvas = createGraphics(64, 64);
        this.image.loadPixels();
        for (let i = 0; i < this.image.width; i++) {
            for (let j = 0; j < this.image.height; j++) {
                this.image.set(j, i, color(255 * (1 - mat[i][j])));
            }
        }
        this.image.updatePixels();
        this.canvas.image(this.image, 0, 0);
        this.imgElement.attribute('src', this.canvas.canvas.toDataURL());
        this.canvas.remove();
    }

}