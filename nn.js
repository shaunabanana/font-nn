gpu = new GPU();

function generateMatrix(rows, cols, val) {
    const matrix = [];
    for (let row = 0; row < rows; row++) {
        matrix.push([]);
        for (let col = 0; col < cols; col++) {
            matrix[row].push(typeof val == 'undefined' ? Math.random() : val);
        }
    }
    return matrix
}

function generateOnes(rows, cols) {
    const matrix = [];
    for (let row = 0; row < rows; row++) {
        matrix.push([]);
        for (let col = 0; col < cols; col++) {
            matrix[row].push(1);
        }
    }
    return matrix
}

function onehot(val, size) {
    const matrix = [];
    for (let i = 0; i < size; i++) {
        matrix.push( i == val ? 1 : 0 );
    }
    return matrix;
}

function transposeMatrix(mat) {
    const matrix = [];
    for (let row = 0; row < mat[0].length; row++) {
        matrix.push([]);
        for (let col = 0; col < mat.length; col++) {
            matrix[row].push(mat[col][row]);
        }
    }
    return matrix
}

function reshapeMatrix(mat, rows, cols) {
    const matrix = [];

    let oldRows = mat.length;
    let oldCols = mat[0].length
    if (oldRows * oldCols != rows * cols) {
        print('wrong dimension!');
        return;
    }

    for (let row = 0; row < rows; row++) {
        matrix.push([]);
        for (let col = 0; col < cols; col++) {
            let ind = row * cols + col;
            let r = int( ind / oldCols );
            let c = ind % oldCols;
            let content = mat[r][c];
            matrix[row].push(content);
        }
    }
    return matrix;
}


function averageMatrices(matrices) {
    let rows = matrices[0].length;
    let cols = matrices[0][0].length;
    
    let add = gpu.createKernel(function (a, b) {
        return a[this.thread.y][this.thread.x] + b[this.thread.y][this.thread.x];
    }).setOutput({ x: cols, y: rows});
    
    let div = gpu.createKernel(function (a, val) {
        return a[this.thread.y][this.thread.x] / val;
    }).setOutput({ x: cols, y: rows});

    let sum = matrices[0];
    for (var i = 1; i < matrices.length; i++) {
        sum = add(sum, matrices[i]);
    }
    return div(sum, matrices.length);
}

function normalizeMatrix(mat) {
    let maxNum = Number.MIN_SAFE_INTEGER;
    
    for (let row = 0; row < mat.length; row++) {
        for (let col = 0; col < mat[0].length; col++) {
            maxNum = mat[row][col] > maxNum ? mat[row][col] : maxNum;
        }
    }

    for (let row = 0; row < mat.length; row++) {
        for (let col = 0; col < mat[0].length; col++) {
            mat[row][col] = mat[row][col] / maxNum;
        }
    }
    return mat;
}

class FontVAE {

