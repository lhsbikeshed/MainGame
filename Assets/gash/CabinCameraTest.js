#pragma strict

function Start () {
Debug.Log(WebCamTexture.devices);
	var webcamTexture : WebCamTexture = WebCamTexture();
	renderer.material.mainTexture = webcamTexture;
	webcamTexture.Play();	
}

function Update () {

}