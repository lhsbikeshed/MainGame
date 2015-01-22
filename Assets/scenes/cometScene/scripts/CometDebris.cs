using UnityEngine;
using System;


public class CometDebris : GeneralTrackableTarget{
	
	public Transform theShip;
	public Material fadeMaterial;
	public Material mainMaterial;
	
	
	float alph = 0.0f;
	Material mat;
	bool fadeDone = false;
	
	public override void Start() {
		base.Start();
		theShip = GameObject.Find("TheShip").transform;
		
		rigidbody.angularVelocity = UnityEngine.Random.onUnitSphere * 0.1f;
		alph = 0.0f;
		
		mat = GetComponentInChildren<Renderer>().material;
		var tmp_cs1 = mat.color;
        tmp_cs1.a = alph;
        mat.color = tmp_cs1;
		fadeDone = false;
		
	}
	
	public void OnEnable(){
		GetComponentInChildren<Renderer>().material = fadeMaterial;
		alph = 0.0f;
		mat = GetComponentInChildren<Renderer>().material;
		var tmp_cs2 = mat.color;
        tmp_cs2.a = alph;
        mat.color = tmp_cs2;
		transform.rotation = UnityEngine.Random.rotation;
		fadeDone = false;
		GetComponent<TargettableObject>().highlighted = false;
		GetComponent<AudioSource>().pitch = UnityEngine.Random.Range(0.8f, 1.3f);
	}
	
	public void OnCollisionEnter(Collision c){
		
		if(c.gameObject.name == "TheShip" && c.relativeVelocity.magnitude > 11f){
			StartCoroutine(theShip.GetComponent<ShipCore>().damageShip((float)UnityEngine.Random.Range(10,15), "Hull cracked open by cometary fragments"));
		}
	}
	
	public void OnTriggerEnter(Collider c){
		if(c.name == "ShipMover"){
			TargettableObject trackable = GetComponent<TargettableObject>();
			if(trackable != null){
				trackable.highlighted = true;
			}
		}
	}
	
	public void OnTriggerExit(Collider c){
		if(c.name == "ShipMover"){
			TargettableObject trackable = GetComponent<TargettableObject>();
			if(trackable != null){
				trackable.highlighted = false;
			}
		}
	}
	
	public void FixedUpdate() {
		if(alph < 1.0f) {
			alph += 0.05f;
		} else {
			alph = 1.0f;
			fadeDone = true;
			GetComponentInChildren<Renderer>().material = mainMaterial;
		}
		alph = Mathf.Clamp(alph, 0.0f, 1.0f);
		var tmp_cs3 = mat.color;
        tmp_cs3.a = alph;
        mat.color = tmp_cs3;
	
	
		float dir = Vector3.Dot((transform.position - theShip.position).normalized, theShip.forward);
		if(dir < 0f){
			//its behind..
			//if((transform.position - theShip.position).magnitude > 50f){
			if(transform.position.z > 100f){
				//mark inactive and move out of harms way
				
				//transform.position = Vector3(0,0,-10000);
				GetComponent<TargettableObject>().setPosition(new Vector3(0.0f,0.0f,-10000.0f));
	
				transform.rotation = UnityEngine.Random.rotation;
				gameObject.SetActive(false);
			}
		} 
	
	}
}
