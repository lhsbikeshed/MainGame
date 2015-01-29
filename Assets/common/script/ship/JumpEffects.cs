using UnityEngine;
using System.Collections;

public class JumpEffects : MonoBehaviour {
	ParticleSystem jumpEffect;

	public bool test = false;
	public bool effectActive = false;
	public LightningEffects[] sparks;

	bool effectRunning = false;

	// Use this for initialization
	void Awake () {
		jumpEffect = GetComponent<ParticleSystem>();
		sparks = GetComponentsInChildren<LightningEffects>();
		foreach(LightningEffects r in sparks){
			r.stopEffect();
		}
	}
	
	// Update is called once per frame
	void Update () {
		if(test){
			test = false;
			effectActive = !effectActive;
			setJumpEffectState(effectActive);
		}
	}

	IEnumerator startEffects(){
		effectRunning = true;

		yield  return new WaitForSeconds (2);

		if(effectRunning){				//its possible the effect could have been cancelled after previous delay
			foreach(LightningEffects r in sparks){
				r.startEffect();
			}
		}

		yield return new WaitForSeconds (4);

		if(effectRunning){
			ExplosionOverlayBehaviour.instance.cooldownTime = 3f;
			ExplosionOverlayBehaviour.instance.explode();
		}



		
	}

	public void setJumpEffectState(bool state){
		
		if(jumpEffect == null){
			jumpEffect = GetComponent<ParticleSystem>();
		}
		effectActive = state;
		if(state){
			jumpEffect.Play();
			StartCoroutine(startEffects());
		} else {
			effectRunning = false;
			jumpEffect.Stop ();
			foreach(LightningEffects r in sparks){
				r.stopEffect();
			}
		}

	}

}
