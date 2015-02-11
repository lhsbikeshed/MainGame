using UnityEngine;
using System.Collections;

public class LogoSpinner : MonoBehaviour {

	public float rate = 1.0f;

	public bool doHide = false;
	public bool done = false;
	bool doAlpha = false;
	Renderer[] childMaterials;
	float alpha = 1f;

	// Use this for initialization
	void Start () {
		childMaterials = GetComponentsInChildren<Renderer>();
	
	}
	
	// Update is called once per frame
	void FixedUpdate () {
		if(doHide){
			float diff = 0-(transform.rotation.eulerAngles.y%180);
			if(diff  <= 0.01f && diff >= 0.0f){
				doAlpha = true;
			}

			if(doAlpha){
				alpha -= 0.01f;
				if(alpha < 0.0f){
					alpha = 0.0f;
					done = true;
				}
				foreach(Renderer r in childMaterials){
					Color a = r.material.color;
					a.a = alpha;
					r.material.color = a;
				}
			}

		}
		transform.rotation *= Quaternion.Euler(0,rate,0);
	}
}
