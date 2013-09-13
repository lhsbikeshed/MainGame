#pragma strict

var shipPrefab : Transform; //ship prefab to use
var numberOfShips : int;
var size : float;

@HideInInspector
var shipList : Transform[];

function Start () {

	shipList = new Transform[numberOfShips];
	for(var a : Transform in shipList){
		var rPos = Random.onUnitSphere * size;
		a = Instantiate(shipPrefab, rPos, Random.rotation);
	}
}

function Update () {

}