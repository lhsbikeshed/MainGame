using UnityEngine;
using System.Collections;

public class OrbiterTest : MonoBehaviour {

	public Transform orbitCentre;
	public float forceFalloff = 1.0f;
	public Vector3 initialSpeed = Vector3.forward ;

	// Use this for initialization
	void Start () {
		rigidbody.velocity	= transform.TransformDirection(initialSpeed);
	}
	
	// Update is called once per frame
	void FixedUpdate () {
		Vector3 dir = orbitCentre.position - transform.position;
		float magSq = dir.sqrMagnitude;
		float force = (rigidbody.mass + orbitCentre.rigidbody.mass) / magSq;
		force *= forceFalloff;
		rigidbody.AddForce(dir * force);



	}
}
