let cv = document.getElementById("gameScreen");
let ctx = cv.getContext("2d");
let bbox = cv.getBoundingClientRect();
let offx;
let offy;

let SWIDTH = document.getElementById("gameScreen").offsetWidth;
let SHEIGHT = document.getElementById("gameScreen").offsetHeight;

const TO_DEG = 57.2957;

const CONSOLE_WIDTH =200; //control panel width for game controls
const MENU_CREDITS = -3;
const MENU_HELP = -2;
const MENU_MAIN =-1; //counters for different menus#const MENU_HELP -2
const MENU_GAME =0;
const MENU_END =1;
const MENU_CONT =2;

const GM_SETUP =0; //gamemode counters for game states
const GM_LAUNCH =1;
const GM_SIM =2;

const GM =490;

//game logic variables
let score = 0;
let victory = 0;

//menu counters to draw the approprate screens
let menu = MENU_MAIN;
let menuState = 0;
let gameWidth = SWIDTH - CONSOLE_WIDTH; //available size of game area
//(screen width - console width)

//counters to animate the landing
let landingCtr;
let landingDelta;

let titleCtr = 0;//used to animate the logo
let anim = 0;//state register to tell objects when to animate
let fpsCtr = 0; //counter to keep track of what frame the game is on
let simCtr = 0;//stores the length of the
//animated simulation between frame updates


//stars coordinates for background
let stars = new Array(100);

//game objects
let sun = {};
let earth = {};
let moon = {};
let mars = {};

let title = {};

let btnLeft = {};
let btnRight = {};
let btnVelPlus = {};
let btnVelMin = {};
let btnSim = {};
let btnGo = {};

const LOADABLE_OBJ = 7;
var loadedObj = 0;
	
	
let mX;
let mY;

let pBg = new Image();

let pSun = new Image();
let pEarth = new Image();
let pMoon = new Image();
let pMars = new Image();

let pDigits = new Image();
let pRocketStat = new Image();
let pRocketMov = new Image();
let pButtons = new Image();
let pScope = new Image(); 
let pPlate = new Image();

let xScale = (CONSOLE_WIDTH-40)/(gameWidth);
let yScale = (CONSOLE_WIDTH-40)/(SHEIGHT);
						

offx = bbox.left *(cv.width  / bbox.width);
offy = bbox.top * (cv.height / bbox.height);


function Animatable(img, frames, maxFrames, freq){

	this.img = img;
	this.frames = frames;
	this.freq = freq;
	this.fpsCtr = 0;
	this.currentFrame = 0;
	this.animScalar = 1;
	this.animate = 1;
	
	this.sx = 0;
	this.sw = this.img.width/maxFrames;
	this.sh = this.img.height;
	
	this.x = 0;
	this.y = 0;
	this.dw = this.sw;
	this.dh = this.sh;
	
	
	this.setPos = function(x,y){
		this.x = x;
		this.y = y;
	};

	this.setSize = function(width, height){
		this.dw = width;
		this.dh = height;
	};


	this.nextFrame = function(){
		if(this.fpsCtr >= this.freq){
			this.fpsCtr = 0;
			if(this.currentFrame >= this.frames-1){
				this.sx = 0;
				this.currentFrame = 0;
			}
			else{
				this.currentFrame++;
				this.sx = this.sw*this.currentFrame;
			}
		}
		else{
			this.fpsCtr++;
		}
	};
	
	this.setStaticFrame = function(frame){
		this.animate = 0;
		this.sx = this.sw*frame;
	};

	this.animateAtCorner = function(){
		ctx.drawImage(this.img,
			this.sx,0,this.sw,this.sh
			,this.x,this.y
			,this.dw*this.animScalar
			,this.dh*this.animScalar);
			
		if(this.animate == 1){
			this.nextFrame();
		}
	};
	
	this.animateAtMid = function(){
		ctx.drawImage(this.img,
			this.sx,0,this.sw,this.sh
			,this.x-((this.dw/2)*this.animScalar)
			,this.y-((this.dh/2)*this.animScalar)
			,this.dw*this.animScalar,this.dh*this.animScalar);
		
		if(this.animate == 1){
			this.nextFrame();
		}
	};
	
	this.animateAtMidRotate = function(ang){
		ctx.translate(this.x,this.y);
		ctx.rotate((Math.PI/2));
		ctx.rotate(-ang);
		ctx.translate(-this.x,-this.y);
		
		ctx.drawImage(this.img,
			this.sx,0,this.sw,this.sh
			,this.x-((this.dw/2)*this.animScalar)
			,this.y-((this.dh/2)*this.animScalar)
			,this.dw*this.animScalar,this.dh*this.animScalar);
		
		ctx.translate(this.x,this.y);
		ctx.rotate(-(Math.PI/2));
		ctx.rotate(ang);
		ctx.translate(-this.x,-this.y);
		
		if(this.animate == 1){
			this.nextFrame();
		}
		
	};
	


		
	this.isHitMid = function(mx,my){
		return (mx >= (this.x-this.dw/2) && mx <= (this.x+this.dw/2) 
				&& my >= (this.y-this.dw/2) && my <= (this.y+this.dw/2));
	};

	this.isHitCorner = function(mx,my){
		return (mx >= (this.x) && mx <= (this.x+this.dw) 
				&& my >= (this.y) && my <= (this.y+this.dw));
	};

}



