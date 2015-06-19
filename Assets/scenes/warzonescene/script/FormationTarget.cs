using UnityEngine;
using System.Collections;

public class FormationTarget : MonoBehaviour {

	public Transform theShip;

	public Vector3 distance;


	// Use this for initialization
	void Start () {
		if(theShip == null){
			theShip = GameObject.Find ("TheShip").transform;
		}
	
	}
	
	void FixedUpdate () {
		Vector3 pos = theShip.TransformDirection(distance);
		transform.position = theShip.position + pos;

	
	}
}
