using UnityEngine;
using System;
using System.Collections;

[System.Serializable]
public class TargettableObject: MonoBehaviour{
	public string objectName;
	public string stateText;
	public bool targetted = false;
	public int targetId = 0;
	public int scanCode = 1234;	//id to scan to target this missile
	
	
	public float health = 1.0f;
	
	
	public string[] statNames;
	public float[] statValues;
	
	
	
	public float baseDamage = 5.0f;
	public bool exploding  = false;
	public bool trackingPlayer = false;	//is this tracking the players movements?
	public bool damageable = true;
	public bool targettable  = true;
	public bool grappleable = false;
		
	
	public Color colour;
	public bool visibleAtClient = true;	//is the object visible at the client end?
	public bool visibleAtTactical = false;	//visible for tactical?
	public bool visibleAtPilot = true;		//visible for pilot?
	public bool highlighted = false;
	
	public bool doNotInterpolate = false;	//do not interpolate the position of this object at the radar client end
	
	
	
	public virtual void Start() {
		targetId = gameObject.GetHashCode();
		if(statNames == null || statValues == null){
			statNames = new String[2];
			statValues = new float[2];
		}
		statNames[0] = "health";
		
		statValues[0] = 1.0f;
		
	}
	
	public void setPosition(Vector3 newPosition){
		transform.position = newPosition;
		doNotInterpolate = true;	//this will be cleared after the next radar update. It prevents targets jumping around the radar
									//and looking crappy
	}
	
	/* object statistic handlers, "stats" are things sent to the radar/tactical comp when in range*/	
	public int getStatIdFromName(string n){
		for(int i = 0; i < statNames.Length; i++){
			if(statNames[i] == n){
				return i;
			}
		} 
		return -1;
	}
	
	public float getStatFromName(string s) {
		int ind = getStatIdFromName(s);
		if(ind != -1){
			return statValues[ind];
		}
		return -10000.0f;
	} 
	
	public void setStatFromName(string s,float val){
		int ind = getStatIdFromName(s);
		if(ind != -1){
			statValues[ind] = val;
		}
	}
		
	
	public virtual void Update() {
	
	}
	
	public virtual void GetShot(float damage){}
	
	
	public virtual IEnumerator explode(){
		yield return null;
	}
	
	public virtual void onTarget(){}
	public virtual void onUnTarget(){}
	
	public void gotGrappled() {}
	public void releaseGrapple(){}
}