function Planet(img,frames,maxFrames,freq) {
	Animatable.call(this,img,frames,maxFrames,freq);

	this.mag = 0;
	this.arg = 0;

	this.setMag = function(r){
		this.mag = r;
		this.setSize(r*2,r*2);
	};

	this.diam = function(){
		return (this.mag*2);
	};
	
}

Planet.prototype = Object.create(Animatable.prototype);

function Moon(planet){
	this.p = planet;
	this.p.arg = 0;
	this.moonF = 0;
	
	this.update = function(){
		this.p.animateAtMid();
		this.gravity();
	}

	
	this.gravity = function(){
		
		this.moonF = GM / Math.pow(rocket.moonDelta,2);
		this.p.arg = 0;
		//calculate the angle of the vector F

		this.p.arg = Math.atan2((this.p.y-rocket.newPos.y),(rocket.newPos.x-this.p.x));
		this.p.arg -= Math.PI;
		//console.log("f"+this.moonF,"a"+this.p.arg,"r"+roc.newPos.x,roc.newPos.y);
	}
}

let sim = {
	simPath:0,
	simCtr:0,
	inProg:0,
}

function Rocket(){
	this.oldPath = new Array(100).fill({x:0,y:0});
	this.oldPathCtr = 0;
	
	this.oldPos = {x:0,y:0};
	this.newPos = {x:0,y:0};
	this.mag = 0;
	this.arg = 0;
	this.statSprite;
	this.movSprite;
	this.state = 0;
	this.col = "nohit";
	
	this.moonDelta = 0;
	this.marsDelta = 0;

	this.landingAngleDelta = 0;
	this.landingAngle = 0;
	
	this.animCtr = 0;
	
	this.update = function(){
		
		this.getDelta();
		if(this.state == "pulling"){
			this.col = this.isCollision();
			score += 200;
			this.moveRocket(this.arg,this.mag,moon.p.arg,moon.moonF);
		}
		else if(this.state == "land1"){
			this.arg -= this.landingAngleDelta;
			this.animCtr -= 1;
			if(this.animCtr <= 0){
				this.state = "land2";
				this.animCtr = 40;
			}
		}
		else if(this.state == "land2"){
			this.moveRocket(this.arg,-0.25,0,0);
			this.animCtr -= 1;
			if(this.animCtr <= 0){
				this.state = "land3";
				this.animCtr = 20;
				
			}
		}
		else if(this.state == "land3"){
			this.animCtr -= 1;
			if(this.animCtr <= 0){
				this.state = "stop";
				victory = 1;
			}
		}
		else if(this.state == "moving"){
			this.col = this.isCollision();
			console.log(this.col ,this.state);
			this.moveRocket(this.arg,this.mag,0,0);
			
			if(this.movSprite.fpsCtr % 30 == 0){
				score += 100;
			}
		}
		
		this.draw();
	}
	
	this.simulate = function(){
		sim.simPath = new Array();
		this.state = "moving";
		let start = {};
		start.pos = Object.assign({},this.oldPos);
		start.mag = this.mag;
		start.arg = this.arg;

		while(this.state != "stop"){
			moon.gravity();
			this.getDelta();
			
			if(this.col == "offscreen"){
				this.state = "stop";
			}
			if(this.col == "mars"){
				this.state = "moving";
			}
			
			if(this.state == "pulling"){
				this.moveRocket(this.arg,this.mag,moon.p.arg,moon.moonF);
			}
			else if(this.state == "moving"){
				this.moveRocket(this.arg,this.mag,0,0);
			}
			
			this.col = this.isCollision();
			sim.simPath.push(Object.assign({},this.newPos));
		}
		victory = 0;
		this.col = "nohit";
		
		this.oldPos.x = this.newPos.x = start.pos.x;
		this.oldPos.y = this.newPos.y = start.pos.y;
		this.arg = start.arg;
		this.mag = start.mag;
		this.mag = start.mag;
	}
	

	this.isCollision = function(){
		
		if((this.oldPos.x <= 0 || this.oldPos.x >= gameWidth) ||
			(this.oldPos.y <= 0 || this.oldPos.y >= SHEIGHT) ){
			
			this.state = "stop";
			victory = -2;
			return "offscreen";
		}
		else if((this.moonDelta <= moon.p.mag*5) && 
				(this.moonDelta > moon.p.mag)){
			this.state = "pulling";
			return "inbound";	
		}
		else if(this.moonDelta <= moon.p.mag){
			this.state = "stop";
			victory = -1;
			return "moon";	
		}
		
		else if(this.marsDelta <= mars.mag*1.3){
			this.animCtr = 120;
			this.landingAngle = ((Math.atan2((this.oldPos.y-mars.y),(mars.x-this.oldPos.x)) - Math.PI));
			this.landingAngle = this.arg - this.landingAngle;
			this.landingAngleDelta = this.landingAngle / this.animCtr;
			this.state = "land1";
			return "mars";	
		}
		
		else{
			return "nohit";
		}
	}
	
	
	this.moveRocket = function(ra,rm,ga,gm){
		
		this.newPos.x = this.oldPos.x + ((Math.cos(ga)*gm)+(rm*Math.cos(ra)));
		this.newPos.y = this.oldPos.y - ((Math.sin(ga)*gm)+(rm*Math.sin(ra)));
		if(gm > 0){
			this.arg = Math.atan2(
			 (this.oldPos.y-this.newPos.y)
			,(this.newPos.x-this.oldPos.x) );
		}
		this.oldPos.x = this.newPos.x;
		this.oldPos.y = this.newPos.y;
		
	}

	this.draw = function(){
		if(this.movSprite == undefined || this.statSprite == undefined){
			return;
		}
		
		if(this.state == "moving" || this.state == "pulling"){
			this.oldPath.push(Object.assign({},this.oldPos));
			
			ctx.strokeStyle = "yellow";
			ctx.lineWidth = 3;
			ctx.beginPath();
			ctx.moveTo(this.oldPath[this.oldPath.length-1].x
						,this.oldPath[this.oldPath.length-1].y);
			
			let j = 0;
			if(this.oldPath.length > 100){
				j = this.oldPath.length-100;
			}
			for(let i = this.oldPath.length-2; i > j; i--){
				ctx.lineTo(this.oldPath[i].x,this.oldPath[i].y);
			}
			ctx.stroke();
		}
		
		this.statSprite.setPos(this.newPos.x,this.newPos.y);
		this.movSprite.setPos(this.newPos.x,this.newPos.y);
		//console.log(this.stat,this.mov);
		
		if(this.state == "stop" || this.state == "land3"){
			this.statSprite.animateAtMidRotate(this.arg);
		}
		else{
			
			this.movSprite.animateAtMidRotate(this.arg);
		}
		
		
	}
	
	this.getDelta = function(){
		this.moonDelta = Math.sqrt(Math.pow((moon.p.x-this.oldPos.x),2)
							+ Math.pow((moon.p.y-this.oldPos.y),2));
		this.marsDelta = Math.sqrt(Math.pow((mars.x-this.oldPos.x),2)
							+ Math.pow((mars.y-this.oldPos.y),2));
	}
	
	this.setPos = function(x,y){
		this.oldPos.x = x;
		this.oldPos.y = y;
		this.newPos.x = x;
		this.newPos.y = y;
		this.statSprite.setPos(x,y);
		this.movSprite.setPos(x,y);
		
		this.moonDelta = Math.sqrt(Math.pow((moon.p.x-this.oldPos.x),2)
							+ Math.pow((moon.p.y-this.oldPos.y),2));
		this.marsDelta = Math.sqrt(Math.pow((mars.x-this.oldPos.x),2)
							+ Math.pow((mars.y-this.oldPos.y),2));
	}
}
let rocket = new Rocket();




