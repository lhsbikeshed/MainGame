#pragma strict
var wc : WebCamTexture;
var e : boolean = false;
var d : boolean = false;
function Start () {

}

function Update () {
	if(e){	
		e = false;
		show();
	} 
	if(d){
		d = false;
		hide();
	}
}

function setup(){
	
	var name : String = OSCHandler.Instance.configItems["cameraDeviceName"];
	wc = WebCamTexture(name);
	renderer.material.mainTexture = wc;
	wc.Play();
	hide();
}

function hide(){
	renderer.enabled = false;
}

function show(){
	renderer.enabled = true;
}