    constructor(loader) {
        this.loaded = 0;
        this.finished = false;
        this.percent = 0;
        this.fc1w = [];
        this.fc1b = [];
        this.fc21w = [];
        this.fc21b = [];
        this.fc22w = [];
        this.fc22b = [];
        this.fc3w = [];
        this.fc3b = [];
        this.fc4w = [];
        this.fc4b = [];

        this.encoderAddress = 'weights/'
        this.decoderAddress = 'weights/'

        this.files = [];
        this.files.push({
            dest: 'fc1b',
            url: this.encoderAddress + 'model-fc1b-0-8192.bin'
        });

        
        this.files.push({
            dest: 'fc21b',
            url: this.encoderAddress + 'model-fc21b-0-64.bin'
        });
        this.files.push({
            dest: 'fc22b',
            url: this.encoderAddress + 'model-fc22b-0-64.bin'
        });
        
        this.files.push({
            dest: 'fc3b',
            url: this.decoderAddress + 'model-fc3b-0-8192.bin'
        });

        this.files.push({
            dest: 'fc4b',
            url: this.decoderAddress + 'model-fc4b-0-4096.bin'
        });

        for (var i = 0; i < 4096; i++) {
            this.files.push({
                dest: 'fc1w',
                url: this.encoderAddress + 'model-fc1w-' + i + '-8192.bin'
            });
        }

        for (var j = 0; j < 64; j++) {
            this.files.push({
                dest: 'fc21w',
                url: this.encoderAddress + 'model-fc21w-' + j + '-8192.bin'
            });
            this.files.push({
                dest: 'fc22w',
                url: this.encoderAddress + 'model-fc22w-' + j + '-8192.bin'
            });
        }

        for (var k = 0; k < 126; k++) {
            this.files.push({
                dest: 'fc3w',
                url: this.decoderAddress + 'model-fc3w-' + k + '-8192.bin'
            });
        }

        
        for (var l = 0; l < 4096; l++) {
            this.files.push({
                dest: 'fc4w',
                url: this.decoderAddress + 'model-fc4w-' + l + '-8192.bin'
            });
        }
        

        this.total = this.files.length;
        this.totalLoaded = 0;

        this.gpu = new GPU();

        this.multiplyW1 = this.gpu.createKernel(function (a, b) {
            let sum = 0;
            for (let i = 0; i < 4096; i++) {
                sum += a[this.thread.y][i] * b[i][this.thread.x];
            }
            return sum;
        }).setOutput({ x: 8192, y: 1 });
        
        this.addB1 = this.gpu.createKernel(function (a, b) {
            return a[this.thread.y][this.thread.x] + b[this.thread.y][this.thread.x];
        }).setOutput({ x: 8192, y: 1 });

        this.relu1 = this.gpu.createKernel(function (a) {
            if (a[this.thread.y][this.thread.x] < 0) return 0;
            else return a[this.thread.y][this.thread.x]
        }).setOutput({ x: 8192, y: 1 });
        
        this.multiplyW21 = this.gpu.createKernel(function (a, b) {
            let sum = 0;
            for (let i = 0; i < 8192; i++) {
                sum += a[this.thread.y][i] * b[i][this.thread.x];
            }
            return sum;
        }).setOutput({ x: 64, y: 1 });
        
        this.addB21 = this.gpu.createKernel(function (a, b) {
            return a[this.thread.y][this.thread.x] + b[this.thread.y][this.thread.x];
        }).setOutput({ x: 64, y: 1 });
        
        this.multiplyW3 = this.gpu.createKernel(function (a, b) {
            let sum = 0;
            for (let i = 0; i < 126; i++) {
                sum += a[this.thread.y][i] * b[i][this.thread.x];
            }
            return sum;
        }).setOutput({ x: 8192, y: 1 });
        
        this.addB3 = this.gpu.createKernel(function (a, b) {
            return a[this.thread.y][this.thread.x] + b[this.thread.y][this.thread.x];
        }).setOutput({ x: 8192, y: 1 });

        this.relu3 = this.gpu.createKernel(function (a) {
            if (a[this.thread.y][this.thread.x] < 0) return 0;
            else return a[this.thread.y][this.thread.x]
        }).setOutput({ x: 8192, y: 1 });
        
        this.multiplyW4 = this.gpu.createKernel(function (a, b) {
            let sum = 0;
            for (let i = 0; i < 8192; i++) {
                sum += a[this.thread.y][i] * b[i][this.thread.x];
            }
            return sum;
        }).setOutput({ x: 4096, y: 1 });
        
        this.addB4 = this.gpu.createKernel(function (a, b) {
            return a[this.thread.y][this.thread.x] + b[this.thread.y][this.thread.x];
        }).setOutput({ x: 4096, y: 1 });

        this.sigmoid4 = this.gpu.createKernel(function (a) {
            let e = Math.exp(a[this.thread.y][this.thread.x])
            return e / (e + 1)
        }).setOutput({ x: 4096, y: 1 });
    }

    encode(img) {
        img = reshapeMatrix(img, 1, 64 * 64);
        let hidden = this.multiplyW1(img, this.fc1w);
        hidden = this.addB1(hidden, this.fc1b);
        hidden = this.relu1(hidden);
        hidden = this.multiplyW21(hidden, this.fc21w);
        return this.addB21(hidden, this.fc21b);
    }

    decode(z) {
        let hidden = this.multiplyW3(z, this.fc3w);
        hidden = this.addB3(hidden, this.fc3b);
        hidden = this.relu3(hidden);
        hidden = this.multiplyW4(hidden, this.fc4w);
        hidden = this.addB4(hidden, this.fc4b);
        return reshapeMatrix(
            this.sigmoid4(hidden),
            64, 64
        );
    }

    loadFiles() {
        this.loaded = 0;
        this.currentFiles = this.files.splice(0, 100);
        this.currentFiles.forEach(function (file) {
            loadBytes(file.url, function (bytes) {
                let row = Number(file.url.split('-')[2]);
                this[file.dest][row] = FontVAE.floatArray(bytes.bytes);
                this.loaded++;
                this.totalLoaded++;
                this.percent = this.totalLoaded / this.total;
                if (this.loaded >= this.currentFiles.length) {
                    if (this.files.length <= 0) {
                        print('all done!');
                        this.fc21w = transposeMatrix(this.fc21w);
                        this.fc22w = transposeMatrix(this.fc22w);
                        this.fc4w = transposeMatrix(this.fc4w);
                    } else {
                        this.loadFiles();
                    }
                }
            }.bind(this), function () {
                print('error loading ' + file.url + ', restarting')
                this.files.push(file);
            }.bind(this));
        }.bind(this));

    }

    static floatArray(bytes) {
        let arr = [];
        for (var i = 0; i < bytes.length; i += 4) {
            arr.push(this.toFloat(bytes.slice(i, i + 4), false))
        }
        return arr;
    }

    static toFloat(bytes) {
        // Reference: https://stackoverflow.com/questions/42699162/javascript-convert-array-of-4-bytes-into-a-float-value-from-modbustcp-read
        var buf = new ArrayBuffer(4);
        var view = new DataView(buf);
        bytes.reverse().forEach(function (b, i) {
            view.setUint8(i, b);
        });
        return view.getFloat32(0);
    }

    draw () {
        preview.drawProgress(this.percent);
        if (this.files.length <= 0) {
            this.finished = true;
        }
    }

}