let border_gd = ctx.createLinearGradient(0, 0, SWIDTH, 0);
	border_gd.addColorStop("0", "magenta");
	border_gd.addColorStop("0.2" ,"blue");
	border_gd.addColorStop("0.5", "red");
	border_gd.addColorStop("0.8", "blue");
	border_gd.addColorStop("1.0" ,"magenta");
	
let text_gd = ctx.createLinearGradient(0, 0, SWIDTH, 0);
	text_gd.addColorStop("0", "yellow");
	text_gd.addColorStop("0.2" ,"orange");
	text_gd.addColorStop("0.5", "white");
	text_gd.addColorStop("0.8", "yellow");
	text_gd.addColorStop("1.0" ,"orange");

	
// ==== EVENT HANDLERS ==========
document.addEventListener('onresize',function(e){
	console.log("resized");
	bbox = cv.getBoundingClientRect();
});

cv.addEventListener('mousedown', function (e) {
	mX = e.clientX - offx;
	mY = e.clientY - offy;
	
	switch(menu){
		case MENU_MAIN:
			if(sun.isHitMid(mX,mY)){
				menu = MENU_GAME;
			}
			else if(earth.isHitMid(mX,mY)){
				menu = MENU_HELP;
			}
			else if(mars.isHitMid(mX,mY)){
				menu = MENU_CREDITS;
			}
			GenerateScreen(menu);
		break;
		
		case MENU_HELP:
			GenerateScreen(MENU_MAIN);
		break;
		
		case MENU_GAME:
			if(rocket.state != "stop"){
				break;
			}
			if(victory != 0){
				break;
			}
			//rocket.state = 0;
			if(btnGo.isHitCorner(mX,mY)){
				
				let pos = Object.assign({},rocket.oldPos);
				rocket.oldPath = new Array(100).fill(pos);
				rocket.state = "moving";
				
			}
			else if(btnSim.isHitCorner(mX,mY)){
				rocket.simulate();
				sim.simCtr = 2;
				sim.inProg = 1;
				score -= 10000;
				//console.log(sim.simPath);
			}
			else if(btnLeft.isHitCorner(mX,mY)){
				rocket.arg += (0.5*Math.PI)/180;
			}
			else if(btnRight.isHitCorner(mX,mY)){
				rocket.arg -= (0.5*Math.PI)/180;
			}
			else if(btnVelMin.isHitCorner(mX,mY)){
				rocket.mag -= 0.050001;
			}
			else if(btnVelPlus.isHitCorner(mX,mY)){
				rocket.mag += 0.050001;
			}
			score -= 50;
		break;
		
		
		case MENU_END:
			if(earth.isHitMid(mX,mY)){
				GenerateScreen(MENU_MAIN);
			}
			else if(moon.p.isHitMid(mX,mY)){
				GenerateScreen(MENU_GAME);
			}
		break;
	}
	
});

