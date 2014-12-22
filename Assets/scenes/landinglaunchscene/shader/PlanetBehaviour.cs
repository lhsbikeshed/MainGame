using UnityEngine;
using System.Collections;



public class PlanetBehaviour : MonoBehaviour {

	
	protected Material mat;
	private Transform lightSource;
	private Transform skyboxCamera;
	
	// Use this for initialization
	void Start () {
		
		//the unity editor coords and scale are out by a factor of 100
		//transform.position *= 1.0f / UniverseController._instance.universeScale;
		//transform.localScale *= 1.0f / UniverseController._instance.universeScale;
		mat = renderer.material;
		lightSource = GameObject.Find ("Directional light").transform;
		skyboxCamera = GameObject.Find("skyboxCamera").transform;
	
	}
	
	/* if ship is in influence area then test for other things
	 * if in gravity well then apply a force proportional to the gravity constant to the ship/object
	 * if in atmosphere then attach a fireball to the ship (objects later) and start to add drag to the rigidbody
	 * if distance < sealevel then boom
	 */
	void FixedUpdate(){
	}
	
	// Update is called once per frame
	void Update () {


		Vector3 viewP = (transform.position - skyboxCamera.position).normalized;

		mat.SetVector("_ViewPos", skyboxCamera.position);
		//move the sunposition in a bit so maths doesnt shit itself

		mat.SetVector("_SunPos", lightSource.forward);
	
	}
	

	
	
}
