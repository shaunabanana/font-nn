class NetworkLoader {
    constructor() {
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

        for (var i = 0; i < 8192; i++) {
            this.files.push({
                dest: 'fc1w',
                url: this.encoderAddress + 'model-fc1w-' + i + '-4096.bin'
            });
            
            this.files.push({
                dest: 'fc3w',
                url: this.decoderAddress + 'model-fc3w-' + i + '-126.bin'
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

        
        for (var k = 0; k < 4096; k++) {
            this.files.push({
                dest: 'fc4w',
                url: this.decoderAddress + 'model-fc4w-' + k + '-8192.bin'
            });
        }
        

        this.total = this.files.length;
        this.totalLoaded = 0;
    }

    loadFiles() {
        this.loaded = 0;
        this.currentFiles = this.files.splice(0, 100);
        this.currentFiles.forEach(function (file) {
            loadBytes(file.url, function (bytes) {
                this[file.dest].push(NetworkLoader.floatArray(bytes.bytes));
                this.loaded++;
                this.totalLoaded++;
                this.percent = this.totalLoaded / this.total;
                if (this.loaded >= this.currentFiles.length) {
                    if (this.files.length <= 0) {
                        print('all done!');
                        this.finished = true;
                    } else {
                        this.loadFiles();
                    }
                }
            }.bind(this), function () {
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
        fill(200);
        rect(100, 100, 300, 15);
        fill(250, 230, 100);
        rect(100, 100, 300 * this.percent, 15);
    }
}