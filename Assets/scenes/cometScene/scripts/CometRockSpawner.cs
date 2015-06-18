using UnityEngine;
using System;



public class CometRockSpawner:MonoBehaviour{
	
	
	public Transform[] rockPrefabs;
	public int poolSize = 20;
	
	public Bounds spawnArea;
	public float velAdjust = 1.0f;
	
	Transform[] rockPool;
	
	
	public float spawnRate = 1.0f;
	public float initialSpeed = 20f;
	
	float lastSpawnTime;
	float nextSpawnTime;
	Transform theShip;
	
	Vector3 startPosition;
	float bastardCooldown = 0.0f;
	
	bool spawnRocks = true;
	
	Plane ourPlane;
	ParticleSystem particles;
	
	
	public void Start() {
		theShip = GameObject.Find("TheShip").transform;
		startPosition = transform.position;
		rockPool = new Transform[poolSize];
		
		//fill the pool
		for(int i = 0; i < poolSize; i++){
			Transform t = (UnityEngine.Transform)Instantiate(rockPrefabs [ UnityEngine.Random.Range(0, rockPrefabs.Length) ] , new Vector3(0.0f,0.0f,-10000.0f), Quaternion.identity);
			t.gameObject.SetActive(false);
			
			rockPool[i] = t;
		}
		
		ourPlane = new Plane(transform.forward, transform.position);
		particles = GetComponentInChildren<ParticleSystem>();
	}
	
	public void OnDisable(){
		foreach(Transform t in rockPool){
			t.gameObject.SetActive (false);
			
		}
	}
	
	
	
	/* update the rate at which we spawn rocks */
	public void setRate(float newRate){
		if(newRate <= 0.1f){
			spawnRocks = false;
			particles.enableEmission = false;
	
		} else {
			spawnRocks = true;
			particles.enableEmission = true;
	
			spawnRate = newRate;
			nextSpawnTime = 1/spawnRate;
		}
	}
	
	public void FixedUpdate() {
		//scale the rate of particles depending on rock spawn rate
		particles.emissionRate = UsefulShit.map(spawnRate, 0.0f, 10f, 0f, 400f);
		
		//prevent GM from spamming the bastard spawner
		bastardCooldown -= Time.fixedDeltaTime;
		
		//match positions with the ship but move ahead of them so there is always rocks in its path
		Vector3 pos = theShip.position + theShip.GetComponent<Rigidbody>().velocity * velAdjust;	
		pos.z = startPosition.z;
		transform.position = pos;
		
		//spawn rocks
		if(spawnRocks){
			if(Time.fixedTime - lastSpawnTime > nextSpawnTime){
				lastSpawnTime = Time.fixedTime;
				nextSpawnTime =  1/spawnRate;
				spawnNew();	
			}
		}
	
	}
	
	public void spawnInFrontOfPlayer(){
		if(bastardCooldown < 0.0f){
			Transform t = findFreeFromPool();
			if(t != null){
				t.position = new Vector3(theShip.position.x, theShip.position.y, startPosition.z) + UnityEngine.Random.onUnitSphere * 15f;
				t.gameObject.SetActive(true);
				t.GetComponent<Rigidbody>().velocity = Vector3.forward * initialSpeed;
				bastardCooldown = 1f;
			}
			
		}
	
	}
	
	
	public void spawnNew(){
		Transform t = findFreeFromPool();
		if(t != null){
			Vector3 newpos = new Vector3(UnityEngine.Random.value * spawnArea.size.x, UnityEngine.Random.value * spawnArea.size.y, UnityEngine.Random.value * spawnArea.size.z) + transform.position - spawnArea.size / 2f;

			//test to see if this will intersect another rigidbody
			Collider[] collisions;
			float size = 15;
			do {

				collisions = Physics.OverlapSphere(newpos, size, LayerMask.NameToLayer("Default"));
				newpos += Vector3.forward * -size ;//shift it back a bit to prevent collision
				newpos.z -= 10;
			}while(collisions.Length > 0);

			t.GetComponent<TargettableObject>().setPosition(newpos);
			
			t.gameObject.SetActive(true);
			Quaternion randRot = Quaternion.Euler((float)UnityEngine.Random.Range(-5, 5), (float)UnityEngine.Random.Range(-5,5),0.0f);
			
			t.GetComponent<Rigidbody>().velocity = randRot * Vector3.forward * (initialSpeed + UnityEngine.Random.Range(-5,15));
		}
	}
	
	public Transform findFreeFromPool() {
		foreach(Transform t in rockPool){
			if(t.gameObject.activeInHierarchy == false){
				return t;
			}
		}
		return null;
		
	
	}
	
	
	public void OnDrawGizmosSelected(){
		Gizmos.DrawWireCube(transform.position + spawnArea.center, spawnArea.size);
	}
}
