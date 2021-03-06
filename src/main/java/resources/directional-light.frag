/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2014-2015 Sri Harsha Chilakapati
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

#version 330 core

/**
 * The Material structure stores the details about the material
 */
struct Material
{
    vec4 ambientColor;
    vec4 diffuseColor;
    vec4 specularColor;

    float dissolve;
    float specularPower;
    float illumination;
};

// The light structure
struct Light
{
    vec3 direction;
    vec4 color;
    float intensity;
};

uniform mat4 mTransform;
uniform mat4 camProj;
uniform mat4 camView;

uniform sampler2D textureID;
uniform Material material;
uniform Light light;

in vec4 vColor;
in vec4 vNormal;
in vec4 vPosition;
in vec2 vTexCoords;

layout(location = 0) out vec4 fragColor;

vec4 getBaseColor()
{
    // Create the texture color
    vec4 texColor = texture(textureID, vTexCoords);
    vec4 baseColor = vec4(min(texColor.rgb + vColor.rgb, vec3(1.0)), texColor.a * vColor.a);
    return baseColor;
}

vec4 getDirectionalLight()
{
    // The matrices for transforming into different spaces
    mat4 modelMatrix = mTransform;
    mat3 normalMatrix = transpose(inverse(mat3(modelMatrix)));

    // The transformed normal and position
    vec3 normal = normalMatrix * vNormal.xyz;
    vec3 position = vec3(modelMatrix * vPosition);

    // The individual components of light
    vec4 ambientLight = vec4(0.0);
    vec4 diffuseLight = vec4(0.0);
    vec4 specularLight = vec4(0.0);

    // Invert the normal for lighting the second side
    if (!gl_FrontFacing)
        normal = -normal;

    // Calculate the ambient light
    ambientLight = light.color * material.ambientColor;

    // Calculate the diffuse light
    float diffuseFactor = dot(normalize(normal), -light.direction);

    if (diffuseFactor > 0.0)
    {
        diffuseLight = light.color * material.diffuseColor * diffuseFactor;

        // Calculate the specular light
        vec3 vertexToEye = normalize(vPosition.xyz - position);
        vec3 lightReflect = normalize(reflect(light.direction, normal));

        float specularFactor = dot(vertexToEye, lightReflect);
        specularFactor = pow(specularFactor, material.specularPower);

        if (specularFactor > 0)
            specularLight = light.color * specularFactor;
    }

    // Calculate the final directional light
    return (ambientLight + diffuseLight + specularLight) * light.intensity;
}

void main()
{
    fragColor = getBaseColor() * getDirectionalLight();
}
