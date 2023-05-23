import React, { useState, useRef, useEffect } from 'react';

const Canvas = () => {
    const canvasRef = useRef(null);
    const [drawing, setDrawing] = useState(false);
    const [context, setContext] = useState(null);
    useEffect(() => {
        const canv = canvasRef.current
        const ctx = canv.getContext('2d')
        setContext(ctx);
    }, [])
    const handleMouseDown = (event) => {
        setDrawing(true);
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        console.log(rect);
        console.log(event)
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        context.beginPath();
        console.log(event.clientX, rect.left)
        context.moveTo(x/2, y/2);
        context.strokeStyle = 'red';
        context.lineWidth = 1;
    };

    const handleMouseMove = (event) => {
        if (!drawing) return;
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        context.lineTo(x/2, y/2);
        context.stroke();
    };
      
    const handleMouseUp = () => {
        setDrawing(false);
    }
      
    return(
        // <div id='canvas'>
            <div id='cont-canv' onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} 
                onMouseUp={handleMouseUp}>
                <canvas ref={canvasRef}/>
            </div>
        //  </div>
    )
}

// export default Canvas;

// const handleMouseDown = (eve) => {
//     setDrawing(true);
//     context.beginPath();
//     context.moveTo(eve.clientX, eve.clientY);
//     context.strokeStyle = 'red';
//     context.lineWidth = 1;
// }
// const handleMouseMove = (eve) => {
//     if(!drawing) return;
//     context.strokeStyle = 'red';
//     context.lineWidth = 1;
//     context.lineTo(eve.clientX, eve.clientY)
//     context.stroke();      
//     console.log('mooooo')
// }