document.addEventListener('keypress',function(e){

	
	switch(menu){
		
		case MENU_HELP:
			if(e.key == "q"){
				GenerateScreen(MENU_MAIN);
			}
		break;
		
		case MENU_GAME:
			if(rocket.state != "stop"){
				break;
			}
			if(victory != 0){
				break;
			}
			//rocket.state = 0;
			if(e.key == 'a') {//left
				earth.arg += (5*Math.PI)/180;
				earth.positionRocket();
			}
			else if(e.key == 'd') {//right
				earth.arg -= (5*Math.PI)/180;
				earth.positionRocket();
			}
			else if(e.key == ' ') {//right
				
				let pos = Object.assign({},rocket.oldPos);
				rocket.oldPath = new Array(100).fill(pos);	
				rocket.state = "moving";
			}
			if(e.key == "q"){
				GenerateScreen(MENU_MAIN);
			}
			score -= 50;
		break;
		
		case MENU_END:
			if(e.key == "q"){
				GenerateScreen(MENU_MAIN);
			}
		break;
	
	}
});




//==================Graphics Processing===============

//generate background
function drawSpace(){
	//random scalar r to grow and shrink the stars slightly
    let r ;
	let s ;
	ctx.fillStyle = "#FFFFFF";
	
	//loop through the array of stars coordinates
	for(let i = 0; i < 100; i++){
		s = stars[i];
		r = Math.random() + 1;
		
		ctx.beginPath();
		ctx.arc( 
			s.x,
			s.y,
			r,
			0,
			2*Math.PI
		);
		
		ctx.fillStyle =
		"rgba("
		+((Math.random()*127)+127)+
		","+((Math.random()*127)+127)+
		","+((Math.random()*127)+127)+",255)";
		ctx.fill();
	}
	
}

function drawBorder(){

	ctx.strokeStyle = border_gd;
	ctx.lineWidth = 8;
	ctx.strokeRect(0,0,SWIDTH,SHEIGHT);
}


