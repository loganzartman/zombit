//viewport settings
var viewWidth = 600;
var viewHeight = 400;
var viewX = 0;
var viewY = 0;

//output settings
var screenWidth = 1200;
var screenHeight = 800;

//advanced shader data
var od,out;

function render() {
  //clear screen
  ctx.fillStyle = "black";
  ctx.fillRect(0,0,viewWidth,viewHeight);

  ctx.font = '12px "uni"';

  //render the tiles
  drawgameLevel();

  //render the entities
  for (var ec = 0; ec<entities.length; ec++) {
    ent = entities[ec];
    if (ent instanceof Entity) {
      if (ent.x>viewX && ent.x<viewX+viewWidth && ent.y>viewY && ent.y<viewY+viewHeight) {
        ent.render(ent.x-viewX,ent.y-viewY);
      }
    }
  }

  //draw gui

  //draw inventory item gui
  ctx.fillStyle = "rgba(234,240,90,0.3)";
  ctx.strokeStyle = "rgba(244,250,60,0.6)";
  ctx.fillRect(viewWidth-90,4,80,25);
  ctx.strokeRect(viewWidth-90,4,80,25);

  ctx.fillStyle = "rgba(255,255,255,1)";
  var ii = player.inv.getSelected();
  ctx.font = '9px "uni"';
  ctx.fillText(ii.name,viewWidth-80,13);

  ctx.font = '12px "uni"';
  if (ii instanceof Gun) {
    ctx.fillStyle=ii.ammo!=0 && ii.ammo!="R"?"white":"red";
    ctx.fillText("A: "+ii.ammo,viewWidth-80,25);
  }

  //draw overlay
  ctx.drawImage(imgOverlay,0,0,viewWidth,viewHeight);

  //apply shaders
  //shader(srand);
  if (enableShaders==true) {xshader(xsfx);}

  //draw fps
  ctx.fillStyle = "black";
  ctx.fillRect(2,10,60,14);
  ctx.fillStyle = "white";
  ctx.fillText("FPS: "+(~~fps),4,20);

  //draw mouse
  ctx.drawImage(imgCursor,mouseX-imgCursor.width/2,mouseY-imgCursor.height/2);
  
	//copy buffer to screen at proper scale
	sctx.drawImage(buffer,0,0,screenWidth,screenHeight);
}

// draw an animated image onto the canvas
// TODO: COMPLETE THIS!
function drawAnimatedImage(imgid, x, y, numFrames, frameSize) {
  var index = 0, xpos = 0, ypos = 0;
  setInterval(function() {
    // draw the image on the canvas in the desired position
    ctx.drawImage(animateImage(imgid),xpos,ypos,frameSize,frameSize,x,y,frameSize,frameSize);
    xpos += frameSize;
    index += 1;
    if(index >= numFrames) {
      xpos = 0;
      ypos = 0;
      index = 0;
    }  else if(xpos + frameSize > w) {
      xpos = 0;
      ypos += frameSize;
    }
  }, 1000/24);
}
// ---------

function drawgameLevel() {
  var w = gameLevel.getWidth();
  var h = gameLevel.getHeight();

  //loop through portion of gameLevel within view
  for (var x=~~(viewX/tileWidth); x<~~((viewX+viewWidth)/tileWidth)+1; x++) {
    for (var y=~~(viewY/tileHeight); y<~~((viewY+viewHeight)/tileHeight)+1; y++) {
      var sx = x*tileWidth-viewX; //pixel x
      var sy = y*tileHeight-viewY; //pixel y

      var tile = gameLevel.getTile(x,y); //get the tile at this position

      if (tile!=null) {
        var tid = tile.id;
        if (tid!=null) {ctx.drawImage(tileImage(tid), sx, sy);}
        //"color code" for tile.  temporary use until tile sprites added
        //var cc = ~~((255/4)*tile.id);
        //ctx.fillStyle = "rgb("+cc+","+cc+","+cc+")";
        //ctx.fillRect(sx,sy,tileWidth,tileHeight);
        //ctx.strokeStyle = "black";
        //ctx.strokeRect(sx,sy,tileWidth,tileHeight);
      }
    }
  }
}

//shader function, pass function(data,xPixel,yPixel,RedVal,BlueVal,GreenVal) that returns [r,g,b]
function shader(func) {
  var id = ctx.getImageData(0,0,viewWidth,viewHeight);
  var dat = id.data;

  //var d2 = dat.clone();
  for (var x=1; x<viewWidth-1; x++) {
    for (var y=1; y<viewHeight-1; y++) {
      var cr = dat[ri(x,y)];
      var cg = dat[gi(x,y)];
      var cb = dat[bi(x,y)];
      var result = func(dat,x,y,cr,cg,cb);

      dat[ri(x,y)]=result[0];
      dat[gi(x,y)]=result[1];
      dat[bi(x,y)]=result[2];
    }
  }
  ctx.putImageData(id,0,0);
}

