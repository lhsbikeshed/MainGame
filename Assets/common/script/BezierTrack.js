#pragma strict

var startPos : Vector3;
var controlPos : Vector3;
var endPos : Vector3;

var divisions : float;

var mover : Transform;
var moveTime : float = 0.0f;

var running : boolean = false;

function Start () {

	mover = transform.Find("mover");
	mover.position = startPos;
}

function FixedUpdate () {
	if(running){
		moveTime += 0.001f;
		mover.position = Bezier(startPos, controlPos, endPos, moveTime);
	}

}

function OnDrawGizmosSelected(){
	//start
	Gizmos.color = Color(0,1,0);
	Gizmos.DrawSphere(startPos, 5);
	//control
	Gizmos.color = Color(1,1,0);
	Gizmos.DrawSphere(controlPos, 5);
	//end
	
	Gizmos.color = Color(1,0,0);
	Gizmos.DrawSphere(endPos, 5);
	
	var acc : float = 0;
	var step : float =  1.0f / divisions;
	var prevPos : Vector3 = startPos;
	for(var i = 0; i < divisions; i++){
		var pos : Vector3 = Bezier(startPos, controlPos, endPos, acc);
		
		Gizmos.color = Color(1,1,0);
		Gizmos.DrawLine(prevPos, pos);
		prevPos = pos;
		acc += step;
	}
	Gizmos.color = Color(1,1,0);
	Gizmos.DrawLine(prevPos, endPos);
	
	
}


//shamelessly stolen from unity forums..
function Bezier(Start : Vector3, Control : Vector3, End : Vector3 , t :float) : Vector3
{
    return (((1-t)*(1-t)) * Start) + (2 * t * (1 - t) * Control) + ((t * t) * End);
}

