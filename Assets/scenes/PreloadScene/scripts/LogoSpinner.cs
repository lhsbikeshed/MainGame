using UnityEngine;
using System.Collections;

public class LogoSpinner : MonoBehaviour {

	public float rate = 1.0f;

	public bool doHide = false;

	// Use this for initialization
	void Start () {
	
	}
	
	// Update is called once per frame
	void FixedUpdate () {
		if(doHide){
			if(Mathf.Abs(90 - transform.rotation.eulerAngles.y)  < 0.01f){
				gameObject.SetActive(false);
			}
		}
		transform.rotation *= Quaternion.Euler(0,rate,0);
	}
}
