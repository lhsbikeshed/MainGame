Shader "Custom/TextureBlend" {
	Properties {
		
		_MainTex ("1st Texture", 2D) = "white" {}
		_OtherTex ("2nd texture", 2D) = "white" {}
		_Amount ("blend", Range(0,1)) = 0
	}
	SubShader {
		Tags { "RenderType"="Opaque" }
		LOD 200
		
		CGPROGRAM
		// Physically based Standard lighting model, and enable shadows on all light types
		#pragma surface surf Standard fullforwardshadows

		// Use shader model 3.0 target, to get nicer looking lighting
		#pragma target 3.0

		sampler2D _MainTex;
		sampler2D _OtherTex;
		float _Amount;

		struct Input {
			float2 uv_MainTex;
		};

		void surf (Input IN, inout SurfaceOutputStandard o) {
			// Albedo comes from a texture tinted by color
			fixed4 mainCol = tex2D (_MainTex, IN.uv_MainTex);
			fixed4 texTwoCol = tex2D (_OtherTex, IN.uv_MainTex);
			fixed4 output = lerp(mainCol, texTwoCol, _Amount);
     		o.Albedo = output.rgb;
     		o.Alpha = output.a;
			
		}
		ENDCG
	} 
	FallBack "Diffuse"
}
