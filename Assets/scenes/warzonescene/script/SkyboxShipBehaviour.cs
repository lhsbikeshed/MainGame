using UnityEngine;
using System;


public class SkyboxShipBehaviour:MonoBehaviour{
	
	public Vector3 velocity; //ships velocity
	public Transform laserTarget;		//where are we firing.
	public float laserSweetAmount;	//how much the laser sweeps about when firing
	public float laserChargeTime;	//number of millis to charge beam for
	public float health = 100.0f;
	
	
	[HideInInspector]
	
	public float nextShotTime; //next time to randomly target and fire at something
	public int state = 0;		//0 = alive, 1 = dying, 2 = dead
	
	
	
	public void Start() {
		nextShotTime = (float)UnityEngine.Random.Range(2,15);
	}
	
	public void Update() {
	
	}
	
	public void FixedUpdate(){
		if(state == 0){					//ALIVE FLY ABOUT AND SHOOT SHIT
			transform.position += transform.rotation * velocity;
			if(nextShotTime < Time.fixedTime){
				nextShotTime += (float)UnityEngine.Random.Range(2,15);
				GameObject[] tgList = GameObject.FindGameObjectsWithTag("skyboxShip");
				int rand = UnityEngine.Random.Range(0, tgList.Length);
				if(tgList[rand] != gameObject){
					fireAtTarget(tgList[rand].transform);
				}	
			}
		} else if(state == 1){			//DYING
		}
	}
	
	public void damage(float amt){
		health -= amt;
		
		if(health <=0){
			//BEGIN THE DEATH
			health = 0.0f;
			state = 1;
		}
	
	}
	
	public void fireAtTarget(){
		fireAtTarget(laserTarget);
	}
	
	public void fireAtTarget(Transform target){
		GetComponentInChildren<LaserTurretBehaviour>().setTarget(target);
		GetComponentInChildren<LaserTurretBehaviour>().startFiring();
	}
}