function drawScreen(){
	requestAnimationFrame(drawScreen);//redraw when new frame is delivered
	
	if(loadedObj >= LOADABLE_OBJ){
		ctx.fillStyle = "#000000";
		ctx.fillRect(0,0,SWIDTH,SHEIGHT);

		drawSpace();

		switch(menu){
			case MENU_MAIN:
				title.animateAtMid();
				sun.animateAtMid();
				earth.animateAtMid();
				moon.p.animateAtMid();
				mars.animateAtMid();
				
				ctx.font = "14px monospace";
				ctx.fillStyle = "#70e7ff";
				ctx.fillText("New game!",sun.x-35,sun.y+sun.mag+10);
				ctx.fillText("How to play?",earth.x-50,earth.y+earth.mag+10);
				ctx.fillText("Credits",mars.x-30,mars.y+mars.mag+10);

			break;
			
			case MENU_HELP:
				earth.animateAtMid();
				moon.p.animateAtMid();
				mars.animateAtMid();
				rocket.arg += (2*Math.PI)/120;
				rocket.moveRocket(rocket.arg,rocket.mag,0,0);
				rocket.draw();
				btnGo.animateAtCorner();
				btnSim.animateAtCorner();
				btnLeft.animateAtCorner();
				btnRight.animateAtCorner();
				ctx.drawImage(pScope,(SWIDTH/7)-50, 100, CONSOLE_WIDTH-100, CONSOLE_WIDTH-100);

				ctx.fillStyle = "#99ff66";
				ctx.font = '14px monospace';
				ctx.fillText("Home", earth.x-20, earth.y+earth.mag*1.1);
				ctx.fillText("Obstacle",moon.p.x-20,moon.p.y+moon.p.mag*1.2);
				ctx.fillText("Target",mars.x-20,mars.y+mars.mag*1.1);
				ctx.fillText("Medium",(SWIDTH/7)-30,CONSOLE_WIDTH+190);
				ctx.fillText("Simulator",(SWIDTH/7)-30,CONSOLE_WIDTH+20);
				ctx.fillText("Controls",(SWIDTH/7)-30,575);


				let textY = 100;
				ctx.fillStyle = "#00ff00";
				ctx.fillText("Aim: Send an 'explorer dog' onto Mars",(SWIDTH*2/7)+30,textY+=20);
				ctx.fillStyle = "#ffffff";             
				ctx.fillText("To complete a mission, reach Mars with a rocket",(SWIDTH*2/7)+30,textY+=20);
				ctx.fillText("launched from earth, either by your judgement skills",(SWIDTH*2/7)+30,textY+=20);
				ctx.fillText("or by using the simulator. (Shown on the left)",(SWIDTH*2/7)+30,textY+=20);
				ctx.fillText("Avoid the moon, or use it to your advantage!",(SWIDTH*2/7)+30,textY+=20);
                                                       
				ctx.fillStyle = "#00faff";              
				ctx.fillText("Controls: Velocity and Angle",(SWIDTH*2/7)+30,textY+=40);
				ctx.fillStyle = "#ffffff";                  
				ctx.fillText("Use Left and Right arrow keys to change the starting",(SWIDTH*2/7)+30,textY+=20);
				ctx.fillText("position on earth",(SWIDTH*2/7)+30,textY+=20);
				ctx.fillText("Use the buttons to adjust the angle at starting point",(SWIDTH*2/7)+30,textY+=20);
				ctx.fillText("and to adjust the speed at which the rocket will travel",(SWIDTH*2/7)+30,textY+=20);
                                                       
				ctx.fillStyle = "#f2ff00";              
				ctx.fillText("Score system: be smart",(SWIDTH*2/7)+30,textY+=40);
				ctx.fillStyle = "#ffffff";             
				ctx.fillText("You start out with 100,000 points. By landing on Mars",(SWIDTH*2/7)+30,textY+=20);
				ctx.fillText("you gain 25,000. You gain points for the time spent",(SWIDTH*2/7)+30,textY+=20);
				ctx.fillText("in space, and inside the moon's grav. field of effect.",(SWIDTH*2/7)+30,textY+=20);
				ctx.fillText("Make sure you are careful with what controls you use,",(SWIDTH*2/7)+30,textY+=20);
				ctx.fillText("as pressing any buttons takes away points,",(SWIDTH*2/7)+30,textY+=20);
				ctx.fillText("using the simulator takes away 10,000 points.",(SWIDTH*2/7)+30,textY+=20);
				ctx.fillStyle = "#d000ff";             
				ctx.fillText("Be wise and plan out your moves carefully!",(SWIDTH*2/7)+31,textY+=20);
				ctx.fillStyle = "#ff0000";             
				ctx.fillText("Be wise and plan out your moves carefully!",(SWIDTH*2/7)+30,textY-=1,);
				ctx.fillStyle = "#ffffff";             
				ctx.fillText("Click the left mouse button / press q to send a dog on its way to a new home :)",(SWIDTH*2/7)-60,textY+=60);


				ctx.lineWidth = 1;
				ctx.strokeStyle = "#FFFFFF";
				ctx.beginPath();
				ctx.arc(moon.p.x,moon.p.y,
						moon.p.mag*0.7,0,2*Math.PI);
				ctx.stroke();
			break;
			
			case MENU_GAME:
				
				if(victory == 0){
					sun.animateAtMid();
					earth.animateAtMid();
					mars.animateAtMid();
					moon.update();
					rocket.update();
					
					ctx.lineWidth = 1;
					ctx.strokeStyle = "#FFFFFF";
					ctx.beginPath();
					ctx.arc(moon.p.x,moon.p.y,
							moon.p.mag*5,0,2*Math.PI);
					ctx.stroke();	
					
					ctx.drawImage(pPlate,
					gameWidth,0,CONSOLE_WIDTH,SHEIGHT);
				
					ctx.drawImage(pScope,
						gameWidth+15,15,CONSOLE_WIDTH-30,CONSOLE_WIDTH -30);
				
					btnGo.animateAtCorner();
					btnSim.animateAtCorner();
					btnLeft.animateAtCorner();
					btnRight.animateAtCorner();
					btnVelMin.animateAtCorner();
					btnVelPlus.animateAtCorner();
					
					drawDisplay((rocket.arg*TO_DEG), btnLeft.x-(btnGo.dh*0.2), (btnLeft.y+btnLeft.dh+40));
					drawDisplay((rocket.mag*100), btnLeft.x-(btnGo.dh*0.2), (btnLeft.y+btnLeft.dh+95));
					drawDisplay((rocket.marsDelta*10)-500, btnLeft.x-(btnGo.dh*0.2), (SHEIGHT-95));
					drawDisplay((rocket.moonDelta*10)-226, btnLeft.x-(btnGo.dh*0.2), (SHEIGHT-40));
					
					ctx.fillStyle = "yellow";
					ctx.font = '14px monospace';
					ctx.fillText("score:"+score,15,15);
					ctx.fillStyle = "lightgreen";
					ctx.fillText("Launch!",btnGo.x+15,btnGo.y+btnGo.dw+10);
					ctx.fillText("Simulate",btnSim.x+5,btnSim.y+btnSim.dw+10);
					ctx.fillText("- Tilt ",btnLeft.x+5,btnLeft.y+btnLeft.dw+10);
					ctx.fillText("+ Tilt",btnRight.x+5,btnRight.y+btnRight.dw+10);
					ctx.fillText("Angle (deg):",btnLeft.x,btnLeft.y+btnLeft.dw+35);
					ctx.fillText("Velocity (k/h):",btnLeft.x,btnLeft.y+btnLeft.dw+90);

					ctx.fillText("Target Delta (km):",btnLeft.x,(SHEIGHT-100));
					ctx.fillText("Moon Delta (km):",btnLeft.x,(SHEIGHT-45));
					
					ctx.fontWeight = "normal";
					
					
					if(sim.inProg == 1){
						ctx.strokeStyle = "lightgreen";
						ctx.lineWidth = 2;
						let x = ((sim.simPath[0].x*xScale)+(gameWidth+20));
                        let y = ((sim.simPath[0].y*yScale)+20);
						
						console.log(x,y);
						
						ctx.beginPath();
						ctx.moveTo(x,y);
						
						for(let i = 1; i <= sim.simCtr; i+=2){
							x = ((sim.simPath[i].x*xScale)+(gameWidth+20)),
                            y = ((sim.simPath[i].y*yScale)+20),
							
							ctx.lineTo(x,y);
						}
						ctx.stroke();
						
						sim.simCtr+=2;
						if(sim.simCtr >= sim.simPath.length-1){
							sim.inProg = 0;
						}
						
						//console.log(sim.simCtr);
					}
				}
				else if(victory != 0){
					sun.animScalar -= 0.01;
					earth.animScalar -= 0.01;
					mars.animScalar -= 0.01;
					moon.p.animScalar -=0.01;
					rocket.statSprite.animScalar -= 0.01;
					
					sun.animateAtMid();
					earth.animateAtMid();
					mars.animateAtMid();
					rocket.draw();
					moon.update();
					
					
					if(sun.animScalar < 0.01){
						rocket.statSprite.animScalar = 1;
						GenerateScreen(MENU_END);
					}
					
					ctx.font = "14px monospace";
					ctx.fillStyle = "lightgreen";
					
					if(victory == 1){
						score += 500;
						ctx.fillText("Mission Successful!",(SWIDTH/2)-100,SHEIGHT/2);
					}
					else if(victory == -1){
						score = 0;
						ctx.fillText("Houston, we've got a problem!",(SWIDTH/2)-125,SHEIGHT/2);
					}
					else if(victory == -2){
						score = 0;
						ctx.fillText("Signal lost: out of reach!",(SWIDTH/2)-125,SHEIGHT/2);
					}
				}
				
			break;
			
			case MENU_END:
				
				earth.animateAtMid();
				moon.update();
				
				
				ctx.fillStyle = "yellow";
				ctx.fillText("Final Score: "+score,-60+SWIDTH/2,15);
				ctx.fillText("Send out another dog?",(SWIDTH/2)-70,(SHEIGHT/2));
				ctx.fillStyle = "#ff23ff";
				ctx.fillText("<--  Go home",(SWIDTH/2)-55,(SHEIGHT/2)-30);
				ctx.fillText("Go fetch -->",(SWIDTH/2)-20,(SHEIGHT/2)+30);
				if(earth.animScalar < 1){
					earth.animScalar += 0.02;
					moon.p.animScalar +=0.02;
				}
			break;
		}
	}
		drawBorder();
}