function xshader(func) {
  var id = ctx.getImageData(0,0,viewWidth,viewHeight);
  var dat = id.data;

  //var d2 = dat.clone();
  for (var x=1; x<viewWidth-1; x++) {
    for (var y=1; y<viewHeight-1; y++) {
      var cr = dat[ri(x,y)];
      var cg = dat[gi(x,y)];
      var cb = dat[bi(x,y)];
      var result = func(dat,x,y,cr,cg,cb);

      dout[ri(x,y)]=result[0];
      dout[gi(x,y)]=result[1];
      dout[bi(x,y)]=result[2];
    }
  }
  ctx.putImageData(oid,0,0);
}

//color indexes
function ri(x,y) {return ((x)+(y)*viewWidth)*4+0;}
function gi(x,y) {return ((x)+(y)*viewWidth)*4+1;}
function bi(x,y) {return ((x)+(y)*viewWidth)*4+2;}
function ai(x,y) {return ((x)+(y)*viewWidth)*4+3;}
//function ri(x,y) {return ((x<0?0:x>viewWidth?viewWidth:x)+(y<0?0:y>viewHeight?viewHeight:y)*viewWidth)*4+0;}
//function gi(x,y) {return ((x<0?0:x>viewWidth?viewWidth:x)+(y<0?0:y>viewHeight?viewHeight:y)*viewWidth)*4+1;}
//function bi(x,y) {return ((x<0?0:x>viewWidth?viewWidth:x)+(y<0?0:y>viewHeight?viewHeight:y)*viewWidth)*4+2;}
//function ai(x,y) {return ((x<0?0:x>viewWidth?viewWidth:x)+(y<0?0:y>viewHeight?viewHeight:y)*viewWidth)*4+3;}

function sthresh(d,x,y,r,g,b) { //threshold
  var res = [0,0,0];
  res[0] = r>127?255:0;
  res[1] = g>127?255:0;
  res[2] = b>127?255:0;
  return res;
}

function srand(d,x,y,r,g,b) { //noise
  var res = [0,0,0];
  var ra = frand()*255;
  res[0] = ra;
  res[1] = ra;
  res[2] = ra;
  return res;
}

function sfx(d,x,y,r,g,b) { //red channel blur + threshold
  var res = [0,0,0];
  var dm = 0.8+frand()*0.2*((0.8*Math.abs((viewHeight*0.5)-y)/(viewHeight*0.5))+0.2);
  res[0] = colLevel(r,20,237)*dm;
  res[1] = colLevel(g,38,202)*dm;
  res[2] = colLevel(b,9,240)*dm;
  return res;
}

function xsfx(d,x,y,r,g,b) { //red channel blur + threshold
  var res = [0,0,0];
  var dm = 0.8+frand()*0.2*((0.8*Math.abs((viewHeight*0.5)-y)/(viewHeight*0.5))+0.2);
  res[0] = colLevel(r,13,202)*dm;
  res[1] = colLevel(g,5,232)*dm;
  res[2] = colLevel(b,10,200)*dm;
  return res;
}

function colLevel(col,min,max) {
  return (col/255)*max+min;
}

function sblur(d,x,y,r,g,b) { //red channel blur + threshold
  var res = [0,0,0];
  res[0] = (d[ri(x-1,y)]+d[ri(x+1,y)])/2;
  res[1] = g;
  res[2] = (d[bi(x+2,y)]+d[bi(x,y)])/2;
  return res;
}

function strokeEllipse(ctx, x, y, w, h) {
  var kappa = .5522848,
      ox = (w / 2) * kappa, // control point offset horizontal
      oy = (h / 2) * kappa, // control point offset vertical
      xe = x + w,           // x-end
      ye = y + h,           // y-end
      xm = x + w / 2,       // x-middle
      ym = y + h / 2;       // y-middle

  ctx.beginPath();
  ctx.moveTo(x, ym);
  ctx.bezierCurveTo(x, ym - oy, xm - ox, y, xm, y);
  ctx.bezierCurveTo(xm + ox, y, xe, ym - oy, xe, ym);
  ctx.bezierCurveTo(xe, ym + oy, xm + ox, ye, xm, ye);
  ctx.bezierCurveTo(xm - ox, ye, x, ym + oy, x, ym);
  ctx.closePath();
  ctx.stroke();
}