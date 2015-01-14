using UnityEngine;
using System;


public class MeshFlipper:MonoBehaviour{
	
	public void Start() {
		//get a reference to the mesh
		Mesh mesh = GetComponent<MeshFilter>().mesh;
		//reverse triangle winding
		int[] triangles=mesh.triangles;
		int numpolies =triangles.Length / 3;
		
		for(int t=0;t<numpolies;t++)
		    {
		    int tribuffer = triangles[t*3];
		    triangles[t*3]=triangles[(t*3)+2];
		    triangles[(t*3)+2]=tribuffer;
		    }
		
		mesh.triangles=triangles;
	}
	
	public void Update() {
	
	}
}