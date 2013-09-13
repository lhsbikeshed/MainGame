#pragma strict

var size : Vector3;
var number : int;
var object : Transform;

private var objectList: Transform[];


function Start () {
	objectList = new Transform[number];
	for (var a in objectList){
		var rpos : Vector3;
		rpos = Vector3.Scale(Random.insideUnitSphere, size);
		
		a = Instantiate(object, transform.position + rpos, Random.rotation);
		
	}

}

function Update () {

}

function OnDrawGizmosSelected () {    
	Gizmos.color = Color (1,0,0,.5);   
	Gizmos.DrawWireCube (transform.position, size * 2);
	
}