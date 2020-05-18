class GridCell {

    constructor(x, y, width, xoff, yoff) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.value = 0;
        this.xoff = xoff;
        this.yoff = yoff;
        this.active = false;
        this.dirty = true;
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
        if (this.dirty) {
            this.dirty = false;
            if (this.active) {
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

    setActive(val) {
        this.dirty = true;
        this.active = val;
    }

    paint() {
        this.dirty = true;
        if (cursorMode == 'draw') {
            this.value = 1;
        } else {
            this.value = 0;
        }
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
        this.lastMouseX = 0;
        this.lastMouseY = 0;
    }

    set(x, y, value) {
        this.grid[x][y].value = value;
    }

    setMatrix(mat) {
        for (var i = 0; i < 64; i++) {
            for (var j = 0; j < 64; j++) {
                this.grid[i][j].value = mat[i][j];
                this.grid[i][j].dirty = true;
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
            }
        }
        pop();
    }

    setBrush(x, y, val, paint, range) {
        this.grid[y][x].setActive(val);
        if (paint) this.grid[y][x].paint();

        for (var offx = -range; offx <= range; offx ++) {
            for (var offy = -range; offy <= range; offy ++) {
                let xPos = constrain(x + offx, 0, 63);
                let yPos = constrain(y + offy, 0, 63);
                this.grid[yPos][xPos].setActive(val);
                if (paint) this.grid[yPos][xPos].paint();
            }
        }
    }

    brush() {
        let x = int( (mouseX - this.x) / this.size );
        let y = int( (mouseY - this.y) / this.size );
        if (x >= 0 && x < 64 && y >= 0 && y < 64) {
            this.setBrush(this.lastMouseX, this.lastMouseY, false, false, 2);
            this.setBrush(x, y, true, mouseIsPressed, 1);
            this.lastMouseX = x;
            this.lastMouseY = y;
        }
    }
}