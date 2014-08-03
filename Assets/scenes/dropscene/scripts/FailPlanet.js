#pragma strict


var theShip : Transform;
var lightPos : Transform;


function Start () {
	theShip = GameObject.Find("TheShip").transform;
	
}

function Update () {
	renderer.material.SetVector("_ViewPos", theShip.position);
	renderer.material.SetVector("_SunPos", lightPos.position);

	
}
