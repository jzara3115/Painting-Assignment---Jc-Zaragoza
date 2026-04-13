class Triangle {
    constructor(){
        this.type='triangle';
        this.position = [0, 0, 0];
        this.color = [1, 1, 1, 1];
        this.size = 10;
    }

    render() {
        var xy = this.position;
        var rgba = this.color;
        var size = this.size;

        // Pass the color of a point to u_FragColor variable
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

        gl.uniform1f(u_Size, size);

        // Draw
        var d = this.size / 200;
        drawTriangle([xy[0], xy[1], xy[0]+.1, xy[1], xy[0], xy[1]+.1]);
    }
}


function drawTriangle(vertices) {
    var n = 3;

    var vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
      console.log('Failed to create the buffer object');
      return -1;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);

    // var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    // if (a_Position < 0) {    
    //   console.log('Failed to get the storage location of a_Position');
    //   return -1;
    // }

    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);

    gl.enableVertexAttribArray(a_Position);

    gl.drawArrays(gl.TRIANGLES, 0, n);
}
