using UnityEngine;
using System.Collections;

public class hudtest : MonoBehaviour {

	// Use this for initialization
	Color col;
	void Start () {
		col = renderer.material.GetColor("_Color");
	}
	
	// Update is called once per frame
	void Update () {
		col.a = 0.5f  + (Mathf.Sin (Time.fixedTime) / 2.0f);
		renderer.material.SetColor("_Color", col);
	}
}
