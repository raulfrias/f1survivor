const { createCanvas } = require('canvas');
const fs = require('fs');

// Create a 200x200 canvas
const canvas = createCanvas(200, 200);
const ctx = canvas.getContext('2d');

// Fill background
ctx.fillStyle = '#555555';
ctx.fillRect(0, 0, 200, 200);

// Draw circle for driver silhouette
ctx.fillStyle = '#333333';
ctx.beginPath();
ctx.arc(100, 80, 40, 0, Math.PI * 2);
ctx.fill();

// Draw body silhouette
ctx.fillStyle = '#333333';
ctx.beginPath();
ctx.ellipse(100, 160, 30, 50, 0, 0, Math.PI * 2);
ctx.fill();

// Add text
ctx.fillStyle = '#FFFFFF';
ctx.font = '16px sans-serif';
ctx.textAlign = 'center';
ctx.fillText('Driver', 100, 180);

// Save the image
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync('assets/images/drivers/default.png', buffer); 