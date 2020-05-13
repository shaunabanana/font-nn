class GridCell {

    constructor(x, y, width, xoff, yoff) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.value = 0;
        this.xoff = xoff;
        this.yoff = yoff;
    }

    hit() {
        let x = int( (mouseX - this.xoff) / this.width );
        let y = int( (mouseY - this.yoff) / this.width );
        if (abs( this.x - x) <= 1 && abs( this.y - y) <= 1){
            return true;
        }
        return false;
    }

    draw() {
        if (this.hit()) {
            if (mouseIsPressed) {
                if (cursorMode == 'draw') {
                    this.value = 1;
                } else {
                    this.value = 0;
                }
            }
            strokeWeight(1);
            stroke(128);
        } else {
            strokeWeight(1);
            stroke(240);
        }
        fill((1 - this.value) * 255);
        rect(this.x * this.width, this.y * this.width, this.width, this.width);
    }

}

class Grid {

    constructor(x, y, size) {
        this.grid = [];
        this.x = x;
        this.y = y;
        this.size = size;
        for (var i = 0; i < 64; i++) {
            let row = [];
            for (var j = 0; j < 64; j++) {
                row.push(new GridCell(j, i, size, x, y));
            }
            this.grid.push(row);
        }
        this.currentHit = null;
    }

    set(x, y, value) {
        this.grid[x][y].value = value;
    }

    setMatrix(mat) {
        for (var i = 0; i < 64; i++) {
            for (var j = 0; j < 64; j++) {
                this.grid[i][j].value = mat[i][j];
            }
        }
    }

    getMatrix() {
        let matrix = [];
        for (var i = 0; i < 64; i++) {
            let row = [];
            for (var j = 0; j < 64; j++) {
                row.push(this.grid[i][j].value);
            }
            matrix.push(row);
        }
        return matrix;
    }

    draw() {
        push();
        translate(this.x, this.y);
        for (var i = 0; i < 64; i++) {
            for (var j = 0; j < 64; j++) {
                this.grid[i][j].draw();
                if (this.grid[i][j].hit()) {
                    this.dirty = true;
                    this.currentHit = [i, j];
                }
            }
        }
        pop();
    }
}