function drawDisplay(toDraw, dx, dy){
	//console.log(toDraw);
	let sx = 0; //source x position in image, used to select tile
	let ptr = 0; //counter for character array
	let mantissa = 0; //number after decimal point
    let dpIndex = 0; //points to where the decimal point is
	let temp = 0;
	let num = new Array(5);//number before decimal point
	
	toDraw = toDraw * 1.0;
	temp = toDraw.toString();

	dpIndex = temp.indexOf(".");
	if(dpIndex == -1){
		dpIndex = temp.length; 
		mantissa = 0
	}else{
		mantissa = parseInt(temp[dpIndex+1]); //find out what the 1dp number is
	}
	
    for(let i = 0; i < 5; i++){ //shift the number before the dp to the right of the array
        num[i+(5-dpIndex)] = temp[i]; // since the number is written from right to left and can grow
    }

    //draw negative sign if negative number
    if(toDraw < 0){
        ctx.drawImage(
			pDigits,
			0,0,22,37,
			(dx),dy,
			22,37);
    }
    else{
        ctx.drawImage(
			pDigits,
			22,0,22,37,
			(dx),dy,
			22,37);
    }
    dx += 22;

	//draw digits infront of decimal point
	for(let i = 0; i < 5; i++){

        sx = parseInt(num[i]); //convert ascii to digit
        if(isNaN(sx)){ sx = 22;}
        else{sx = (sx*22)+44;} //number + offset of 22px * tile number

		ctx.drawImage(
			pDigits,
			sx,0,22,37,
			(dx + ptr),dy,
			22,37);

        ptr += 22;

	}

	//draw decimal point
	ctx.drawImage(
			pDigits,
			264,0,22,37,
			(dx + ptr),dy,
			22,37);
	ptr += 10;


	//draw last digit
	sx = mantissa; //convert ascii to digit
	sx = (sx*22)+44; //number + offset of 22px * tile number

	ctx.drawImage(
		pDigits,
		sx,0,22,37,
		(dx + ptr),dy,
		22,37);
	
	//console.log({temp,num,mantissa});
}


