#pragma strict

import System.Collections.Generic;

var controlPoints : List.<Vector3>;
var detailCpList : List.<Vector3>;

var divisions : float;

var mover : Transform;
var moveTime : float = 0.0f;

var running : boolean = false;
var startIndex : float = 0;
var moveSpeed : float = 1f;


private var lastUp : Vector3;

function Start () {

	mover = transform.Find("mover");
//	mover.position = startPos;
	controlPoints = generateDetailList();
}

function FixedUpdate () {
	if(running){
		
		moveTime += moveSpeed / 100f;
		// work out which section of 3 points the movetime is currently in
		//0-1 > 0,1,2,3
		//1-2 > 3,4,5,6
		//2-3 > 6,7,8,9
		//3-4 > 9,10,11,12
		//4-5 > 12,13,14,15
		startIndex = Mathf.FloorToInt(moveTime) * 3;
		if(startIndex + 3 > controlPoints.Count){
			moveTime = 0;
		} else {
		var moveTimeTrimmed : float = moveTime % 1.0f;;
			mover.position = Bezier(controlPoints[startIndex], controlPoints[startIndex + 1], controlPoints[startIndex + 2],  controlPoints[startIndex + 3], moveTimeTrimmed);
			var targetRot : Quaternion = Quaternion.LookRotation(curveTangent(controlPoints[startIndex], controlPoints[startIndex + 1], controlPoints[startIndex + 2],  controlPoints[startIndex + 3], moveTimeTrimmed), lastUp);
			mover.rotation = Quaternion.Slerp(mover.rotation, targetRot, 0.5f);
			lastUp = mover.up;
		}
	}

}

function generateDetailList() : List.<Vector3> {

	var ret : List.<Vector3> = new List.<Vector3>(controlPoints);
	
	for(var i = controlPoints.Count - 1; i >= 1; i--){
		var midP : Vector3 = (controlPoints[i] + controlPoints[i-1] ) / 2.0f;
		ret.Insert(i, midP);
	}
	return ret;
}


function OnDrawGizmos(){
	detailCpList = controlPoints;

	for(var i = 0; i < controlPoints.Count - 3; i+=3){
		//Debug.Log(i + " - " + detailCpList.Count);
		var cp : Vector3 = detailCpList[i];
		var cpControl : Vector3 = detailCpList[i + 1];
		var cpControl2 : Vector3 = detailCpList[i + 2];
		var cpEnd : Vector3 = detailCpList[i + 3];
		
		
		Gizmos.color = Color(0,1,0);
		Gizmos.DrawSphere(cp, 5);
		Gizmos.color = Color(1,1,0);
		Gizmos.DrawSphere(cpControl, 5);
		Gizmos.DrawSphere(cpControl2, 5);
		Gizmos.color = Color(1,0,0);
		Gizmos.DrawLine(cp, cpControl);
		Gizmos.DrawLine(cpEnd, cpControl2);
		
		var acc : float = 0;
		var step : float =  1.0f / divisions;
		var prevPos : Vector3 = cp;
		for(var p = 0; p < divisions; p++){
			var pos : Vector3 = Bezier(cp, cpControl, cpControl2, cpEnd, acc);
			
			Gizmos.color = Color(1,1,0);
			Gizmos.DrawLine(prevPos, pos);
			prevPos = pos;
			acc += step;
		}
		Gizmos.DrawLine(prevPos, cpEnd);
		
	}

	
	
}

function curveTangent(Start : Vector3, Control : Vector3,Control2 : Vector3, End : Vector3 , t :float) : Vector3 {
	//return 2 * (1-t) * (Control - Start) + 2 * t * (End - Control);
	return (3 * Mathf.Pow(1-t, 2) * (Control - Start)) + ( 6*(1-t)*t *(Control2 - Control)) + (3 * t * t * (End - Control2));
	
}

//shamelessly stolen from unity forums..
function Bezier(Start : Vector3, Control : Vector3, Control2 : Vector3, End : Vector3 , t :float) : Vector3
{
    //return (((1-t)*(1-t)) * Start) + (2 * t * (1 - t) * Control) + ((t * t) * End);
    return (Mathf.Pow(1-t, 3) * Start) + (3 * Mathf.Pow(1-t, 2) * t * Control) + (3*(1-t)*t*t*Control2 + (Mathf.Pow(t, 3) * End));
    
}

