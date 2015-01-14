using UnityEngine;
using System;



public class CometBehaviour:MonoBehaviour{
	
	
	public Vector3 velocity;
	public Vector3 rotSpeed;
	
	UniverseObject uniObj;
	
	
	public void Start() {
		uniObj = GetComponent<UniverseObject>();
	}
	
	public void FixedUpdate(){
		float mod = 1f;
		if(uniObj.inDetailSpace){
			mod = 1f;
		} else {
			mod = 0.02f;
		}
		transform.position += transform.TransformDirection(velocity * mod); 
		transform.rotation = transform.rotation * Quaternion.Euler(rotSpeed);
	
	}
	
	
	public void OnCollisionEnter(Collision c){
		if(c.gameObject.name == "TheShip"){
			//we whomped the player, blow them up
			GameObject theShip = GameObject.Find("TheShip");
			StartCoroutine(theShip.GetComponent<ShipCore>().damageShip(1000.0f, "Unplanned collision with Comet Surface"));
		} 
			
	}




}
