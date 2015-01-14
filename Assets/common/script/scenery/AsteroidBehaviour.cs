using UnityEngine;
using System;

//real life asteroids
[System.Serializable]
public class AsteroidBehaviour: DynamicFieldObjectBehaviour{
	
	Quaternion randomRotationSpeed;
	public float alphaLevel; 
	
	Renderer meshRenderer;
	
	public override void Start() {
		randomRotationSpeed = Quaternion.Euler(UnityEngine.Random.value * 0.05f, UnityEngine.Random.value * 0.05f, UnityEngine.Random.value * 0.05f);
		
		meshRenderer = gameObject.GetComponentsInChildren<Renderer>()[0] as Renderer;
		
	}
	
	public void OnCollisionEnter(Collision c){
		if (c.gameObject.name == "TheShip"){
		
			StartCoroutine(GameObject.Find("TheShip").GetComponent<ShipCore>().damageShip((float)UnityEngine.Random.Range(2,12), "Smashed into iceball"));
			
		}
	
		
	}
	public override void resetTo(Vector3 newpos){
		rigidbody.isKinematic = true;
		alphaLevel = 0.0f;
		meshRenderer.material.color =  new Color(1.0f,1.0f,1.0f,alphaLevel);
		transform.position = newpos;
		
	}
	
	public override void Update() {
		transform.rotation *= randomRotationSpeed;
		meshRenderer.material.color =  new Color(1.0f,1.0f,1.0f,alphaLevel);
		if(alphaLevel < 1.0f){
			alphaLevel += 0.02f;
		} else {
			alphaLevel = 1.0f;
		}
		
	
	}
}