//==========INIT FUNCTIONS==================

function InitObj(){

	pBg.onload = function(){
		title = new Animatable(pBg,5,5,30);
		title.setPos(SWIDTH/2,SHEIGHT/4);
		loadedObj++;
		if(loadedObj >= LOADABLE_OBJ){
			GenerateScreen(MENU_MAIN);
		}
	}
	pBg.src = "images/title.png";
	
	
	pSun.onload = function(){
		sun = new Planet(pSun,1,1,60);
		loadedObj++;
		if(loadedObj >= LOADABLE_OBJ){
			GenerateScreen(MENU_MAIN);
		}
	}
	pSun.src = "images/sun.png";
	
	pEarth.onload = function(){
		earth = new Planet(pEarth,1,1,60);
		loadedObj++;
		if(loadedObj >= LOADABLE_OBJ){
			GenerateScreen(MENU_MAIN);
		}
	}
	pEarth.src = "images/earth.png";

	pMoon.onload = function(){
		moon = new Moon(new Planet(pMoon,1,1,60));
		loadedObj++;
		if(loadedObj >= LOADABLE_OBJ){
			GenerateScreen();
		}
	}
	pMoon.src = "images/moon.png";

	pMars.onload = function(){
		mars = new Planet(pMars,1,1,60);
		loadedObj++;
		if(loadedObj >= LOADABLE_OBJ){
			GenerateScreen(MENU_MAIN);
		}
	}
	pMars.src = "images/mars.png";
	
	pRocketStat.onload = function(){
		rocket.statSprite = new Animatable(pRocketStat,1,1,30);
		loadedObj++;
		if(loadedObj >= LOADABLE_OBJ){
			GenerateScreen();
		}
	}
	pRocketStat.src = "images/rocket.png";
	
	pRocketMov.onload = function(){
		rocket.movSprite = new Animatable(pRocketMov,4,4,8);
		loadedObj++;
		if(loadedObj >= LOADABLE_OBJ){
			GenerateScreen(MENU_MAIN);
		}
	}
	pRocketMov.src = "images/rocket_moving.png";
	
	pPlate.onload = function(){
		loadedObj++;
		if(loadedObj >= LOADABLE_OBJ){
			GenerateScreen(MENU_MAIN);
		}
	}
	pPlate.src = "images/metal.jpg";
	
	pScope.onload = function(){
		loadedObj++;
		if(loadedObj >= LOADABLE_OBJ){
			GenerateScreen();
		}
	}
	pScope.src = "images/scope.png";
	
	pDigits.onload = function(){
		loadedObj++;
		if(loadedObj >= LOADABLE_OBJ){
			GenerateScreen(MENU_MAIN);
		}
	}
	pDigits.src = "images/digits.png";
	
	pButtons.onload = function(){
		btnLeft = new Animatable(pButtons,1,4,60);
		btnLeft.setStaticFrame(2);
		
		btnRight = new Animatable(pButtons,1,4,60);
		btnRight.setStaticFrame(3);
		
		btnVelPlus = new Animatable(pButtons,1,4,60);
		btnVelPlus.setStaticFrame(3);
		
		btnVelMin = new Animatable(pButtons,1,4,60);
		btnVelMin.setStaticFrame(2);
		
		btnGo = new Animatable(pButtons,1,4,60);
		btnGo.setStaticFrame(0);
		
		btnSim = new Animatable(pButtons,1,4,60);
		btnSim.setStaticFrame(1);

		loadedObj++;
		if(loadedObj >= LOADABLE_OBJ){
			GenerateScreen(MENU_MAIN);
		}
	}
	pButtons.src = "images/buttons.png";
}

