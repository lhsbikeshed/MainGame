#pragma strict

var controlPoint : Transform;
var numberOfTargets : int;
var targetObject : Transform;
var destPoint : Transform;
var srcPoint : Transform;
var objectList : Transform[];

private var theShip : Transform;

function Start () {
	
	
	theShip = GameObject.Find("TheShip").transform;	
	
	objectList = new Transform[numberOfTargets];
		
	generateTrack();
	
}

function generateTrack(){
	var thisPoint : Vector3;
	if (destPoint == null){
		destPoint = GameObject.Find("TheShip").transform;
	}
	for (var i = 1; i < objectList.Length; i++){
		//work out where this should be
		thisPoint = Bezier2(srcPoint.position, controlPoint.position, destPoint.position, 0.001 + (1.0/numberOfTargets) * i);
		
	
		objectList[i] = Instantiate(targetObject,thisPoint, Quaternion.identity);
		
		for(var t : BlinkenFlareBehaviour in objectList[i].GetComponentsInChildren.<BlinkenFlareBehaviour>()){
			t.startDelay = 60;
			t.delay = i * (60 / objectList.Length);
		}
			
		
	}
	
	for (var b = 1; b < objectList.Length - 1; b++){
		objectList[b].LookAt(objectList[b+1].transform);
	}
	objectList[objectList.Length - 1].LookAt(destPoint);
	
	
	
	
}
function FixedUpdate () {


}

//shamelessly stolen from unity forums..
function Bezier2(Start : Vector3, Control : Vector3, End : Vector3 , t :float) : Vector3
{
    return (((1-t)*(1-t)) * Start) + (2 * t * (1 - t) * Control) + ((t * t) * End);
}