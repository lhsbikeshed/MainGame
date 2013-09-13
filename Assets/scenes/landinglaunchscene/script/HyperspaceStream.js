#pragma strict

var rotAmt : Vector3;

private var orgRot : Quaternion;


function Start () {
	orgRot = transform.rotation;
}

function Update () {
	var xAng : float = Mathf.Sin(Time.fixedTime) / rotAmt.x;
	var yAng : float = Mathf.Cos(Time.fixedTime) / rotAmt.y;
	transform.rotation = orgRot * Quaternion.EulerAngles(xAng,yAng,0);
	

}