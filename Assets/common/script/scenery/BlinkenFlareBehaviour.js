#pragma strict

var delay : float = 75.0f;
var blinking : boolean = true;
var offset : float = 0.0f;
private var lastTime : float;
var startDelay : float = 75.0f;

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

function Update () {
	if(blinking){
		
			
		
		transform.LookAt(theShip);
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
}