function InitMenu(){
	
	sun.setPos((SWIDTH/2),(SHEIGHT/2));
	sun.setMag(60);
	sun.animScalar = 1;
	
    moon.p.setPos((SWIDTH/3) - 75,(SHEIGHT*2/3) + 75);
    moon.p.setMag(15);
	moon.p.animScalar = 1;
	
    earth.setPos((SWIDTH/3),(SHEIGHT*2/3));
    earth.setMag(50);
	earth.animScalar = 1;

    mars.setPos((SWIDTH*2/3),(SHEIGHT*2/3));
    mars.setMag(60);
	mars.animScalar = 1;
	
}


function InitHelp(){
	//reset animation scalars so animation can happen

    earth.setPos((SWIDTH*6/7),(SHEIGHT/4));
    earth.mag = 60;
	earth.animScalar = 1;

    moon.p.setPos((SWIDTH*6/7),(SHEIGHT/2));
    moon.p.mag = 60;
	moon.p.animScalar = 1;

    mars.setPos((SWIDTH*6/7),(SHEIGHT*3/4));
    mars.mag = 60;
	mars.animScalar = 1;

	rocket.state = "moving";
    rocket.setPos((SWIDTH/7),(SHEIGHT/2));
    rocket.arg = 0;
    rocket.mag = 1.5;
	rocket.animScalar = 1;
	rocket.oldPath = new Array();
	rocket.oldPath.push(rocket.oldPos);
	
	btnGo.setPos((SWIDTH/7)-100,500);
	btnSim.setPos((SWIDTH/7)-50,500);
	btnLeft.setPos((SWIDTH/7),500);
	btnRight.setPos((SWIDTH/7)+50,500);
	btnGo.setSize(50,50);
	btnSim.setSize(50,50);
	btnLeft.setSize(50,50);
	btnRight.setSize(50,50);
}



function InitSpace(){

	//generate stars
    for(let i = 0; i < 100; i++){
        stars[i] = {x:Math.random()*SWIDTH, y:Math.random()*SHEIGHT}
    }
	
}

function InitGame(){
	victory = 0;
	score = 100000;
	
	earth.setPos((gameWidth*1/6),(SHEIGHT*5/6));
    earth.setMag(55);
	earth.animScalar = 1;
	earth.positionRocket = function(){
		 rocket.arg = earth.arg;
		rocket.setPos(
		(earth.x+(Math.cos(earth.arg)*earth.mag))
		,(earth.y-(Math.sin(earth.arg)*earth.mag)));
	}

    moon.p.setPos( randH((gameWidth/5),(gameWidth*3/5))
		,randH((SHEIGHT/4),(SHEIGHT/2)) );
    moon.p.setMag(25);
	moon.p.animScalar = 1;

    mars.setPos( randH((gameWidth*4/6),(gameWidth*5/6))
		,randH((SHEIGHT/6),(SHEIGHT*2/6)) );
    mars.setMag(50);
	mars.animScalar = 1;

    sun.setPos((gameWidth/8),(SHEIGHT/8));
    sun.setMag(75);
	sun.animScalar = 1;

	//set the rocket on earth and reset all parameters
    rocket.state = "stop";
	rocket.mag = 2.5;
	rocket.animScalar = 1;
	rocket.oldPath = new Array(100);
	sim.simPath = new Array();
	earth.positionRocket();

	let hit = btnGo.sh;
	
	btnGo.x = gameWidth +12;
	btnGo.y = CONSOLE_WIDTH+5;
	btnGo.setSize(hit,hit);

	btnSim.x = btnGo.x + hit + 20;
	btnSim.y = CONSOLE_WIDTH+5;
	btnGo.setSize(hit,hit);

	hit = hit*0.75;

	btnLeft.x = btnGo.x+ btnGo.dw*0.2;
	btnLeft.y = btnGo.y + btnGo.dw + 30;
	btnLeft.setSize(hit,hit);

    btnRight.x = btnSim.x;
	btnRight.y = btnLeft.y;
	btnRight.setSize(hit,hit);

    btnVelMin.x = btnLeft.x;
	btnVelMin.y = btnLeft.y + btnLeft.dw + 135;
	btnVelMin.setSize(hit,hit);

    btnVelPlus.x = btnRight.x;
	btnVelPlus.y = btnVelMin.y;
	btnVelPlus.setSize(hit,hit);
}

function InitEnd(){
	
	moon.p.setPos((SWIDTH/2) + 170, SHEIGHT/2);
    earth.setPos((SWIDTH/2) - 200, SHEIGHT/2);
	
	moon.p.setMag(moon.p.mag*2);
	earth.setMag(earth.mag*2);
	

}

function randH(low,high){
		return ( (Math.random()*(high-low))+low );
}

function GenerateScreen(screen){
	switch(screen){
		case MENU_MAIN:
			InitMenu();
		break;
		
		case MENU_HELP:
			InitHelp();
		break;
		
		case MENU_GAME:
			InitGame();
		break;
		
		case MENU_END:
			InitEnd();
		break;
	}
	menu = screen;
}


// =========== MAIN ===============


InitObj();
InitSpace();
//enter animation loop
drawScreen();




