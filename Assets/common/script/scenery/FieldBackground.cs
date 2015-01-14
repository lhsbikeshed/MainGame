using UnityEngine;
using System;


public class FieldBackground:MonoBehaviour{
	public Transform target;
	public Vector3 rotation;
	Quaternion rot;
	
	public void Start() {
		rot = Quaternion.Euler(rotation.x, rotation.y, rotation.z);
	}
	
	public void Update() {
		transform.position = target.position;
		transform.rotation *= rot;
	}
}