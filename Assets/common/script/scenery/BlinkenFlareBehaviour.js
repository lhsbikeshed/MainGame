#pragma strict

var delay : float = 75.0f;
var blinking : boolean = true;
var offset : float = 0.0f;
private var lastTime : float;
var startDelay : float = 75.0f;

var dying : boolean = false;
var deadTime : float = 0;

var target : Transform;

private var theShip : Transform;
private var mat : Material;
private var state: boolean  =false;


function Start () {
	
	theShip = GameObject.Find("TheShip").transform;
	
	mat = GetComponentInChildren(Renderer).material;
//	Debug.Log(mat);
	if(blinking == false){
		mat.color.a = 0.0;
	}
}

function flickerAndDie(){
	dying = true;
	deadTime = Time.fixedTime;
}

function Update () {
	if(blinking){
		
			
		
		if(target == null){
			transform.LookAt(theShip);
		} else {
			transform.LookAt(target);
		}
	} 
}

function FixedUpdate(){
	if(blinking){
		delay --;
		if(delay < 0){
			delay = startDelay;
			state = ! state;
		}
		
			
		if(state){	
			mat.color.a = 1;
		} else {
			mat.color.a = 0.0f;
		}
		
	}
	if(dying ){
		if( deadTime + 1.5f < Time.fixedTime){
			blinking = false;
			dying = false;
			mat.color.a = 0;
		} else {
			mat.color.a = Random.value;
		}
	}
}