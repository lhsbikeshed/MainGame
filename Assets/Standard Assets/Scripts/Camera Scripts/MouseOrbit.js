var target : Transform;
var distance = 10.0;

var xSpeed = 250.0;
var ySpeed = 120.0;

var yMinLimit = -20;
var yMaxLimit = 80;

private var x = 0.0;
private var y = 0.0;

private var firstX = 0.0;
private var firstY = 0.0;


@script AddComponentMenu("Camera-Control/Mouse Orbit")

function Start () {
    var angles = transform.eulerAngles;
    x = angles.y;
    y = angles.x;

	// Make the rigid body not change rotation
   	if (rigidbody)
		rigidbody.freezeRotation = true;
}



function LateUpdate () {
	if (Input.GetButtonDown("Fire1")){
		firstX = Input.GetAxis("Mouse X");
		firstY = Input.GetAxis("Mouse Y");
		Debug.Log("Tits");
	}
    if (target ) {
        x += (firstX - Input.GetAxis("Mouse X")) * xSpeed * 0.02;
        y -= (firstY - Input.GetAxis("Mouse Y")) * ySpeed * 0.02;
 		
 		y = ClampAngle(y, yMinLimit, yMaxLimit);
 		       
        var rotation = Quaternion.Euler(y, x, 0);
        var position = rotation * Vector3(0.0, 0.0, -distance) + target.position;
        if (Input.GetButton("Fire1")){
        transform.rotation = rotation;
        transform.position = position;
        }
    }
}

static function ClampAngle (angle : float, min : float, max : float) {
	if (angle < -360)
		angle += 360;
	if (angle > 360)
		angle -= 360;
	return Mathf.Clamp (angle, min, max);
}