using UnityEngine;
using System.Collections;

/*
 * Move an object forward at given speed
 */ 
public class ObjectMover : MonoBehaviour {

	public float speed = 10f;
	public Vector3 direction;
	public bool setDirectionAtStart = false;

	// Use this for initialization
	void Start () {
		if (setDirectionAtStart) {
			direction = transform.forward;
		}
	}
	
	// Update is called once per frame
	void FixedUpdate () {
				if (transform.parent != null) {
						transform.parent.position += direction * speed;	
				}
		}
}




