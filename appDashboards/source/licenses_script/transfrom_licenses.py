import json
import os

# Define los nombres de los archivos de entrada y salida
input_file = 'licenses_file.json'
output_file = 'transformed_licenses.json'

# Lee el archivo JSON de entrada
with open(input_file, 'r') as file:
    data = json.load(file)

print("data", data)

# Lista para almacenar los objetos JSON transformados
transformed_data = []

# Itera sobre cada entrada en el JSON de entrada
for key, value in data[0].items():
    print("key", key)
    print("value", value)
    if 'licenseFile' in value:
        license_path = value['licenseFile']
        license_path = license_path.replace('/app/appDataCatalog', './..')
        print("license_path", license_path)
        try:
            with open(license_path, 'r') as license_file:
                license_text = license_file.read()
        except FileNotFoundError:
            license_text = "License file not found."
        print("license_text", license_text)
    else:
        license_text = "License file not found"
    package_name = key.split('@')[-2]
    version = key.split('@')[-1]
    print("package_name", package_name)
    print("version", version)
    new_object = {
        "License": value['licenses'],
        "LicenseText": license_text,
        "Name": package_name,
        "Version": version
    }
    transformed_data.append(new_object)

print("transformed_data", len(transformed_data))

# Escribe los objetos JSON transformados en el nuevo archivo JSON
with open(output_file, 'w') as file:
    json.dump(transformed_data, file, indent=4)