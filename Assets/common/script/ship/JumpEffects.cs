using UnityEngine;
using System.Collections;

public class JumpEffects : MonoBehaviour {
	ParticleSystem jumpEffect;

	public bool test = false;
	public bool effectActive = false;
	// Use this for initialization
	void Start () {
		jumpEffect = GetComponent<ParticleSystem>();
	}
	
	// Update is called once per frame
	void Update () {
		if(test){
			test = false;
			effectActive = !effectActive;
			setJumpEffectState(effectActive);
		}
	}

	public void setJumpEffectState(bool state){
		
		if(jumpEffect == null){
			jumpEffect = transform.Find("JumpEffects").GetComponent<ParticleSystem>();
		}
		effectActive = state;
		if(state){
			jumpEffect.enableEmission = true;
		} else {
			jumpEffect.enableEmission = false;
		}
	}

}
