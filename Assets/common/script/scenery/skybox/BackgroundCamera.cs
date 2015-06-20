using UnityEngine;
using System.Collections;

public class BackgroundCamera : MonoBehaviour {

	Transform followObject;

	// Use this for initialization
	void Start () {
		if(followObject == null){
			followObject = GameObject.Find ("TheShip").transform;
		}
		transform.parent = null;


	}
	
	// Update is called once per frame
	void Update () {
		transform.rotation = followObject.rotation;

	
	}
}
