using UnityEngine;
using System.Collections;

public class ExplodingBase : MonoBehaviour {

	public bool test = false;

	Transform theShip;

	// Use this for initialization
	void Start () {
		theShip = GameObject.Find ("TheShip").transform;
	
	}
	
	// Update is called once per frame
	void Update () {
		if(test){
			test = false;
			theShip.GetComponent<ExplosionOverlayBehaviour>().explode();
		}
	
	}
}
