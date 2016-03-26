using UnityEngine;
using System;
using System.Collections.Generic;


public class FrontWindowBehaviour:MonoBehaviour{
	
	/* controls the Behaviour of the front window
	 * can be cracked if hit hard enough
	 */
	
	public Texture2D[] crashTextures;
	public Transform crackPrefab;
	public Transform airleakPrefab;
	
	public float airleakChance = 5.0f;
	public float repairTime = 10.0f;
	
	public float minSize = 0.01f;
	public float maxSize = 0.1f;
	public float minVel = 50.0f;
	public float maxVel = 300.0f;
	
	public bool leaking = false;
	public AudioClip leakSound;
	
	public float coolDownTime = 0.4f;
	float lastHitTime;
	
	float leakStartTime;
	List<Vector3> smashPos;
	public Camera cam;
	
	
	List<Transform> planes;
	Transform theShip;
	
	public bool test = false;
	
	public void Start() {
		smashPos  = new  System.Collections.Generic.List<Vector3>();
	
		
		planes = new System.Collections.Generic.List<UnityEngine.Transform>();
		crackPrefab.gameObject.SetActive(false);
		airleakPrefab.gameObject.SetActive (false);
		theShip = GameObject.Find("TheShip").transform;
		
	}
	
	public void FixedUpdate() {
		if(Input.GetKey("a") ){
			hitSomething((float)UnityEngine.Random.Range(50,300));
		}
		if(leaking){
			/*if(leakStartTime + repairTime < Time.fixedTime){
				leaking = false;
				
				theShip.GetComponent.<MiscSystem>().leaking = false;
				for(var p : ParticleSystem in GetComponentsInChildren.<ParticleSystem>() ){
					
					Destroy(p.gameObject);
					
				}
			}*/
		
			
		}	
	    
	}
	
	public void spawnCrack(float howHard){
	
			int rand = (int)(map(howHard, minVel, maxVel, 0.0f, (float)crashTextures.Length));
			if(rand >= crashTextures.Length){
				rand = crashTextures.Length - 1;
			}
			UnityEngine.Debug.Log(howHard + " " + rand);
			//Mathf.FloorToInt(Random.Range(0, crashTextures.Length));
			Transform p = (UnityEngine.Transform)Instantiate(crackPrefab, Vector3.zero, Quaternion.identity);
			p.gameObject.SetActive(true);
			p.GetComponent<Renderer>().material.mainTexture = crashTextures[rand];
			p.parent = transform;
			p.transform.localPosition = new Vector3(UnityEngine.Random.Range(-.9f,.9f), UnityEngine.Random.Range(-0.6f, 0.6f), 1.05f);
			//p.transform.localRotation = Quaternion.Euler(270, Random.Range(0,360), 0);
			p.transform.rotation =  transform.rotation * Quaternion.Euler(90.0f,0.0f,0.0f);  
			p.transform.localRotation *= Quaternion.Euler(0.0f, (float)UnityEngine.Random.Range(0,360),0.0f );
			float sc = (rand + 1) / 4.0f * Mathf.Clamp( (howHard - minVel) * (maxSize - minSize) / (maxVel - minVel) + minSize , minSize, maxSize);
			p.transform.localScale = Vector3.one * sc; //Random.Range(0.01, 0.1);
			
			//5% chance of causing an air leak if its a big hit AND we arent leaking already
			if(rand == 2 && UnityEngine.Random.Range(0,100) < airleakChance && leaking == false){
				Transform t = (UnityEngine.Transform)Instantiate(airleakPrefab, Vector3.zero, Quaternion.identity);
				t.gameObject.SetActive(true);
				t.parent = p;
				t.localPosition = new Vector3(-2.7f,0.0f,0.0f);
				t.transform.rotation = transform.rotation;// * Quaternion.Euler(-180,0,0);
				theShip.GetComponent<MiscSystem>().leaking = true;
				//particles.push(t);
				leaking = true;
				leakStartTime = Time.fixedTime;
				//UsefulShit.PlayClipAt(leakSound, transform.position);
				CabinEffects.Instance().QueueVoiceOver(leakSound,1);
			}
			planes.Add(p);
	}
	
	public void hitSomething(float st){
		
	//	var pos : Vector3 = Vector3(Random.Range(0,Screen.width), Random.Range(0,Screen.height),0);
	//	var rotation : Quaternion = Quaternion.EulerAngles(0,0, Random.Range(0,360));
	//	smashType.Push(Mathf.FloorToInt(Random.Range(0, crashTextures.Length)));
		
	//	smashPos.Push(pos);
		if(lastHitTime + coolDownTime < Time.fixedTime){
			lastHitTime = Time.fixedTime;
			spawnCrack(st);
		}
	}
	
	public float map(float x,float in_min,float in_max,float out_min,float out_max)
	{
	  return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
	}
}
