using UnityEngine;
using System;


public class BigExplosionBehaviour:MonoBehaviour{
	
	public float maxSize = 100.0f;
	public float duration = 2.0f;
	public AnimationCurve sizeOverTime;
	public AnimationCurve alphaOverTime;
	
	float startTime;
	bool exploding = false;
	Renderer[] renderers;
	
	public bool test = false;
	public void Start() {
		renderers = GetComponentsInChildren<Renderer>();
		foreach(Renderer r in renderers){
			r.enabled = false;
		}
	}
	
	public void Explode(){
		startTime = Time.fixedTime;
		exploding = true;
		foreach(Renderer r in renderers){
			r.enabled = true;
		}
	}
	
	public void FixedUpdate() {
		if(test){
			test = false;
			Explode();
		}
	
		if(exploding){
			float t = (Time.fixedTime - startTime) / duration;
			transform.localScale = Vector3.one * sizeOverTime.Evaluate(t) * maxSize;
			foreach(Renderer r in renderers){
				var tmp_cs1 = r.material.color;
                tmp_cs1.a = alphaOverTime.Evaluate(t);
                r.material.color = tmp_cs1;
			}
			if(t > 1.0f){
				exploding = false;
				Destroy(gameObject);
			}
		}
		
	}
}