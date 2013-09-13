#pragma strict

function Start () {
	//get a reference to the mesh
	var mesh : Mesh = GetComponent(MeshFilter).mesh;
	//reverse triangle winding
	var triangles:int[]=mesh.triangles;
	var numpolies : int =triangles.Length / 3;
	
	for(var t=0;t<numpolies;t++)
	    {
	    var tribuffer : int = triangles[t*3];
	    triangles[t*3]=triangles[(t*3)+2];
	    triangles[(t*3)+2]=tribuffer;
	    }
	
	mesh.triangles=triangles;
}

function Update () {

}