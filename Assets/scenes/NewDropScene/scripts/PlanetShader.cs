using UnityEngine;
using System.Collections;

public class PlanetShader : MonoBehaviour {

	Transform camPos;
	Material material;

	// Use this for initialization
	void Start () {
		camPos = GameObject.Find ("skyboxCamera").transform;
		material = GetComponent<Renderer>().material;
	}
	
	// Update is called once per frame
	void Update () {
		material.SetVector("_ViewPos", camPos.position);
	}
}
