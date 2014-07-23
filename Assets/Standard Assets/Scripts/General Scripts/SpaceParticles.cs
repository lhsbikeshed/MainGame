using UnityEngine;
using System.Collections;

public class SpaceParticles : MonoBehaviour, CellChangeListener{
	public Transform target;
	public float distance ;
	
	public AnimationCurve speedCurve;

	public static SpaceParticles instance;
	
	void Start () {
		if(target == null){
			target = GameObject.Find("TheShip").transform;
		}

		instance = this;
	}
	
	void FixedUpdate () {
		transform.position = target.transform.position + (target.rigidbody.velocity.normalized * distance);
	
		transform.LookAt(target);
		transform.rotation *= Quaternion.Euler(180,0,0);
	
		if(target.rigidbody.velocity.magnitude < 10.0f){
			particleSystem.enableEmission = false;
		} else {
			particleSystem.enableEmission = true;
		}
	}

	/* toggle the effect on and off */
	public void SetState(bool state){
		if(state == false){
			particleSystem.enableEmission = false;
		} else {
			particleSystem.enableEmission = true;
		}
	}
	
	public void CellChanged(Vector3 offset){
		//we changed map cells causing the ship to reset its world pos
		//particles need moving back relative to the ship or they jitter
		//Debug.Log (offset);
		ParticleSystem.Particle[] particles = new ParticleSystem.Particle[particleSystem.particleCount+1];;
 		int pCount = particleSystem.GetParticles(particles);
	    // Do changes
	    for (int i = 0; i < pCount; i++)
	    {
	        particles[i].position -= offset;
	    }
	 
	    // Reassign back to emitter
	    particleSystem.SetParticles(particles, pCount);
	}
}
