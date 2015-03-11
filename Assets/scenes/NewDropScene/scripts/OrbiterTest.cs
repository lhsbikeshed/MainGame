using UnityEngine;
using System.Collections;

public class OrbiterTest : MonoBehaviour {

	public Transform orbitCentre;
	public float forceFalloff = 1.0f;
	public Vector3 initialSpeed = Vector3.forward ;

	// Use this for initialization
	void Start () {
		GetComponent<Rigidbody>().velocity	= transform.TransformDirection(initialSpeed);
	}
	
	// Update is called once per frame
	void FixedUpdate () {
		Vector3 dir = orbitCentre.position - transform.position;
		float magSq = dir.sqrMagnitude;
		float force = (GetComponent<Rigidbody>().mass + orbitCentre.GetComponent<Rigidbody>().mass) / magSq;
		force *= forceFalloff;
		GetComponent<Rigidbody>().AddForce(dir * force);



	}
}
